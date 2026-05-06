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

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var settings = await _context.LoginSettings.FirstOrDefaultAsync();
            if (settings == null)
                return Ok(new {
                    maxFailedAttempts     = 5,
                    lockoutDuration       = 15,
                    captchaAfter          = 3,
                    ipBlockingEnabled     = false,
                    blockedIps            = "",
                    sessionTimeoutMinutes = 480,
                    maxConcurrentSessions = 3
                });

            return Ok(new {
                maxFailedAttempts     = settings.MaxFailedAttempts,
                lockoutDuration       = settings.LockoutDuration,
                captchaAfter          = settings.CaptchaAfter,
                ipBlockingEnabled     = settings.IpBlockingEnabled,
                blockedIps            = settings.BlockedIps,
                sessionTimeoutMinutes = settings.SessionTimeoutMinutes,
                maxConcurrentSessions = settings.MaxConcurrentSessions
            });
        }

        [HttpPut]
        [Authorize(Roles = "System Admin")]
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
            settings.CaptchaAfter          = dto.CaptchaAfter;
            settings.IpBlockingEnabled     = dto.IpBlockingEnabled;
            settings.BlockedIps            = dto.BlockedIps ?? "";
            settings.SessionTimeoutMinutes = dto.SessionTimeoutMinutes;
            settings.MaxConcurrentSessions = dto.MaxConcurrentSessions;

            await _context.SaveChangesAsync();

            // Update in-memory lockout service immediately
            _lockout.UpdateSettings(dto.MaxFailedAttempts, dto.LockoutDuration, dto.CaptchaAfter);

            return Ok(new { success = true, message = "Settings saved successfully" });
        }

        /// <summary>
        /// Called by auth middleware to check if an incoming IP is blocked.
        /// Returns 403 if blocked, 200 if allowed.
        /// </summary>
        [HttpGet("check-ip")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckIp([FromQuery] string ip)
        {
            if (string.IsNullOrWhiteSpace(ip))
                return BadRequest(new { blocked = false, message = "IP is required" });

            var settings = await _context.LoginSettings.FirstOrDefaultAsync();
            if (settings == null || !settings.IpBlockingEnabled || string.IsNullOrWhiteSpace(settings.BlockedIps))
                return Ok(new { blocked = false });

            var blockedList = settings.BlockedIps
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(e => e.Trim())
                // Each entry may be "1.2.3.4 (Label) — Reason", extract just the IP/CIDR part
                .Select(e => e.Split(' ')[0].Trim())
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .ToList();

            bool isBlocked = blockedList.Any(entry => IpMatchesEntry(ip, entry));

            if (isBlocked)
                return StatusCode(403, new { blocked = true, message = "Access denied: your IP address has been blocked." });

            return Ok(new { blocked = false });
        }

        /// <summary>
        /// Matches an IP against a single entry which can be an exact IP or a CIDR range.
        /// </summary>
        private static bool IpMatchesEntry(string ip, string entry)
        {
            // Exact match
            if (ip == entry) return true;

            // CIDR match e.g. 192.168.1.0/24
            if (entry.Contains('/'))
            {
                try
                {
                    var parts      = entry.Split('/');
                    var network    = System.Net.IPAddress.Parse(parts[0]);
                    int prefixLen  = int.Parse(parts[1]);
                    var incoming   = System.Net.IPAddress.Parse(ip);

                    var networkBytes  = network.GetAddressBytes();
                    var incomingBytes = incoming.GetAddressBytes();

                    if (networkBytes.Length != incomingBytes.Length) return false;

                    int fullBytes = prefixLen / 8;
                    int remainder = prefixLen % 8;

                    for (int i = 0; i < fullBytes; i++)
                        if (networkBytes[i] != incomingBytes[i]) return false;

                    if (remainder > 0)
                    {
                        int mask = 0xFF << (8 - remainder);
                        if ((networkBytes[fullBytes] & mask) != (incomingBytes[fullBytes] & mask))
                            return false;
                    }

                    return true;
                }
                catch { return false; }
            }

            return false;
        }
    }

    public class UpdateLoginSettingsRequest
    {
        public int     MaxFailedAttempts     { get; set; } = 5;
        public int     LockoutDuration       { get; set; } = 15;
        public int     CaptchaAfter          { get; set; } = 3;
        public bool    IpBlockingEnabled     { get; set; }
        public string? BlockedIps            { get; set; }
        public int     SessionTimeoutMinutes { get; set; } = 480;
        public int     MaxConcurrentSessions { get; set; } = 3;
    }
}