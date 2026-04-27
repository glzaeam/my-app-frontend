using System.ComponentModel.DataAnnotations;
namespace NexumAPI.Models;
public class User
{
    public Guid Id { get; set; }
    [Required]
    public string FirstName { get; set; } = string.Empty;
    [Required]
    public string LastName { get; set; } = string.Empty;
    [Required]
    public string Username { get; set; } = string.Empty;
    [Required]
    public string EmployeeId { get; set; } = string.Empty;
    [Required]
    public string Name { get; set; } = string.Empty;
    [Required]
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? ProfileImageUrl { get; set; }   // ← NEW
    public Guid? BranchId { get; set; }
    public string Status { get; set; } = "active";
    public bool MfaEnabled { get; set; }
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Navigation
    public Branch? Branch { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<Device> Devices { get; set; } = new List<Device>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<SecurityAlert> SecurityAlerts { get; set; } = new List<SecurityAlert>();
    public ICollection<LoginAttempt> LoginAttempts { get; set; } = new List<LoginAttempt>();
    public ICollection<MfaSetting> MfaSettings { get; set; } = new List<MfaSetting>();
}