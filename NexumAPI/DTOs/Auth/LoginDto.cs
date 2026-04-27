public class LoginDto
{
    public string EmployeeId    { get; set; } = string.Empty;
    public string Password      { get; set; } = string.Empty;
    public string? CaptchaToken { get; set; }
    public int TimezoneOffset   { get; set; } = 0; // minutes offset from UTC (e.g. +480 for PH)
}