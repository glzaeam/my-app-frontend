namespace NexumAPI.DTOs.Auth
{
    public class RegisterDto
    {
        public string FirstName  { get; set; } = string.Empty;
        public string LastName   { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string Email      { get; set; } = string.Empty;
        public string Password   { get; set; } = string.Empty;
    }
}