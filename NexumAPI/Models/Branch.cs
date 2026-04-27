namespace NexumAPI.Models;

public class Branch
{
    public Guid Id { get; set; }

    public string Name { get; set; }
    public string? Location { get; set; }
    public string Code { get; set; }

    public bool IsHeadquarters { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<User> Users { get; set; }
}