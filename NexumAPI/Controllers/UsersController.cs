using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;
using NexumAPI.Services;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly NexumDbContext _context;
        private readonly EmailService   _email;

        public UsersController(NexumDbContext context, EmailService email)
        {
            _context = context;
            _email   = email;
        }

        // GET /api/users — BranchManager and above
        [HttpGet]
        [Authorize(Policy = "BranchManager")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .OrderBy(u => u.Name)
                .Select(u => new {
                    u.Id,
                    u.EmployeeId,
                    u.Name,
                    u.Email,
                    u.Department,
                    u.Status,
                    u.MfaEnabled,
                    u.CreatedAt,
                    u.LastLogin,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET /api/users/{id} — BranchManager and above
        [HttpGet("{id}")]
        [Authorize(Policy = "BranchManager")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { success = false, message = "User not found" });

            return Ok(new {
                user.Id,
                user.EmployeeId,
                user.Name,
                user.Email,
                user.Department,
                user.Status,
                user.MfaEnabled,
                user.CreatedAt,
                user.LastLogin,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
            });
        }

        // POST /api/users — System Admin only
        [HttpPost]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest dto)
        {
            if (await _context.Users.AnyAsync(u => u.EmployeeId == dto.EmployeeId))
                return Ok(new { success = false, message = "Employee ID already exists" });

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return Ok(new { success = false, message = "Email already in use" });

            if (dto.Password.Length < 8)
                return Ok(new { success = false, message = "Password must be at least 8 characters" });

            var nameParts = dto.Name.Trim().Split(' ');
            var firstName = nameParts[0];
            var lastName  = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "-";

            var user = new User
            {
                Id           = Guid.NewGuid(),
                EmployeeId   = dto.EmployeeId,
                FirstName    = firstName,
                LastName     = lastName,
                Username     = (firstName + lastName).ToLower().Replace(" ", ""),
                Name         = dto.Name,
                Email        = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Department   = dto.Department,
                Status       = "Active",
                MfaEnabled   = false,
                CreatedAt    = DateTime.UtcNow
            };

            _context.Users.Add(user);

            if (!string.IsNullOrEmpty(dto.Role))
            {
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == dto.Role)
                        ?? await _context.Roles.FirstAsync();

                _context.UserRoles.Add(new UserRole {
                    UserId     = user.Id,
                    RoleId     = role.Id,
                    AssignedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            await _email.SendWelcomeEmailAsync(user.Email, user.Name, user.EmployeeId, dto.Password);

            return Ok(new { success = true, message = "User created successfully", userId = user.Id });
        }

        // PUT /api/users/{id} — System Admin only
        [HttpPut("{id}")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { success = false, message = "User not found" });

            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                    return Ok(new { success = false, message = "Email already in use" });
                user.Email = dto.Email;
            }

            if (!string.IsNullOrEmpty(dto.Name))
            {
                user.Name = dto.Name;
                var parts      = dto.Name.Trim().Split(' ');
                user.FirstName = parts[0];
                user.LastName  = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "-";
            }

            if (!string.IsNullOrEmpty(dto.Department)) user.Department = dto.Department;
            if (!string.IsNullOrEmpty(dto.Status))     user.Status     = dto.Status;

            if (!string.IsNullOrEmpty(dto.Role))
            {
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == dto.Role);
                if (role != null)
                {
                    _context.UserRoles.RemoveRange(user.UserRoles);
                    _context.UserRoles.Add(new UserRole {
                        UserId     = user.Id,
                        RoleId     = role.Id,
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "User updated successfully" });
        }

        // PUT /api/users/{id}/deactivate — System Admin only
        [HttpPut("{id}/deactivate")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> Deactivate(Guid id, [FromBody] DeactivateUserRequest dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { success = false, message = "User not found" });

            user.Status = "Inactive";
            await _context.SaveChangesAsync();

            _context.AuditLogs.Add(new AuditLog {
                UserId    = id,
                Action    = "User Deactivated",
                Module    = "Users",
                Details   = $"Reason: {dto.Reason ?? "Not specified"}",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "User deactivated successfully" });
        }

        // POST /api/users/{id}/reset-password — System Admin only
        [HttpPost("{id}/reset-password")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> AdminResetPassword(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { success = false, message = "User not found" });

            var existing = await _context.PasswordResetTokens
                .Where(t => t.UserId == id && !t.Used)
                .ToListAsync();
            _context.PasswordResetTokens.RemoveRange(existing);

            var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            _context.PasswordResetTokens.Add(new PasswordResetToken {
                UserId    = id,
                Token     = token,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                Used      = false,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var frontendUrl = HttpContext.RequestServices
                .GetRequiredService<IConfiguration>()["Frontend:Url"] ?? "http://localhost:3000";

            var resetLink = $"{frontendUrl}/reset-password?token={token}";
            await _email.SendPasswordResetAsync(user.Email, user.Name, resetLink);

            return Ok(new { success = true, message = $"Password reset link sent to {user.Email}" });
        }

        // POST /api/users/{id}/change-password — any authenticated user
        [HttpPost("{id}/change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordRequest dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { success = false, message = "User not found" });

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return Ok(new { success = false, message = "Current password is incorrect" });

            if (dto.NewPassword.Length < 8)
                return Ok(new { success = false, message = "Password must be at least 8 characters" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            _context.AuditLogs.Add(new AuditLog {
                UserId    = id,
                Action    = "Password Changed",
                Module    = "My Profile",
                Details   = "User changed their own password",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Password changed successfully" });
        }

        // PATCH /api/users/{id}/profile-image — any authenticated user
        [HttpPatch("{id}/profile-image")]
        [Authorize]
        public async Task<IActionResult> UpdateProfileImage(Guid id, [FromBody] UpdateProfileImageRequest dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { success = false, message = "User not found" });

            user.ProfileImageUrl = dto.ProfileImageUrl;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Profile image updated", profileImageUrl = user.ProfileImageUrl });
        }

        // PATCH /api/users/{id}/toggle-mfa — any authenticated user (own account)
        [HttpPatch("{id}/toggle-mfa")]
        [Authorize]
        public async Task<IActionResult> ToggleMfa(Guid id, [FromBody] ToggleMfaRequest dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { success = false, message = "User not found" });

            user.MfaEnabled = dto.MfaEnabled;

            // Also update MfaSettings table
            var mfaSetting = await _context.MfaSettings.FirstOrDefaultAsync(m => m.UserId == id);
            if (mfaSetting != null)
            {
                mfaSetting.IsEnabled  = dto.MfaEnabled;
                mfaSetting.Method     = dto.MfaEnabled ? "Email" : "None";
                mfaSetting.EnrolledAt = DateTime.UtcNow;
            }
            else
            {
                _context.MfaSettings.Add(new MfaSetting
                {
                    UserId     = id,
                    IsEnabled  = dto.MfaEnabled,
                    Method     = dto.MfaEnabled ? "Email" : "None",
                    EnrolledAt = DateTime.UtcNow
                });
            }

            _context.AuditLogs.Add(new AuditLog
            {
                UserId    = id,
                Action    = dto.MfaEnabled ? "MFA Enabled" : "MFA Disabled",
                Module    = "My Profile",
                Details   = $"User {(dto.MfaEnabled ? "enabled" : "disabled")} MFA on their account",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();

            return Ok(new {
                success = true,
                message = $"MFA {(dto.MfaEnabled ? "enabled" : "disabled")} successfully"
            });
        }
    }

    public class CreateUserRequest
    {
        public string  Name       { get; set; } = string.Empty;
        public string  EmployeeId { get; set; } = string.Empty;
        public string  Email      { get; set; } = string.Empty;
        public string  Password   { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? Branch     { get; set; }
        public string? Role       { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? Name       { get; set; }
        public string? Email      { get; set; }
        public string? Department { get; set; }
        public string? Branch     { get; set; }
        public string? Role       { get; set; }
        public string? Status     { get; set; }
    }

    public class DeactivateUserRequest
    {
        public string? Reason { get; set; }
        public string? Notes  { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword     { get; set; } = string.Empty;
    }

    public class UpdateProfileImageRequest
    {
        public string ProfileImageUrl { get; set; } = string.Empty;
    }

    public class ToggleMfaRequest
    {
        public bool MfaEnabled { get; set; }
    }
}