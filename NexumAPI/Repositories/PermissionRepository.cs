using NexumAPI.Models;
using NexumAPI.Repositories.Interfaces;

namespace NexumAPI.Repositories
{
    public class PermissionRepository : IPermissionRepository
    {
        public Task<IEnumerable<Permission>> GetAllAsync()
        {
            // TODO: Implement get all permissions logic
            throw new NotImplementedException();
        }

        public Task<Permission> GetByIdAsync(int id)
        {
            // TODO: Implement get permission by id logic
            throw new NotImplementedException();
        }

        public Task<Permission> GetByNameAsync(string name)
        {
            // TODO: Implement get permission by name logic
            throw new NotImplementedException();
        }

        public Task<Permission> CreateAsync(Permission permission)
        {
            // TODO: Implement create permission logic
            throw new NotImplementedException();
        }

        public Task<Permission> UpdateAsync(Permission permission)
        {
            // TODO: Implement update permission logic
            throw new NotImplementedException();
        }

        public Task<bool> DeleteAsync(int id)
        {
            // TODO: Implement delete permission logic
            throw new NotImplementedException();
        }

        public Task<bool> SaveChangesAsync()
        {
            // TODO: Implement save changes logic
            throw new NotImplementedException();
        }
    }
}
