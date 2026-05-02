namespace NexumAPI.Models;
public class Role
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool MfaRequired { get; set; } = false;
    public string MfaRequirement { get; set; } = "Optional"; // Required, Optional, Disabled
    public string? AllowedMfaMethods { get; set; } // comma-separated: SMS,Email,Authenticator
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    public ICollection<PasswordPolicy> PasswordPolicies { get; set; } = new List<PasswordPolicy>();
}