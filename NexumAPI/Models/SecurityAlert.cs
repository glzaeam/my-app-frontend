namespace NexumAPI.Models;

public class SecurityAlert
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public string AlertType { get; set; }
    public string Severity { get; set; }
    public string Description { get; set; }

    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public User? User { get; set; }
}