namespace NexumAPI.Models;

public class LoginAttempt
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public string? IpAddress { get; set; }
    public string Status { get; set; }
    public string? FailureReason { get; set; }

    public DateTime AttemptedAt { get; set; }

    public User? User { get; set; }
}