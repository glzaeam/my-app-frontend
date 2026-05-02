using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;

[ApiController]
[Route("api/sessions")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly NexumDbContext _context;
    public SessionsController(NexumDbContext context) => _context = context;

    private static string ParseDevice(string userAgent)
    {
        string browser = userAgent.Contains("Edg/")     ? "Edge"
                       : userAgent.Contains("Chrome/")  ? "Chrome"
                       : userAgent.Contains("Firefox/") ? "Firefox"
                       : userAgent.Contains("Safari/")  ? "Safari"
                       : "Browser";
        string os = userAgent.Contains("Windows") ? "Windows"
                  : userAgent.Contains("Mac")     ? "macOS"
                  : userAgent.Contains("iPhone")  ? "iPhone"
                  : userAgent.Contains("Android") ? "Android"
                  : userAgent.Contains("Linux")   ? "Linux"
                  : "Unknown OS";
        return $"{browser} / {os}";
    }

    [HttpGet("active")]
    public async Task<IActionResult> ActiveSessions()
    {
        var sessions = await _context.Sessions
            .Include(s => s.User).ThenInclude(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Where(s => s.Status == "Active")
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new {
                s.Id, s.Status,
                IpAddress  = s.IpAddress == "::1" ? "127.0.0.1 (localhost)" : s.IpAddress,
                DeviceInfo = s.DeviceInfo != null ? ParseDevice(s.DeviceInfo) : "Unknown",
                s.StartedAt, s.ExpiresAt,
                UserName   = s.User != null ? s.User.Name       : "Unknown",
                EmployeeId = s.User != null ? s.User.EmployeeId : "—",
                Role       = s.User != null ? s.User.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "—" : "—",
            }).ToListAsync();
        return Ok(sessions);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "System Admin")]
    public async Task<IActionResult> TerminateSession(Guid id)
    {
        var session = await _context.Sessions.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == id);
        if (session == null) return NotFound(new { success = false, message = "Session not found" });
        session.Status = "Ended";
        _context.AuditLogs.Add(new AuditLog {
            UserId = session.UserId, Action = "Session Terminated", Module = "Session Management",
            Target = session.User?.Name ?? session.UserId.ToString(),
            Details = $"Session terminated by admin. IP: {session.IpAddress}, Device: {session.DeviceInfo}",
            Status = "Success", CreatedAt = DateTime.UtcNow,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
        });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Session terminated" });
    }

    [HttpDelete("terminate-all")]
    [Authorize(Roles = "System Admin")]
    public async Task<IActionResult> TerminateAllSessions()
    {
        var sessions = await _context.Sessions.Where(s => s.Status == "Active").ToListAsync();
        foreach (var s in sessions) s.Status = "Ended";
        _context.AuditLogs.Add(new AuditLog {
            Action = "All Sessions Terminated", Module = "Session Management",
            Details = $"{sessions.Count} active sessions terminated by admin",
            Status = "Success", CreatedAt = DateTime.UtcNow,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
        });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = $"{sessions.Count} sessions terminated" });
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var s = await _context.LoginSettings.FirstOrDefaultAsync();
        return Ok(new {
            idleTimeoutMinutes    = s?.SessionTimeoutMinutes   ?? 15,
            maxSessionHours       = s?.MaxSessionDurationHours ?? 8,
            maxConcurrentSessions = s?.MaxConcurrentSessions   ?? 3,
            forceLogoutOnNew      = s?.ForceLogoutOnNew        ?? true
        });
    }

    [HttpPut("settings")]
    [Authorize(Roles = "System Admin")]
    public async Task<IActionResult> SaveSettings([FromBody] SessionSettingsRequest dto)
    {
        var settings = await _context.LoginSettings.FirstOrDefaultAsync();
        if (settings == null) { settings = new LoginSetting { Id = Guid.NewGuid() }; _context.LoginSettings.Add(settings); }
        settings.SessionTimeoutMinutes   = dto.IdleTimeoutMinutes;
        settings.MaxSessionDurationHours = dto.MaxSessionHours;
        settings.MaxConcurrentSessions   = dto.MaxConcurrentSessions;
        settings.ForceLogoutOnNew        = dto.ForceLogoutOnNew;
        _context.AuditLogs.Add(new AuditLog {
            Action = "Session Settings Updated", Module = "Session Management",
            Details = $"Idle: {dto.IdleTimeoutMinutes}min, Max: {dto.MaxSessionHours}hrs, Concurrent: {dto.MaxConcurrentSessions}, ForceLogout: {dto.ForceLogoutOnNew}",
            Status = "Success", CreatedAt = DateTime.UtcNow,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
        });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Session settings saved" });
    }

    // ✅ Called during login to enforce concurrent session limit
    [HttpPost("enforce")]
    public async Task<IActionResult> EnforceSessionLimit([FromBody] EnforceSessionRequest dto)
    {
        var settings     = await _context.LoginSettings.FirstOrDefaultAsync();
        int maxSessions  = settings?.MaxConcurrentSessions ?? 3;
        bool forceLogout = settings?.ForceLogoutOnNew      ?? true;

        if (maxSessions == 0)
            return Ok(new { success = true, blocked = false });

        var activeSessions = await _context.Sessions
            .Where(s => s.UserId == dto.UserId && s.Status == "Active")
            .OrderBy(s => s.StartedAt)
            .ToListAsync();

        if (activeSessions.Count < maxSessions)
            return Ok(new { success = true, blocked = false });

        if (!forceLogout)
            return Ok(new { success = false, blocked = true,
                message = $"Maximum of {maxSessions} concurrent session(s) reached. Please log out from another device first." });

        int toTerminate = activeSessions.Count - maxSessions + 1;
        for (int i = 0; i < toTerminate; i++)
            activeSessions[i].Status = "Ended";

        _context.AuditLogs.Add(new AuditLog {
            UserId = dto.UserId, Action = "Session Force Terminated", Module = "Session Management",
            Details = $"{toTerminate} oldest session(s) terminated — concurrent limit ({maxSessions}) reached",
            Status = "Success", CreatedAt = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();
        return Ok(new { success = true, blocked = false, message = $"{toTerminate} oldest session(s) terminated" });
    }
}

public class SessionSettingsRequest
{
    public int  IdleTimeoutMinutes    { get; set; } = 15;
    public int  MaxSessionHours       { get; set; } = 8;
    public int  MaxConcurrentSessions { get; set; } = 3;
    public bool ForceLogoutOnNew      { get; set; } = true;
}

public class EnforceSessionRequest
{
    public Guid UserId { get; set; }
}