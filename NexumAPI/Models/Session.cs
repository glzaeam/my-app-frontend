namespace NexumAPI.Models;

public class Session
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string? IpAddress { get; set; }
    public string? DeviceInfo { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public string Status { get; set; }

    public User User { get; set; }
}