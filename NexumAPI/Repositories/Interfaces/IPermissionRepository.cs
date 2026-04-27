using NexumAPI.Models;

namespace NexumAPI.Repositories.Interfaces
{
    public interface IPermissionRepository
    {
        Task<IEnumerable<Permission>> GetAllAsync();
        Task<Permission> GetByIdAsync(int id);
        Task<Permission> GetByNameAsync(string name);
        Task<Permission> CreateAsync(Permission permission);
        Task<Permission> UpdateAsync(Permission permission);
        Task<bool> DeleteAsync(int id);
        Task<bool> SaveChangesAsync();
    }
}
