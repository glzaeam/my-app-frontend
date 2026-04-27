using NexumAPI.Models;
using NexumAPI.Repositories.Interfaces;

namespace NexumAPI.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        public Task<IEnumerable<Role>> GetAllAsync()
        {
            // TODO: Implement get all roles logic
            throw new NotImplementedException();
        }

        public Task<Role> GetByIdAsync(int id)
        {
            // TODO: Implement get role by id logic
            throw new NotImplementedException();
        }

        public Task<Role> GetByNameAsync(string name)
        {
            // TODO: Implement get role by name logic
            throw new NotImplementedException();
        }

        public Task<Role> CreateAsync(Role role)
        {
            // TODO: Implement create role logic
            throw new NotImplementedException();
        }

        public Task<Role> UpdateAsync(Role role)
        {
            // TODO: Implement update role logic
            throw new NotImplementedException();
        }

        public Task<bool> DeleteAsync(int id)
        {
            // TODO: Implement delete role logic
            throw new NotImplementedException();
        }

        public Task<bool> SaveChangesAsync()
        {
            // TODO: Implement save changes logic
            throw new NotImplementedException();
        }
    }
}
