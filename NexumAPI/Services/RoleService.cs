using NexumAPI.Services.Interfaces;

namespace NexumAPI.Services
{
    public class RoleService : IRoleService
    {
        public Task<IEnumerable<object>> GetAllRolesAsync()
        {
            // TODO: Implement get all roles logic
            throw new NotImplementedException();
        }

        public Task<object> GetRoleByIdAsync(int id)
        {
            // TODO: Implement get role by id logic
            throw new NotImplementedException();
        }

        public Task<object> CreateRoleAsync(object roleDto)
        {
            // TODO: Implement create role logic
            throw new NotImplementedException();
        }

        public Task<object> UpdateRoleAsync(int id, object roleDto)
        {
            // TODO: Implement update role logic
            throw new NotImplementedException();
        }

        public Task<bool> DeleteRoleAsync(int id)
        {
            // TODO: Implement delete role logic
            throw new NotImplementedException();
        }
    }
}
