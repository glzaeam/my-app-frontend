namespace NexumAPI.Models;

public class Module
{
    public Guid Id { get; set; }

    public string Name { get; set; }
    public string? Description { get; set; }
    public string? Route { get; set; }

    public ICollection<Permission> Permissions { get; set; }
}