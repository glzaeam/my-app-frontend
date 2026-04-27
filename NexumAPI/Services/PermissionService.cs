using NexumAPI.Services.Interfaces;

namespace NexumAPI.Services
{
    public class PermissionService : IPermissionService
    {
        public Task<IEnumerable<object>> GetAllPermissionsAsync()
        {
            // TODO: Implement get all permissions logic
            throw new NotImplementedException();
        }

        public Task<object> GetPermissionByIdAsync(int id)
        {
            // TODO: Implement get permission by id logic
            throw new NotImplementedException();
        }

        public Task<object> CreatePermissionAsync(object permissionDto)
        {
            // TODO: Implement create permission logic
            throw new NotImplementedException();
        }

        public Task<object> UpdatePermissionAsync(int id, object permissionDto)
        {
            // TODO: Implement update permission logic
            throw new NotImplementedException();
        }

        public Task<bool> DeletePermissionAsync(int id)
        {
            // TODO: Implement delete permission logic
            throw new NotImplementedException();
        }
    }
}
