namespace NexumAPI.Models;
public class TransactionTrail
{
    public Guid     Id          { get; set; }
    public string   TxnId       { get; set; } = string.Empty;
    public string   Action      { get; set; } = string.Empty;
    public string   Module      { get; set; } = string.Empty;
    public string?  Details     { get; set; }
    public Guid?    PerformedBy { get; set; }
    public Guid?    TargetUserId { get; set; }
    public string   Status      { get; set; } = "Success";
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
    public string?  IpAddress   { get; set; }
    public User?    Performer   { get; set; }
    public User?    TargetUser  { get; set; }
}