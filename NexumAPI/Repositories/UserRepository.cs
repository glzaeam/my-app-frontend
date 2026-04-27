using NexumAPI.Models;
using NexumAPI.Repositories.Interfaces;

namespace NexumAPI.Repositories
{
    public class UserRepository : IUserRepository
    {
        public Task<IEnumerable<User>> GetAllAsync()
        {
            // TODO: Implement get all users logic
            throw new NotImplementedException();
        }

        public Task<User> GetByIdAsync(int id)
        {
            // TODO: Implement get user by id logic
            throw new NotImplementedException();
        }

        public Task<User> GetByEmailAsync(string email)
        {
            // TODO: Implement get user by email logic
            throw new NotImplementedException();
        }

        public Task<User> CreateAsync(User user)
        {
            // TODO: Implement create user logic
            throw new NotImplementedException();
        }

        public Task<User> UpdateAsync(User user)
        {
            // TODO: Implement update user logic
            throw new NotImplementedException();
        }

        public Task<bool> DeleteAsync(int id)
        {
            // TODO: Implement delete user logic
            throw new NotImplementedException();
        }

        public Task<bool> SaveChangesAsync()
        {
            // TODO: Implement save changes logic
            throw new NotImplementedException();
        }
    }
}
