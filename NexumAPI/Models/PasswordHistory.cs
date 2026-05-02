namespace NexumAPI.Models;

public class PasswordHistory
{
    public Guid     Id           { get; set; }
    public Guid     UserId       { get; set; }
    public string   PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
    public string?  ChangedBy    { get; set; }   // ← ADD THIS
    public string?  Reason       { get; set; }   // ← ADD THIS
    public User     User         { get; set; } = null!;
}