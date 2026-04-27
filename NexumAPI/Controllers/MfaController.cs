using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/mfa")]
    [Authorize]
    public class MfaController : ControllerBase
    {
        private readonly NexumDbContext _context;
        public MfaController(NexumDbContext context) => _context = context;

        // GET /api/mfa/config
        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            var config = await _context.MfaConfigs.FirstOrDefaultAsync();
            if (config == null)
                return Ok(new {
                    smsEnabled           = true,
                    emailEnabled         = true,
                    authenticatorEnabled = false,
                    codeExpiryMinutes    = 5,
                    graceLogins          = 0
                });

            return Ok(new {
                config.SmsEnabled,
                config.EmailEnabled,
                config.AuthenticatorEnabled,
                config.CodeExpiryMinutes,
                config.GraceLogins
            });
        }

        // PUT /api/mfa/config
        [HttpPut("config")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SaveConfig([FromBody] MfaConfigRequest dto)
        {
            var config = await _context.MfaConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new MfaConfig { Id = Guid.NewGuid() };
                _context.MfaConfigs.Add(config);
            }

            config.SmsEnabled           = dto.SmsEnabled;
            config.EmailEnabled         = dto.EmailEnabled;
            config.AuthenticatorEnabled = dto.AuthenticatorEnabled;
            config.CodeExpiryMinutes    = dto.CodeExpiryMinutes;
            config.GraceLogins          = dto.GraceLogins;
            config.UpdatedAt            = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "MFA config saved" });
        }

        // GET /api/mfa/roles
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoleMfa()
        {
            var roles = await _context.Roles
                .Include(r => r.UserRoles)
                .Select(r => new {
                    r.Id,
                    r.Name,
                    r.MfaRequired,
                    r.MfaRequirement,
                    r.AllowedMfaMethods,
                    UserCount = r.UserRoles.Count
                })
                .ToListAsync();

            return Ok(roles);
        }

        // PUT /api/mfa/roles/{id}
        [HttpPut("roles/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRoleMfa(Guid id, [FromBody] RoleMfaRequest dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound(new { success = false, message = "Role not found" });

            role.MfaRequirement    = dto.MfaRequirement;
            role.MfaRequired       = dto.MfaRequirement == "Required";
            role.AllowedMfaMethods = dto.AllowedMfaMethods;

            // Update MfaEnabled on all users with this role
            var userIds = await _context.UserRoles
                .Where(ur => ur.RoleId == id)
                .Select(ur => ur.UserId)
                .ToListAsync();

            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync();

            foreach (var user in users)
                user.MfaEnabled = role.MfaRequired;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Role MFA updated" });
        }
    }

    public class MfaConfigRequest
    {
        public bool SmsEnabled           { get; set; }
        public bool EmailEnabled         { get; set; }
        public bool AuthenticatorEnabled { get; set; }
        public int  CodeExpiryMinutes    { get; set; }
        public int  GraceLogins          { get; set; }
    }

    public class RoleMfaRequest
    {
        public string  MfaRequirement    { get; set; } = "Optional";
        public string? AllowedMfaMethods { get; set; }
    }
}