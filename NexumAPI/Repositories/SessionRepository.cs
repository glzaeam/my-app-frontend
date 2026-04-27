using NexumAPI.Models;
using NexumAPI.Repositories.Interfaces;

namespace NexumAPI.Repositories
{
    public class SessionRepository : ISessionRepository
    {
        public Task<IEnumerable<Session>> GetAllAsync()
        {
            // TODO: Implement get all sessions logic
            throw new NotImplementedException();
        }

        public Task<Session> GetByIdAsync(string id)
        {
            // TODO: Implement get session by id logic
            throw new NotImplementedException();
        }

        public Task<IEnumerable<Session>> GetByUserIdAsync(int userId)
        {
            // TODO: Implement get sessions by user id logic
            throw new NotImplementedException();
        }

        public Task<Session> CreateAsync(Session session)
        {
            // TODO: Implement create session logic
            throw new NotImplementedException();
        }

        public Task<Session> UpdateAsync(Session session)
        {
            // TODO: Implement update session logic
            throw new NotImplementedException();
        }

        public Task<bool> DeleteAsync(string id)
        {
            // TODO: Implement delete session logic
            throw new NotImplementedException();
        }

        public Task<bool> SaveChangesAsync()
        {
            // TODO: Implement save changes logic
            throw new NotImplementedException();
        }
    }
}
