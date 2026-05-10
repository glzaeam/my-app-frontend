using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;

namespace NexumAPI.Authorization
{
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string ModuleName { get; }
        public PermissionRequirement(string moduleName) => ModuleName = moduleName;
    }

    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly NexumDbContext _context;
        public PermissionHandler(NexumDbContext context) => _context = context;

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            // System Admin always passes
            if (context.User.IsInRole("System Admin"))
            {
                context.Succeed(requirement);
                return;
            }

            var roleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
            var roleName = context.User.FindFirst(roleClaimType)?.Value;
            if (string.IsNullOrEmpty(roleName)) return;

            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == roleName);
            if (role == null) return;

            // ✅ correct DbSet name is "Permissions"
            var hasPermission = await _context.Permissions
                .Include(p => p.Module)
                .AnyAsync(p =>
                    p.RoleId == role.Id &&
                    p.Module.Name == requirement.ModuleName &&
                    p.CanView);

            if (hasPermission)
                context.Succeed(requirement);
        }
    }
}
