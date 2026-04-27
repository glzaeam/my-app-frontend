using NexumAPI.Models;

namespace NexumAPI.Repositories.Interfaces
{
    public interface ISessionRepository
    {
        Task<IEnumerable<Session>> GetAllAsync();
        Task<Session> GetByIdAsync(string id);
        Task<IEnumerable<Session>> GetByUserIdAsync(int userId);
        Task<Session> CreateAsync(Session session);
        Task<Session> UpdateAsync(Session session);
        Task<bool> DeleteAsync(string id);
        Task<bool> SaveChangesAsync();
    }
}
