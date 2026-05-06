namespace NexumAPI.Models;

public class LoginSetting
{
    public Guid Id { get; set; }
    public int MaxFailedAttempts { get; set; } = 5;
    public int LockoutDuration { get; set; } = 15;
    public int CaptchaAfter { get; set; } = 3;
    public bool IpBlockingEnabled { get; set; }
    public string? BlockedIps { get; set; }
    public int SessionTimeoutMinutes { get; set; } = 15;
    public int MaxSessionDurationHours { get; set; } = 8;
    public int MaxConcurrentSessions { get; set; } = 3;
    public bool ForceLogoutOnNew { get; set; } = true;
}