namespace NexumAPI.Services.Interfaces
{
    public interface IRoleService
    {
        Task<IEnumerable<object>> GetAllRolesAsync();
        Task<object> GetRoleByIdAsync(int id);
        Task<object> CreateRoleAsync(object roleDto);
        Task<object> UpdateRoleAsync(int id, object roleDto);
        Task<bool> DeleteRoleAsync(int id);
    }
}
