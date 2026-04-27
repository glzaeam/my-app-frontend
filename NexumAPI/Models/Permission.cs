namespace NexumAPI.Models;

public class Permission
{
    public Guid Id { get; set; }

    public Guid RoleId { get; set; }
    public Guid ModuleId { get; set; }

    public bool CanView { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }

    public Role Role { get; set; }
    public Module Module { get; set; }
}