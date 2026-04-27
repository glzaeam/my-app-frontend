namespace NexumAPI.DTOs.Auth
{
    public class AccessRequestDto
    {
        public string FullName { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? Branch { get; set; }
        public string? RequestedRole { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    public class ReviewAccessRequestDto
    {
        public string Action { get; set; } = string.Empty; // "Approve" or "Reject"
        public string? RejectionReason { get; set; }
    }
}