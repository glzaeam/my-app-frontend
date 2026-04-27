using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;
using NexumAPI.Services;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/login-settings")]
    [Authorize]
    public class LoginSettingsController : ControllerBase
    {
        private readonly NexumDbContext _context;
        private readonly LockoutService _lockout;

        public LoginSettingsController(NexumDbContext context, LockoutService lockout)
        {
            _context = context;
            _lockout = lockout;
        }

        // GET /api/login-settings
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var settings = await _context.LoginSettings.FirstOrDefaultAsync();
            if (settings == null)
                return Ok(new {
                    maxFailedAttempts      = 5,
                    lockoutDuration        = 15,
                    ipWhitelistEnabled     = false,
                    allowedIps             = "",
                    sessionTimeoutMinutes  = 480,
                    maxConcurrentSessions  = 3
                });

            return Ok(new {
                settings.MaxFailedAttempts,
                settings.LockoutDuration,
                settings.IpWhitelistEnabled,
                settings.AllowedIps,
                settings.SessionTimeoutMinutes,
                settings.MaxConcurrentSessions
            });
        }

        // PUT /api/login-settings
        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] UpdateLoginSettingsRequest dto)
        {
            var settings = await _context.LoginSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                settings = new LoginSetting { Id = Guid.NewGuid() };
                _context.LoginSettings.Add(settings);
            }

            settings.MaxFailedAttempts     = dto.MaxFailedAttempts;
            settings.LockoutDuration       = dto.LockoutDuration;
            settings.IpWhitelistEnabled    = dto.IpWhitelistEnabled;
            settings.AllowedIps            = dto.AllowedIps;
            settings.SessionTimeoutMinutes = dto.SessionTimeoutMinutes;
            settings.MaxConcurrentSessions = dto.MaxConcurrentSessions;

            await _context.SaveChangesAsync();

            // Apply new settings to LockoutService
            _lockout.UpdateSettings(dto.MaxFailedAttempts, dto.LockoutDuration, dto.CaptchaAfter);

            return Ok(new { success = true, message = "Settings saved successfully" });
        }
    }

    public class UpdateLoginSettingsRequest
    {
        public int    MaxFailedAttempts     { get; set; } = 5;
        public int    LockoutDuration       { get; set; } = 15;
        public bool   IpWhitelistEnabled    { get; set; }
        public string? AllowedIps           { get; set; }
        public int    SessionTimeoutMinutes { get; set; } = 480;
        public int    MaxConcurrentSessions { get; set; } = 3;
        public int    CaptchaAfter          { get; set; } = 3;
    }
}