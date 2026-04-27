namespace NexumAPI.Models;
public class RoleHierarchy
{
    public Guid   Id            { get; set; }
    public Guid   ParentRoleId  { get; set; }
    public Guid   ChildRoleId   { get; set; }
    public int    Level         { get; set; }
    public Role   ParentRole    { get; set; } = null!;
    public Role   ChildRole     { get; set; } = null!;
}