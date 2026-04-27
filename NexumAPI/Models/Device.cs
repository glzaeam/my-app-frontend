namespace NexumAPI.Models;

public class Device
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string? DeviceName { get; set; }
    public string? DeviceType { get; set; }
    public string? OS { get; set; }
    public string? Browser { get; set; }

    public string? IpAddress { get; set; }
    public string? Fingerprint { get; set; }
    public string? Location { get; set; }

    public bool IsTrusted { get; set; }
    public DateTime LastUsed { get; set; }

    public string Status { get; set; }

    public User User { get; set; }
}