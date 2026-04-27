namespace NexumAPI.Services.Interfaces
{
    public interface ISecurityService
    {
        Task<IEnumerable<object>> GetDeviceTrackingAsync();
        Task<IEnumerable<object>> GetFailedLoginsAsync();
        Task<IEnumerable<object>> GetLiveAlertsAsync();
        Task<IEnumerable<object>> GetSuspiciousActivityAsync();
        Task LogSecurityEventAsync(string eventType, string details);
    }
}
