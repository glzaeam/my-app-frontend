namespace NexumAPI.Models;

public class AuditLog
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public string Action { get; set; }
    public string? Module { get; set; }
    public string? Target { get; set; }

    public string? IpAddress { get; set; }
    public string Status { get; set; }

    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
}