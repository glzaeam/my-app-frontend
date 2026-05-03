using NexumAPI.DTOs.Auth;
using NexumAPI.Models;        

namespace NexumAPI.Services.Interfaces
{
    public interface IAuthService
    {
        Task<object> LoginAsync(LoginDto loginDto);
        Task<object> VerifyOtpAsync(string userId, string code);
        Task<object> VerifyTotpAsync(string userId, string code);
        Task<object> RegisterAsync(RegisterDto registerDto);
        Task<bool> LogoutAsync(string userId);
        Task<object> RefreshTokenAsync(string refreshToken);
        string GenerateJwtToken(User user);   
    }
}