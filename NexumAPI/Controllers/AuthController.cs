using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.DTOs.Auth;
using NexumAPI.Models;
using NexumAPI.Services.Interfaces;
using OtpNet;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService    _authService;
        private readonly NexumDbContext  _context;

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

        // Returns OTP expiry time from MfaConfigs — used by 2FA page countdown timer
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

        // ── TOTP Setup during login (called when requiresTotpSetup = true) ──

        [HttpPost("totp-setup")]
        [AllowAnonymous]
        public async Task<IActionResult> TotpSetupDuringLogin([FromBody] TotpSetupRequest dto)
        {
            if (!Guid.TryParse(dto.UserId, out var userId))
                return BadRequest(new { success = false, message = "Invalid user" });

            var hasValidOtp = await _context.OtpCodes
                .AnyAsync(o => o.UserId == userId
                             && !o.IsUsed
                             && o.ExpiresAt > DateTime.UtcNow);

            if (!hasValidOtp)
                return Unauthorized(new { success = false, message = "Session expired. Please log in again." });

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            var secretBytes = KeyGeneration.GenerateRandomKey(20);
            var secret      = Base32Encoding.ToString(secretBytes);

            var existing = await _context.MfaSettings
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Method == "Authenticator");

            if (existing != null)
            {
                existing.SecretKey = secret;
                existing.IsEnabled = false;
            }
            else
            {
                _context.MfaSettings.Add(new MfaSetting
                {
                    Id         = Guid.NewGuid(),
                    UserId     = userId,
                    Method     = "Authenticator",
                    SecretKey  = secret,
                    IsEnabled  = false,
                    EnrolledAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            var issuer = "NexumBank";
            var label  = Uri.EscapeDataString($"{issuer}:{user.Email}");
            var qrUri  = $"otpauth://totp/{label}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&algorithm=SHA1&digits=6&period=30";

            return Ok(new { secret, qrUri });
        }

        [HttpPost("totp-setup/verify")]
        [AllowAnonymous]
        public async Task<IActionResult> TotpSetupVerifyDuringLogin([FromBody] VerifyOtpDto dto)
        {
            if (!Guid.TryParse(dto.UserId, out var userId))
                return BadRequest(new { success = false, message = "Invalid user" });

            var setting = await _context.MfaSettings
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Method == "Authenticator");

            if (setting?.SecretKey == null)
                return BadRequest(new { success = false, message = "No setup found. Please start setup again." });

            var secretBytes = Base32Encoding.ToBytes(setting.SecretKey);
            var totp        = new Totp(secretBytes);

            // Wider window for initial setup
            var valid = totp.VerifyTotp(dto.Code, out _, new VerificationWindow(3, 3));

            if (!valid)
                return Ok(new { success = false, message = "Invalid code. Try again." });

            // Enable the authenticator
            setting.IsEnabled = true;
            setting.EnrolledAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Generate successful login response
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            var token = _authService.GenerateJwtToken(user);

            return Ok(new
            {
                success = true,
                token,
                user = new
                {
                    id              = user.Id.ToString(),
                    user.EmployeeId,
                    user.Name,
                    user.Email,
                    user.Department,
                    user.Status,
                    user.ProfileImageUrl,
                    roleId = user.UserRoles.FirstOrDefault()?.RoleId.ToString(),
                    roles  = user.UserRoles.Select(ur => ur.Role?.Name).ToList()
                }
            });
        }
    }
}