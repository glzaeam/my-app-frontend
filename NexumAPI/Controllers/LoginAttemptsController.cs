using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/login-attempts")]
    [Authorize]
    public class LoginAttemptsController : ControllerBase
    {
        private readonly NexumDbContext _context;
        public LoginAttemptsController(NexumDbContext context) => _context = context;

        // GET /api/login-attempts
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            var query = _context.LoginAttempts
                .Include(l => l.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "all")
                query = query.Where(l => l.Status == status);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(l =>
                    (l.User != null && l.User.Name.Contains(search)) ||
                    (l.User != null && l.User.EmployeeId.Contains(search)) ||
                    (l.IpAddress != null && l.IpAddress.Contains(search)));

            var logs = await query
                .OrderByDescending(l => l.AttemptedAt)
                .Take(500)
                .Select(l => new {
                    l.Id,
                    IpAddress     = l.IpAddress == "::1" ? "127.0.0.1 (localhost)" : l.IpAddress,
                    l.Status,
                    l.FailureReason,
                    l.AttemptedAt,
                    EmployeeId = l.User != null ? l.User.EmployeeId : "Unknown",
                    UserName   = l.User != null ? l.User.Name       : "Unknown",
                })
                .ToListAsync();

            return Ok(logs);
        }

        // GET /api/login-attempts/summary
        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            var today  = DateTime.UtcNow.Date;
            var cutoff = DateTime.UtcNow.AddHours(-24);

            var total   = await _context.LoginAttempts.CountAsync();
            var failed  = await _context.LoginAttempts.CountAsync(l => l.Status == "Failed");
            var blocked = await _context.LoginAttempts.CountAsync(l => l.Status == "Blocked");
            var todayCount = await _context.LoginAttempts.CountAsync(l => l.AttemptedAt >= today);

            var blockedIps = await _context.LoginAttempts
                .Where(l => l.Status == "Failed" && l.AttemptedAt >= cutoff && l.IpAddress != null)
                .GroupBy(l => l.IpAddress)
                .Where(g => g.Count() >= 5)
                .CountAsync();

            return Ok(new { total, failed, blocked, todayCount, blockedIps });
        }

        // GET /api/login-attempts/blocked-ips
        [HttpGet("blocked-ips")]
        public async Task<IActionResult> BlockedIps()
        {
            var cutoff = DateTime.UtcNow.AddHours(-24);

            var ips = await _context.LoginAttempts
                .Where(l => l.Status == "Failed" && l.AttemptedAt >= cutoff && l.IpAddress != null)
                .GroupBy(l => l.IpAddress)
                .Where(g => g.Count() >= 5)
                .Select(g => new {
                    IpAddress    = g.Key,
                    FailureCount = g.Count(),
                    LastAttempt  = g.Max(l => l.AttemptedAt),
                })
                .OrderByDescending(x => x.FailureCount)
                .ToListAsync();

            return Ok(ips);
        }

        // POST /api/login-attempts/record
        [HttpPost("record")]
        [AllowAnonymous]
        public async Task<IActionResult> Record([FromBody] RecordAttemptRequest dto)
        {
            var attempt = new LoginAttempt {
                Id            = Guid.NewGuid(),
                UserId        = dto.UserId,
                IpAddress     = dto.IpAddress,
                Status        = dto.Status,
                FailureReason = dto.FailureReason,
                AttemptedAt   = DateTime.UtcNow,
            };
            _context.LoginAttempts.Add(attempt);

            // Write audit log
            _context.AuditLogs.Add(new AuditLog {
                UserId    = dto.UserId,
                Action    = dto.Status == "Success" ? "Login Success" : "Login Failed",
                Module    = "Authentication",
                Details   = $"Status: {dto.Status}. Reason: {dto.FailureReason ?? "N/A"}. IP: {dto.IpAddress}",
                Status    = dto.Status == "Success" ? "Success" : "Failed",
                CreatedAt = DateTime.UtcNow,
                IpAddress = dto.IpAddress ?? "unknown",
            });

            // Check threshold → create security alert
            if (dto.Status == "Failed" && !string.IsNullOrEmpty(dto.IpAddress))
            {
                var settings  = await _context.LoginSettings.FirstOrDefaultAsync();
                int threshold = settings?.MaxFailedAttempts ?? 5;
                var window    = DateTime.UtcNow.AddMinutes(-15);

                var recentFailures = await _context.LoginAttempts
                    .CountAsync(l => l.IpAddress == dto.IpAddress
                                  && l.Status == "Failed"
                                  && l.AttemptedAt >= window);

                if (recentFailures >= threshold - 1)
                {
                    var alertWindow = DateTime.UtcNow.AddHours(-1);
                    var existing    = await _context.SecurityAlerts
                        .AnyAsync(a => a.Description.Contains(dto.IpAddress)
                                    && a.CreatedAt >= alertWindow
                                    && a.Status == "active");

                    if (!existing)
                    {
                        _context.SecurityAlerts.Add(new SecurityAlert {
                            Id          = Guid.NewGuid(),
                            UserId      = dto.UserId,
                            AlertType   = "Brute Force Detected",
                            Severity    = recentFailures >= threshold * 2 ? "critical" : "high",
                            Description = $"Repeated login failures from IP {dto.IpAddress}. {recentFailures + 1} attempts in 15 minutes.",
                            Status      = "active",
                            CreatedAt   = DateTime.UtcNow,
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }

    public class RecordAttemptRequest
    {
        public Guid?   UserId        { get; set; }
        public string? IpAddress     { get; set; }
        public string  Status        { get; set; } = "Failed";
        public string? FailureReason { get; set; }
    }
}