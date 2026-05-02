using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.DTOs.Auth;
using NexumAPI.Services.Interfaces;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly NexumDbContext _context;

        public AuthController(IAuthService authService, NexumDbContext context)
        {
            _authService = authService;
            _context     = context;
        }

        [HttpGet("generate-hash")]
        public IActionResult GenerateHash()
        {
            var hash = BCrypt.Net.BCrypt.HashPassword("admin123");
            return Ok(hash);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            return Ok(result);
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var result = await _authService.VerifyOtpAsync(dto.UserId, dto.Code);
            return Ok(result);
        }

        [HttpPost("verify-totp")]
        public async Task<IActionResult> VerifyTotp([FromBody] VerifyOtpDto dto)
        {
            var result = await _authService.VerifyTotpAsync(dto.UserId, dto.Code);
            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(result);
        }

        [HttpPost("logout/{userId}")]
        public async Task<IActionResult> Logout(string userId)
        {
            var result = await _authService.LogoutAsync(userId);
            return Ok(result);
        }

        // ✅ Returns OTP expiry time from MfaConfigs — used by 2FA page countdown timer
        [HttpGet("otp-expiry")]
        [AllowAnonymous]
        public async Task<IActionResult> GetOtpExpiry()
        {
            var config = await _context.MfaConfigs.FirstOrDefaultAsync();
            return Ok(new { codeExpiryMinutes = config?.CodeExpiryMinutes ?? 5 });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var sub = User.FindFirstValue("sub")
                   ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(sub))
                return Unauthorized(new { success = false, message = "Invalid token" });

            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id.ToString() == sub);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            var firstRole = user.UserRoles.FirstOrDefault();

            return Ok(new {
                id              = user.Id.ToString(),
                user.Name,
                user.Email,
                user.EmployeeId,
                user.Department,
                user.Status,
                user.ProfileImageUrl,
                user.MfaEnabled,
                roleId = firstRole?.RoleId.ToString(),
                roles  = user.UserRoles.Select(ur => ur.Role?.Name).ToList()
            });
        }
    }
}