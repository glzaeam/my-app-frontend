namespace NexumAPI.DTOs.Auth
{
    public class VerifyOtpDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Code   { get; set; } = string.Empty;
    }
}