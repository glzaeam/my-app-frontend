namespace NexumAPI.DTOs.User;

public class CreateUserDto
{
    public required string EmployeeId { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
}