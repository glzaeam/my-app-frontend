namespace NexumAPI.Models;
public class MfaConfig
{
    public Guid Id { get; set; }

    // FK → Users
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public bool SmsEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    public bool AuthenticatorEnabled { get; set; } = false;
    public int CodeExpiryMinutes { get; set; } = 5;
    public int GraceLogins { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}