namespace NexumAPI.Models;

public class MfaSetting
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Method { get; set; }
    public bool IsEnabled { get; set; }

    public string? SecretKey { get; set; }
    public DateTime EnrolledAt { get; set; }

    public User User { get; set; }
}