namespace NexumAPI.Services.Interfaces
{
    public interface ISessionService
    {
        Task<IEnumerable<object>> GetActiveSessionsAsync();
        Task<object> GetSessionByIdAsync(string id);
        Task<bool> TerminateSessionAsync(string id);
        Task<bool> TerminateAllSessionsAsync();
        Task<object> CreateSessionAsync(string userId);
    }
}
