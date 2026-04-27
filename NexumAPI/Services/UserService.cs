using NexumAPI.DTOs.User;
using NexumAPI.Services.Interfaces;
using NexumAPI.DTOs;

namespace NexumAPI.Services
{
    public class UserService : IUserService
    {
        public Task<IEnumerable<UserResponseDto>> GetAllUsersAsync()
        {
            // TODO: Implement get all users logic
            throw new NotImplementedException();
        }

        public Task<UserResponseDto> GetUserByIdAsync(int id)
        {
            // TODO: Implement get user by id logic
            throw new NotImplementedException();
        }

        public Task<UserResponseDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            // TODO: Implement create user logic
            throw new NotImplementedException();
        }

        public Task<UserResponseDto> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            // TODO: Implement update user logic
            throw new NotImplementedException();
        }

        public Task<bool> DeleteUserAsync(int id)
        {
            // TODO: Implement delete user logic
            throw new NotImplementedException();
        }
    }
}
