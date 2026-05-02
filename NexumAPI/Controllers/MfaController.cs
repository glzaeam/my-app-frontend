using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;
using OtpNet;

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

            var sub = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            bool userAuthenticatorEnabled = false;
            if (sub != null && Guid.TryParse(sub, out var userId))
            {
                userAuthenticatorEnabled = await _context.MfaSettings
                    .AnyAsync(m => m.UserId == userId
                                && m.Method == "Authenticator"
                                && m.IsEnabled == true);
            }

            if (config == null)
                return Ok(new {
                    smsEnabled           = true,
                    emailEnabled         = true,
                    authenticatorEnabled = userAuthenticatorEnabled,
                    codeExpiryMinutes    = 5,
                    graceLogins          = 0
                });

            return Ok(new {
                smsEnabled           = config.SmsEnabled,
                emailEnabled         = config.EmailEnabled,
                authenticatorEnabled = userAuthenticatorEnabled,
                codeExpiryMinutes    = config.CodeExpiryMinutes,
                graceLogins          = config.GraceLogins
            });
        }

        // PUT /api/mfa/config
        [HttpPut("config")]
        [Authorize(Roles = "System Admin")]
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
        [Authorize(Roles = "System Admin")]
        public async Task<IActionResult> UpdateRoleMfa(Guid id, [FromBody] RoleMfaRequest dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound(new { success = false, message = "Role not found" });

            role.MfaRequirement    = dto.MfaRequirement;
            role.MfaRequired       = dto.MfaRequirement == "Required";
            role.AllowedMfaMethods = dto.AllowedMfaMethods;

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

        // POST /api/mfa/authenticator/setup
        [HttpPost("authenticator/setup")]
        public async Task<IActionResult> SetupAuthenticator()
        {
            var sub = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (sub == null) return Unauthorized();

            var userId = Guid.Parse(sub);
            var user   = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var secretBytes = KeyGeneration.GenerateRandomKey(20);
            var secret      = Base32Encoding.ToString(secretBytes);

            var existing = await _context.MfaSettings
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Method == "Authenticator");

            if (existing != null)
            {
                existing.SecretKey = secret;
                existing.IsEnabled = false;
            }
            else
            {
                _context.MfaSettings.Add(new MfaSetting
                {
                    Id         = Guid.NewGuid(),
                    UserId     = userId,
                    Method     = "Authenticator",
                    SecretKey  = secret,
                    IsEnabled  = false,
                    EnrolledAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            var issuer = "NexumBank";
            var label  = Uri.EscapeDataString($"{issuer}:{user.Email}");
            var qrUri  = $"otpauth://totp/{label}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&algorithm=SHA1&digits=6&period=30";

            return Ok(new { secret, qrUri });
        }

        // POST /api/mfa/authenticator/verify
        [HttpPost("authenticator/verify")]
        public async Task<IActionResult> VerifyAuthenticator([FromBody] VerifyAuthenticatorRequest dto)
        {
            var sub = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (sub == null) return Unauthorized();

            var userId  = Guid.Parse(sub);
            var setting = await _context.MfaSettings
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Method == "Authenticator");

            if (setting?.SecretKey == null)
                return BadRequest(new { success = false, message = "No authenticator setup found. Run setup first." });

            var secretBytes = Base32Encoding.ToBytes(setting.SecretKey);
            var totp        = new Totp(secretBytes);
            var valid       = totp.VerifyTotp(dto.Code, out _, new VerificationWindow(2, 2));

            if (!valid)
                return Ok(new { success = false, message = "Invalid or expired code. Try again." });

            setting.IsEnabled  = true;
            setting.EnrolledAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Authenticator app verified and enabled." });
        }

        // POST /api/mfa/authenticator/disable
        [HttpPost("authenticator/disable")]
        public async Task<IActionResult> DisableAuthenticator()
        {
            var sub = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (sub == null) return Unauthorized();

            var userId  = Guid.Parse(sub);
            var setting = await _context.MfaSettings
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Method == "Authenticator");

            if (setting != null)
            {
                setting.IsEnabled = false;
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, message = "Authenticator disabled." });
        }

    }   // ← MfaController class ends here

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

    public class VerifyAuthenticatorRequest
    {
        public string Code { get; set; } = string.Empty;
    }
}