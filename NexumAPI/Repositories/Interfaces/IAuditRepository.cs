using NexumAPI.Models;

namespace NexumAPI.Repositories.Interfaces
{
    public interface IAuditRepository
    {
        Task<IEnumerable<AuditLog>> GetAllAsync();
        Task<AuditLog> GetByIdAsync(int id);
        Task<IEnumerable<AuditLog>> GetByUserIdAsync(int userId);
        Task<AuditLog> CreateAsync(AuditLog auditLog);
        Task<bool> DeleteAsync(int id);
        Task<bool> SaveChangesAsync();
    }
}
