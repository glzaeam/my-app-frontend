namespace NexumAPI.Services.Interfaces
{
    public interface IAuditService
    {
        Task<IEnumerable<object>> GetAuditLogsAsync();
        Task<IEnumerable<object>> GetTransactionTrailAsync();
        Task<IEnumerable<object>> GetActivityLogsAsync();
        Task<object> ExportReportsAsync();
        Task LogAuditAsync(string action, string details, string userId);
    }
}
