using NexumAPI.Models;
using NexumAPI.Repositories.Interfaces;

namespace NexumAPI.Repositories
{
    public class AuditRepository : IAuditRepository
    {
        public Task<IEnumerable<AuditLog>> GetAllAsync()
        {
            // TODO: Implement get all audit logs logic
            throw new NotImplementedException();
        }

        public Task<AuditLog> GetByIdAsync(int id)
        {
            // TODO: Implement get audit log by id logic
            throw new NotImplementedException();
        }

        public Task<IEnumerable<AuditLog>> GetByUserIdAsync(int userId)
        {
            // TODO: Implement get audit logs by user id logic
            throw new NotImplementedException();
        }

        public Task<AuditLog> CreateAsync(AuditLog auditLog)
        {
            // TODO: Implement create audit log logic
            throw new NotImplementedException();
        }

        public Task<bool> DeleteAsync(int id)
        {
            // TODO: Implement delete audit log logic
            throw new NotImplementedException();
        }

        public Task<bool> SaveChangesAsync()
        {
            // TODO: Implement save changes logic
            throw new NotImplementedException();
        }
    }
}
