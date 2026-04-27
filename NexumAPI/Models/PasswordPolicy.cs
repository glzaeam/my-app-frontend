namespace NexumAPI.Models;

public class PasswordPolicy
{
    public Guid Id { get; set; }

    public int MinLength { get; set; }
    public bool RequireUppercase { get; set; }
    public bool RequireLowercase { get; set; }
    public bool RequireNumbers { get; set; }
    public bool RequireSpecial { get; set; }

    public int ExpiryDays { get; set; }
    public int HistoryCount { get; set; }
    public int MaxFailedAttempts { get; set; }
    public int LockoutDurationMinutes { get; set; }
}