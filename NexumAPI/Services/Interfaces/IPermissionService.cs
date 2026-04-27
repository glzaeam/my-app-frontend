namespace NexumAPI.Services.Interfaces
{
    public interface IPermissionService
    {
        Task<IEnumerable<object>> GetAllPermissionsAsync();
        Task<object> GetPermissionByIdAsync(int id);
        Task<object> CreatePermissionAsync(object permissionDto);
        Task<object> UpdatePermissionAsync(int id, object permissionDto);
        Task<bool> DeletePermissionAsync(int id);
    }
}
