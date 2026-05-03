using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;
using NexumAPI.Helpers;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/security")]
    [Authorize]
    public class SecurityController : ControllerBase
    {
        private readonly NexumDbContext _context;
        public SecurityController(NexumDbContext context) => _context = context;

        // GET /api/security/alerts — Auditor and above
        [HttpGet("alerts")]
        [Authorize(Policy = "Auditor")]  // ✅ was "BranchManager" — Auditor excluded
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _context.SecurityAlerts
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new {
                    a.Id, a.AlertType, a.Severity,
                    a.Description, a.Status, a.CreatedAt, a.ResolvedAt,
                    UserName   = a.User != null ? a.User.Name       : "Unknown",
                    EmployeeId = a.User != null ? a.User.EmployeeId : "—",
                })
                .ToListAsync();

            return Ok(alerts);
        }

        // GET /api/security/alerts/summary — all authenticated users
        [HttpGet("alerts/summary")]
        [Authorize]  // ✅ already correct
        public async Task<IActionResult> GetAlertSummary()
        {
            var total    = await _context.SecurityAlerts.CountAsync();
            var critical = await _context.SecurityAlerts.CountAsync(a => a.Severity == "critical");
            var high     = await _context.SecurityAlerts.CountAsync(a => a.Severity == "high");
            var active   = await _context.SecurityAlerts.CountAsync(a => a.Status   == "active");

            return Ok(new { total, critical, high, active });
        }

        // PUT /api/security/alerts/{id}/resolve — System Admin only
        [HttpPut("alerts/{id}/resolve")]
        [Authorize(Policy = "SystemAdmin")]  // ✅ already correct
        public async Task<IActionResult> ResolveAlert(Guid id)
        {
            var alert = await _context.SecurityAlerts.FindAsync(id);
            if (alert == null) return NotFound(new { success = false, message = "Alert not found" });

            alert.Status     = "resolved";
            alert.ResolvedAt = DateTime.UtcNow;

            _context.AuditLogs.Add(new AuditLog {
                Action    = "Security Alert Resolved",
                Module    = "Security Monitoring",
                Details   = $"Alert '{alert.AlertType}' (severity: {alert.Severity}) resolved",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Alert resolved" });
        }

        // PUT /api/security/alerts/{id}/acknowledge — System Admin only
        [HttpPut("alerts/{id}/acknowledge")]
        [Authorize(Policy = "SystemAdmin")]  // ✅ already correct
        public async Task<IActionResult> AcknowledgeAlert(Guid id)
        {
            var alert = await _context.SecurityAlerts.FindAsync(id);
            if (alert == null) return NotFound(new { success = false, message = "Alert not found" });

            alert.Status = "acknowledged";

            _context.AuditLogs.Add(new AuditLog {
                Action    = "Security Alert Acknowledged",
                Module    = "Security Monitoring",
                Details   = $"Alert '{alert.AlertType}' (severity: {alert.Severity}) acknowledged by admin",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Alert acknowledged" });
        }

        // PUT /api/security/alerts/{id}/dismiss — System Admin only
        [HttpPut("alerts/{id}/dismiss")]
        [Authorize(Policy = "SystemAdmin")]  // ✅ already correct
        public async Task<IActionResult> DismissAlert(Guid id)
        {
            var alert = await _context.SecurityAlerts.FindAsync(id);
            if (alert == null) return NotFound(new { success = false, message = "Alert not found" });

            alert.Status     = "dismissed";
            alert.ResolvedAt = DateTime.UtcNow;

            _context.AuditLogs.Add(new AuditLog {
                Action    = "Security Alert Dismissed",
                Module    = "Security Monitoring",
                Details   = $"Alert '{alert.AlertType}' dismissed by admin",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Alert dismissed" });
        }

        // PUT /api/security/alerts/{id}/investigate — System Admin only
        [HttpPut("alerts/{id}/investigate")]
        [Authorize(Policy = "SystemAdmin")]  // ✅ already correct
        public async Task<IActionResult> InvestigateAlert(Guid id)
        {
            var alert = await _context.SecurityAlerts.FindAsync(id);
            if (alert == null) return NotFound(new { success = false, message = "Alert not found" });

            alert.Status = "investigating";

            _context.AuditLogs.Add(new AuditLog {
                Action    = "Security Alert Under Investigation",
                Module    = "Security Monitoring",
                Details   = $"Alert '{alert.AlertType}' (severity: {alert.Severity}) marked for investigation",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Alert marked for investigation" });
        }

        // GET /api/security/failed-logins — Auditor and above
        [HttpGet("failed-logins")]
        [Authorize(Policy = "Auditor")]  // ✅ was "BranchManager" — Auditor excluded
        public async Task<IActionResult> GetFailedLogins(
            [FromQuery] int page     = 1,
            [FromQuery] int pageSize = 10)
        {
            page     = PaginationHelper.ValidatePage(page);
            pageSize = PaginationHelper.ValidatePageSize(pageSize);

            var query      = _context.LoginAttempts.Include(l => l.User).AsQueryable();
            var totalItems = await query.CountAsync();

            var logs = await query
                .OrderByDescending(l => l.AttemptedAt)
                .Skip(PaginationHelper.CalculateSkip(page, pageSize))
                .Take(pageSize)
                .Select(l => new {
                    l.Id,
                    IpAddress = l.IpAddress == "::1" ? "127.0.0.1 (localhost)" : l.IpAddress,
                    l.Status,
                    l.FailureReason,
                    l.AttemptedAt,
                    EmployeeId = l.User != null ? l.User.EmployeeId : "Unknown",
                    UserName   = l.User != null ? l.User.Name       : "Unknown",
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<dynamic>(
                logs.Cast<dynamic>().ToList(),
                page,
                pageSize,
                totalItems
            ));
        }

        // GET /api/security/failed-logins/summary — Auditor and above
        [HttpGet("failed-logins/summary")]
        [Authorize(Policy = "Auditor")]  // ✅ was "BranchManager" — Auditor excluded
        public async Task<IActionResult> GetFailedLoginSummary()
        {
            var total   = await _context.LoginAttempts.CountAsync(l => l.Status == "Failed");
            var today   = await _context.LoginAttempts.CountAsync(l => l.Status == "Failed" && l.AttemptedAt >= DateTime.UtcNow.Date);
            var blocked = await _context.LoginAttempts.CountAsync(l => l.Status == "Blocked");
            var locked  = await _context.LoginAttempts.CountAsync(l => l.Status == "Failed" && l.FailureReason == "Account locked");

            return Ok(new { total, today, blocked, locked });
        }

        // GET /api/security/devices — Auditor and above
        [HttpGet("devices")]
        [Authorize(Policy = "Auditor")]  // ✅ was "BranchManager" — Auditor excluded
        public async Task<IActionResult> GetDevices()
        {
            var devices = await _context.Devices
                .Include(d => d.User)
                .OrderByDescending(d => d.LastUsed)
                .Select(d => new {
                    d.Id, d.DeviceName, d.DeviceType,
                    d.OS, d.Browser,
                    IpAddress = d.IpAddress == "::1" ? "127.0.0.1 (localhost)" : d.IpAddress,
                    d.Location, d.IsTrusted, d.LastUsed, d.Status,
                    UserName   = d.User.Name,
                    EmployeeId = d.User.EmployeeId,
                })
                .ToListAsync();

            return Ok(devices);
        }

        // PUT /api/security/devices/{id}/revoke — System Admin only
        [HttpPut("devices/{id}/revoke")]
        [Authorize(Policy = "SystemAdmin")]  // ✅ already correct
        public async Task<IActionResult> RevokeDevice(Guid id)
        {
            var device = await _context.Devices
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (device == null) return NotFound(new { success = false, message = "Device not found" });

            device.IsTrusted = false;
            device.Status    = "revoked";

            var sessions = await _context.Sessions
                .Where(s => s.UserId == device.UserId && s.Status == "Active")
                .ToListAsync();
            foreach (var s in sessions) s.Status = "Ended";

            _context.AuditLogs.Add(new AuditLog {
                UserId    = device.UserId,
                Action    = "Device Revoked",
                Module    = "Device Tracking",
                Target    = device.User?.Name ?? device.UserId.ToString(),
                Details   = $"Device '{device.DeviceName ?? "Unknown"}' ({device.OS}, {device.Browser}) revoked. {sessions.Count} session(s) terminated.",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Device revoked and {sessions.Count} session(s) terminated" });
        }

        // PUT /api/security/devices/{id}/trust — System Admin only
        [HttpPut("devices/{id}/trust")]
        [Authorize(Policy = "SystemAdmin")]  // ✅ already correct
        public async Task<IActionResult> TrustDevice(Guid id)
        {
            var device = await _context.Devices
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (device == null) return NotFound(new { success = false, message = "Device not found" });

            var wasSuspicious = device.Status == "suspicious";
            device.IsTrusted  = true;
            device.Status     = "active";

            _context.AuditLogs.Add(new AuditLog {
                UserId    = device.UserId,
                Action    = "Device Trusted",
                Module    = "Device Tracking",
                Target    = device.User?.Name ?? device.UserId.ToString(),
                Details   = $"Device '{device.DeviceName ?? "Unknown"}' marked as trusted",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            if (wasSuspicious)
            {
                _context.SecurityAlerts.Add(new SecurityAlert {
                    Id          = Guid.NewGuid(),
                    UserId      = device.UserId,
                    AlertType   = "Device Trusted",
                    Severity    = "low",
                    Description = $"Previously suspicious device '{device.DeviceName}' has been manually trusted by admin.",
                    Status      = "resolved",
                    CreatedAt   = DateTime.UtcNow,
                    ResolvedAt  = DateTime.UtcNow,
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Device marked as trusted" });
        }
    }
}