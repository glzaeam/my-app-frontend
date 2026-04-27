using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.DTOs.Auth;
using NexumAPI.Models;
using NexumAPI.Services;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/access-requests")]
    public class AccessRequestController : ControllerBase
    {
        private readonly NexumDbContext _context;
        private readonly EmailService _email;

        public AccessRequestController(NexumDbContext context, EmailService email)
        {
            _context = context;
            _email   = email;
        }

        // POST /api/access-requests — submit new request (public)
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] AccessRequestDto dto)
        {
            bool userExists = await _context.Users
                .AnyAsync(u => u.EmployeeId == dto.EmployeeId || u.Email == dto.Email);

            if (userExists)
                return Ok(new { success = false, message = "EmployeeId or Email already in use" });

            bool pendingExists = await _context.AccessRequests
                .AnyAsync(r => r.EmployeeId == dto.EmployeeId && r.Status == "Pending");

            if (pendingExists)
                return Ok(new { success = false, message = "A pending request already exists for this Employee ID" });

            var request = new AccessRequest
            {
                FullName      = dto.FullName,
                EmployeeId    = dto.EmployeeId,
                Email         = dto.Email,
                Department    = dto.Department,
                Branch        = dto.Branch,
                RequestedRole = dto.RequestedRole,
                PasswordHash  = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Status        = "Pending",
                CreatedAt     = DateTime.UtcNow
            };

            _context.AccessRequests.Add(request);
            await _context.SaveChangesAsync();

            // ✅ Fixed: notify System Admin users
            var admins = await _context.Users
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "System Admin"))
                .ToListAsync();

            foreach (var admin in admins)
            {
                if (!string.IsNullOrEmpty(admin.Email))
                    await _email.SendAccessRequestNotificationAsync(
                        admin.Email, admin.Name, dto.FullName, dto.EmployeeId);
            }

            return Ok(new { success = true, message = "Access request submitted successfully" });
        }

        // GET /api/access-requests — System Admin only
        [HttpGet]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var query = _context.AccessRequests.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.FullName,
                    r.EmployeeId,
                    r.Email,
                    r.Department,
                    r.Branch,
                    r.RequestedRole,
                    r.Status,
                    r.ReviewedBy,
                    r.RejectionReason,
                    r.CreatedAt,
                    r.ReviewedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        // PUT /api/access-requests/{id}/review — System Admin only
        [HttpPut("{id}/review")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> Review(Guid id, [FromBody] ReviewAccessRequestDto dto)
        {
            var request = await _context.AccessRequests.FindAsync(id);
            if (request == null)
                return NotFound(new { success = false, message = "Request not found" });

            if (request.Status != "Pending")
                return Ok(new { success = false, message = "Request already reviewed" });

            var reviewerName = User.FindFirst("name")?.Value ?? "System Admin";

            if (dto.Action == "Approve")
            {
                var nameParts = request.FullName.Trim().Split(' ');
                var firstName = nameParts[0];
                var lastName  = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "-";

                // ✅ Fixed: fallback to "Bank Teller" instead of "User"
                var role = await _context.Roles
                    .FirstOrDefaultAsync(r => r.Name == request.RequestedRole)
                    ?? await _context.Roles.FirstAsync(r => r.Name == "Bank Teller");

                var user = new User
                {
                    FirstName    = firstName,
                    LastName     = lastName,
                    Username     = firstName.ToLower() + lastName.ToLower(),
                    Name         = request.FullName,
                    EmployeeId   = request.EmployeeId,
                    Email        = request.Email,
                    PasswordHash = request.PasswordHash,
                    Department   = request.Department,
                    Status       = "Active",
                    MfaEnabled   = false,
                    CreatedAt    = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _context.UserRoles.Add(new UserRole
                {
                    UserId     = user.Id,
                    RoleId     = role.Id,
                    AssignedAt = DateTime.UtcNow,
                    AssignedBy = null
                });

                request.Status     = "Approved";
                request.ReviewedBy = reviewerName;
                request.ReviewedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _email.SendAccessApprovedAsync(request.Email, request.FullName, request.EmployeeId);

                return Ok(new { success = true, message = "Request approved and user account created" });
            }
            else if (dto.Action == "Reject")
            {
                request.Status          = "Rejected";
                request.ReviewedBy      = reviewerName;
                request.ReviewedAt      = DateTime.UtcNow;
                request.RejectionReason = dto.RejectionReason;

                await _context.SaveChangesAsync();

                await _email.SendAccessRejectedAsync(request.Email, request.FullName, dto.RejectionReason);

                return Ok(new { success = true, message = "Request rejected" });
            }

            return BadRequest(new { success = false, message = "Invalid action. Use 'Approve' or 'Reject'" });
        }
    }
}