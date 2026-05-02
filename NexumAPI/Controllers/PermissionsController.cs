using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;
using System.Security.Claims;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/permissions")]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly NexumDbContext _context;
        public PermissionsController(NexumDbContext context) => _context = context;

        // GET /api/permissions/matrix — System Admin only
        [HttpGet("matrix")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> GetMatrix()
        {
            var data = await _context.Permissions
                .Include(p => p.Role)
                .Include(p => p.Module)
                .Select(p => new {
                    roleId    = p.RoleId,
                    role      = p.Role.Name,
                    moduleId  = p.ModuleId,
                    module    = p.Module.Name,
                    canView   = p.CanView,
                    canEdit   = p.CanEdit,
                    canDelete = p.CanDelete
                })
                .ToListAsync();

            return Ok(data);
        }

        // PUT /api/permissions/matrix — System Admin only
        [HttpPut("matrix")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> SaveMatrix([FromBody] List<PermissionUpdate> updates)
        {
            if (updates == null || !updates.Any())
                return BadRequest(new { success = false, message = "No updates provided" });

            var changes = new List<string>();

            foreach (var u in updates)
            {
                var perm = await _context.Permissions
                    .Include(p => p.Role)
                    .Include(p => p.Module)
                    .FirstOrDefaultAsync(p => p.RoleId == u.RoleId && p.ModuleId == u.ModuleId);

                if (perm != null)
                {
                    var diff = new List<string>();
                    if (perm.CanView   != u.CanView)   diff.Add($"View:{u.CanView}");
                    if (perm.CanEdit   != u.CanEdit)   diff.Add($"Edit:{u.CanEdit}");
                    if (perm.CanDelete != u.CanDelete) diff.Add($"Delete:{u.CanDelete}");

                    if (diff.Any())
                        changes.Add($"{perm.Role?.Name}/{perm.Module?.Name}: {string.Join(", ", diff)}");

                    perm.CanView   = u.CanView;
                    perm.CanEdit   = u.CanEdit;
                    perm.CanDelete = u.CanDelete;
                }
                else
                {
                    var role   = await _context.Roles.FindAsync(u.RoleId);
                    var module = await _context.Modules.FindAsync(u.ModuleId);

                    _context.Permissions.Add(new Permission {
                        Id        = Guid.NewGuid(),
                        RoleId    = u.RoleId,
                        ModuleId  = u.ModuleId,
                        CanView   = u.CanView,
                        CanEdit   = u.CanEdit,
                        CanDelete = u.CanDelete
                    });

                    if (role != null && module != null)
                        changes.Add($"{role.Name}/{module.Name}: View:{u.CanView}, Edit:{u.CanEdit}, Delete:{u.CanDelete}");
                }
            }

            if (changes.Any())
            {
                // ✅ Get the admin's name from JWT for audit log
                var adminName = User.FindFirstValue("name") ?? "System Admin";
                var adminId = Guid.TryParse(User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var txn = Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper();

                _context.AuditLogs.Add(new AuditLog {
                    Action    = "Permission Matrix Updated",
                    Module    = "Permissions",
                    Details   = $"Updated by {adminName}. Changes: {string.Join(" | ", changes)}",
                    Status    = "Success",
                    CreatedAt = DateTime.UtcNow,
                    IpAddress = ip
                });

                _context.TransactionTrails.Add(new TransactionTrail {
                    Id        = Guid.NewGuid(),
                    TxnId     = txn,
                    Action    = "Permission Matrix Updated",
                    Module    = "Permissions",
                    Details   = $"Permissions updated by {adminName}. {changes.Count} changes: {string.Join(" | ", changes)}",
                    PerformedBy = adminId,
                    Status    = "Success",
                    CreatedAt = DateTime.UtcNow,
                    IpAddress = ip
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Permissions saved", changesCount = changes.Count });
        }

        // GET /api/permissions/modules — System Admin only (for Permission Matrix UI)
        [HttpGet("modules")]
        [Authorize(Policy = "SystemAdmin")]
        public async Task<IActionResult> GetModules()
        {
            var modules = await _context.Modules
                .OrderBy(m => m.Name)
                .Select(m => new { m.Id, m.Name, m.Description, m.Route })
                .ToListAsync();
            return Ok(modules);
        }

        // GET /api/permissions/role/{roleId} — ANY authenticated user can fetch their own role's permissions
        // This is used by AuthContext on login to build the sidebar dynamically
        [HttpGet("role/{roleId}")]
        [Authorize] // ✅ Any logged-in user — Bank Teller, Auditor, everyone
        public async Task<IActionResult> GetByRole(Guid roleId)
        {
            // ✅ Security check: non-admins can only fetch their OWN role's permissions
            var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRoles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            var isAdmin = userRoles.Contains("System Admin");

            if (!isAdmin)
            {
                // Verify the requested roleId belongs to the calling user
                if (!Guid.TryParse(sub, out var userId))
                    return Unauthorized();

                var userOwnsRole = await _context.UserRoles
                    .AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId);

                if (!userOwnsRole)
                    return Forbid(); // Can't fetch someone else's permissions
            }

            var perms = await _context.Permissions
                .Include(p => p.Module)
                .Where(p => p.RoleId == roleId)
                .Select(p => new {
                    moduleId  = p.ModuleId,
                    module    = p.Module.Name,   // ✅ This matches sidebar item ids
                    canView   = p.CanView,
                    canEdit   = p.CanEdit,
                    canDelete = p.CanDelete
                })
                .ToListAsync();

            return Ok(perms);
        }

        // GET /api/permissions/my — convenience endpoint: fetch current user's own permissions
        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyPermissions()
        {
            var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(sub, out var userId))
                return Unauthorized();

            var userRole = await _context.UserRoles
                .Include(ur => ur.Role)
                .FirstOrDefaultAsync(ur => ur.UserId == userId);

            if (userRole == null)
                return Ok(new List<object>());

            // System Admin always gets full access marker
            if (userRole.Role?.Name == "System Admin")
                return Ok(new { isSystemAdmin = true, permissions = new List<object>() });

            var perms = await _context.Permissions
                .Include(p => p.Module)
                .Where(p => p.RoleId == userRole.RoleId)
                .Select(p => new {
                    moduleId  = p.ModuleId,
                    module    = p.Module.Name,
                    canView   = p.CanView,
                    canEdit   = p.CanEdit,
                    canDelete = p.CanDelete
                })
                .ToListAsync();

            return Ok(new { isSystemAdmin = false, permissions = perms });
        }
    }

    public class PermissionUpdate
    {
        public Guid RoleId    { get; set; }
        public Guid ModuleId  { get; set; }
        public bool CanView   { get; set; }
        public bool CanEdit   { get; set; }
        public bool CanDelete { get; set; }
    }
}