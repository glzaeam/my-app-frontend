using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/roles")]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly NexumDbContext _context;
        public RolesController(NexumDbContext context) => _context = context;

        // GET /api/roles — BranchManager and above
        [HttpGet]
        [Authorize(Policy = "BranchManager")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Include(r => r.UserRoles)
                .Include(r => r.Permissions).ThenInclude(p => p.Module)
                .Select(r => new {
                    r.Id,
                    r.Name,
                    r.Description,
                    r.MfaRequired,
                    r.MfaRequirement,
                    UserCount = r.UserRoles.Count,
                    Modules   = r.Permissions.Select(p => p.Module.Name).Distinct().ToList()
                })
                .ToListAsync();
            return Ok(roles);
        }

        // GET /api/roles/{id}/users — BranchManager and above
        [HttpGet("{id}/users")]
        [Authorize(Policy = "BranchManager")]
        public async Task<IActionResult> GetRoleUsers(Guid id)
        {
            var users = await _context.UserRoles
                .Include(ur => ur.User)
                .Where(ur => ur.RoleId == id)
                .Select(ur => new {
                    ur.User.Id,
                    ur.User.Name,
                    ur.User.EmployeeId,
                    ur.User.Email,
                    ur.User.Department,
                    ur.User.Status,
                    ur.AssignedAt
                })
                .ToListAsync();
            return Ok(users);
        }

        // POST /api/roles — System Admin only
        [HttpPost]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> CreateRole([FromBody] RoleRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return Ok(new { success = false, message = "Role name is required" });
            if (await _context.Roles.AnyAsync(r => r.Name == dto.Name))
                return Ok(new { success = false, message = "Role already exists" });

            var role = new Role {
                Id          = Guid.NewGuid(),
                Name        = dto.Name.Trim(),
                Description = dto.Description
            };
            _context.Roles.Add(role);

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            _context.AuditLogs.Add(new AuditLog {
                Action    = "Role Created",
                Module    = "Role Management",
                Details   = $"Role '{dto.Name}' created",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = ip
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Role created", roleId = role.Id });
        }

        // PUT /api/roles/{id} — System Admin only
        [HttpPut("{id}")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> UpdateRole(Guid id, [FromBody] RoleRequest dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound(new { success = false, message = "Role not found" });

            if (!string.IsNullOrWhiteSpace(dto.Name)) role.Name        = dto.Name.Trim();
            if (dto.Description != null)              role.Description = dto.Description;

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            _context.AuditLogs.Add(new AuditLog {
                Action    = "Role Updated",
                Module    = "Role Management",
                Details   = $"Role '{role.Name}' updated",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = ip
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Role updated" });
        }

        // DELETE /api/roles/{id} — System Admin only
        [HttpDelete("{id}")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> DeleteRole(Guid id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return NotFound(new { success = false, message = "Role not found" });
            if (role.UserRoles.Any())
                return Ok(new { success = false, message = $"Cannot delete — {role.UserRoles.Count} users assigned to this role" });

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            _context.AuditLogs.Add(new AuditLog {
                Action    = "Role Deleted",
                Module    = "Role Management",
                Details   = $"Role '{role.Name}' deleted",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = ip
            });

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Role deleted" });
        }

        // POST /api/roles/assign — System Admin only
        [HttpPost("assign")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == dto.UserId);

            if (user == null)
                return Ok(new { success = false, message = "User not found" });

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == dto.RoleId);
            if (role == null)
                return Ok(new { success = false, message = "Role not found" });

            var oldRole = user.UserRoles.FirstOrDefault();
            var oldRoleName = oldRole != null
                ? (await _context.Roles.FindAsync(oldRole.RoleId))?.Name ?? "None"
                : "None";

            _context.UserRoles.RemoveRange(user.UserRoles);

            _context.UserRoles.Add(new UserRole {
                UserId     = user.Id,
                RoleId     = role.Id,
                AssignedAt = DateTime.UtcNow
            });

            var ip  = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var txn = $"TXN-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

            _context.AuditLogs.Add(new AuditLog {
                UserId    = dto.UserId,
                Action    = "Role Assigned",
                Module    = "Role Management",
                Target    = user.Name,
                Details   = $"Role changed from '{oldRoleName}' to '{role.Name}' for {user.EmployeeId}. TXN: {txn}",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = ip
            });

            _context.TransactionTrails.Add(new TransactionTrail {
                Id           = Guid.NewGuid(),
                TxnId        = txn,
                Action       = "Role Assignment",
                Module       = "Role Management",
                Details      = $"User '{user.Name}' ({user.EmployeeId}) role changed from '{oldRoleName}' to '{role.Name}'",
                PerformedBy  = dto.PerformedBy,
                TargetUserId = dto.UserId,
                Status       = "Success",
                CreatedAt    = DateTime.UtcNow,
                IpAddress    = ip
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Role '{role.Name}' assigned to {user.Name}", txnId = txn });
        }

        // GET /api/roles/hierarchy — BranchManager and above
        [HttpGet("hierarchy")]
        [Authorize(Policy = "BranchManager")]
        public async Task<IActionResult> GetHierarchy()
        {
            var hierarchy = await _context.RoleHierarchies
                .Include(h => h.ParentRole)
                .Include(h => h.ChildRole)
                .OrderBy(h => h.Level)
                .Select(h => new {
                    h.Id,
                    h.Level,
                    ParentRoleId   = h.ParentRoleId,
                    ParentRoleName = h.ParentRole.Name,
                    ChildRoleId    = h.ChildRoleId,
                    ChildRoleName  = h.ChildRole.Name,
                })
                .ToListAsync();
            return Ok(hierarchy);
        }

        // PUT /api/roles/hierarchy — System Admin only
        [HttpPut("hierarchy")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> SaveHierarchy([FromBody] List<HierarchyRequest> dto)
        {
            var existing = await _context.RoleHierarchies.ToListAsync();
            _context.RoleHierarchies.RemoveRange(existing);

            foreach (var h in dto)
            {
                _context.RoleHierarchies.Add(new RoleHierarchy {
                    Id           = Guid.NewGuid(),
                    ParentRoleId = h.ParentRoleId,
                    ChildRoleId  = h.ChildRoleId,
                    Level        = h.Level
                });
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            _context.AuditLogs.Add(new AuditLog {
                Action    = "Role Hierarchy Updated",
                Module    = "Role Management",
                Details   = $"{dto.Count} hierarchy rules saved",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = ip
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Hierarchy saved" });
        }

        // GET /api/roles/transaction-trail — Auditor and above
        [HttpGet("transaction-trail")]
        [Authorize(Policy = "Auditor")]
        public async Task<IActionResult> GetTransactionTrail()
        {
            var trail = await _context.TransactionTrails
                .Include(t => t.Performer)
                .Include(t => t.TargetUser)
                .OrderByDescending(t => t.CreatedAt)
                .Take(200)
                .Select(t => new {
                    t.Id,
                    t.TxnId,
                    t.Action,
                    t.Module,
                    t.Details,
                    t.Status,
                    t.CreatedAt,
                    t.IpAddress,
                    PerformedBy = t.Performer  != null ? t.Performer.Name  : "System",
                    TargetUser  = t.TargetUser != null ? t.TargetUser.Name : "—",
                })
                .ToListAsync();
            return Ok(trail);
        }
    }

    public class RoleRequest
    {
        public string  Name        { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class AssignRoleRequest
    {
        public Guid  UserId      { get; set; }
        public Guid  RoleId      { get; set; }
        public Guid? PerformedBy { get; set; }
    }

    public class HierarchyRequest
    {
        public Guid ParentRoleId { get; set; }
        public Guid ChildRoleId  { get; set; }
        public int  Level        { get; set; }
    }
}