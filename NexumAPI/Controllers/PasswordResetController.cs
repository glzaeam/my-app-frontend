using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.DTOs.Auth;
using NexumAPI.Models;
using NexumAPI.Services;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class PasswordResetController : ControllerBase
    {
        private readonly NexumDbContext _context;
        private readonly EmailService   _email;
        private readonly IConfiguration _config;

        public PasswordResetController(NexumDbContext context, EmailService email, IConfiguration config)
        {
            _context = context;
            _email   = email;
            _config  = config;
        }

        private static string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes).ToLower();
        }

        private static string GenerateSecureToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-").Replace("/", "_").Replace("=", "");
        }

        // POST /api/auth/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Rate limit: max 3 requests per email+IP per hour
            var oneHourAgo   = DateTime.UtcNow.AddHours(-1);
            var recentTokens = await _context.PasswordResetTokens
                .CountAsync(t => t.CreatedAt >= oneHourAgo &&
                    (_context.Users.Any(u => u.Id == t.UserId &&
                        u.Email == dto.Email)));

            // Always return success to prevent enumeration
            if (recentTokens >= 3)
                return Ok(new { success = true, message = "If your details match, a reset link has been sent to your email." });

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == dto.EmployeeId && u.Email == dto.Email);

            if (user != null)
            {
                // Invalidate all existing tokens
                var existing = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && !t.Used)
                    .ToListAsync();
                _context.PasswordResetTokens.RemoveRange(existing);

                // Generate cryptographically secure token
                var rawToken  = GenerateSecureToken();
                var tokenHash = HashToken(rawToken);

                _context.PasswordResetTokens.Add(new PasswordResetToken {
                    UserId    = user.Id,
                    Token     = tokenHash, // store only hash
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                    Used      = false,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:3000";
                var resetLink   = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

                await _email.SendPasswordResetAsync(user.Email, user.Name, resetLink);
                Console.WriteLine($"🔑 Reset link for {user.EmployeeId}: {resetLink}");
            }

            return Ok(new { success = true, message = "If your details match, a reset link has been sent to your email." });
        }

        // POST /api/auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var tokenHash  = HashToken(dto.Token);
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == tokenHash);

            if (resetToken == null || resetToken.Used)
                return Ok(new { success = false, message = "Invalid or already used reset link." });

            if (resetToken.ExpiresAt < DateTime.UtcNow)
                return Ok(new { success = false, message = "Reset link has expired. Please request a new one." });

            // Validate password against policy
            var policy = await _context.PasswordPolicies.FirstOrDefaultAsync();
            var errors = ValidatePassword(dto.NewPassword, policy);
            if (errors.Any())
                return Ok(new { success = false, message = errors.First() });

            // Check password history
            if (policy?.HistoryCount > 0)
            {
                var recentHashes = await _context.PasswordHistories
                    .Where(h => h.UserId == resetToken.UserId)
                    .OrderByDescending(h => h.CreatedAt)
                    .Take(policy.HistoryCount)
                    .Select(h => h.PasswordHash)
                    .ToListAsync();

                if (recentHashes.Any(h => BCrypt.Net.BCrypt.Verify(dto.NewPassword, h)))
                    return Ok(new { success = false, message = $"Cannot reuse your last {policy.HistoryCount} passwords." });
            }

            var user = resetToken.User;

            // Save to password history
            _context.PasswordHistories.Add(new PasswordHistory {
                UserId       = user.Id,
                PasswordHash = user.PasswordHash,
                CreatedAt    = DateTime.UtcNow
            });

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            resetToken.Used   = true;

            // Invalidate ALL active sessions
            var activeSessions = await _context.Sessions
                .Where(s => s.UserId == user.Id && s.Status == "Active")
                .ToListAsync();
            foreach (var s in activeSessions)
                s.Status = "Ended";

            // Audit log
            _context.AuditLogs.Add(new AuditLog {
                UserId    = user.Id,
                Action    = "Password Reset",
                Module    = "Authentication",
                Details   = $"Password reset successfully. All sessions invalidated.",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();

            // Send confirmation email
            await _email.SendPasswordChangedEmailAsync(user.Email, user.Name,
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");

            Console.WriteLine($"✅ Password reset for {user.EmployeeId}. {activeSessions.Count} sessions terminated.");
            return Ok(new { success = true, message = "Password reset successfully. You can now log in." });
        }

        // GET /api/auth/validate-reset-token?token=xxx
        [HttpGet("validate-reset-token")]
        public async Task<IActionResult> ValidateToken([FromQuery] string token)
        {
            var tokenHash  = HashToken(token);
            var resetToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Token == tokenHash);

            if (resetToken == null || resetToken.Used)
                return Ok(new { valid = false, message = "Invalid or already used link." });

            if (resetToken.ExpiresAt < DateTime.UtcNow)
                return Ok(new { valid = false, message = "Link has expired." });

            return Ok(new { valid = true });
        }

        // POST /api/auth/unlock-account
        [HttpPost("unlock-account")]
        public async Task<IActionResult> UnlockAccount([FromBody] UnlockAccountRequest dto)
        {
            var tokenHash = HashToken(dto.Token);
            var unlock    = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == tokenHash && !t.Used);

            if (unlock == null || unlock.ExpiresAt < DateTime.UtcNow)
                return Ok(new { success = false, message = "Invalid or expired unlock link." });

            unlock.User.Status = "Active";
            unlock.Used        = true;

            _context.AuditLogs.Add(new AuditLog {
                UserId    = unlock.UserId,
                Action    = "Account Unlocked",
                Module    = "Authentication",
                Details   = "Account unlocked via email link",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Account unlocked. You can now log in." });
        }

        private static List<string> ValidatePassword(string password, PasswordPolicy? policy)
        {
            var errors = new List<string>();
            int minLen = policy?.MinLength ?? 8;

            if (password.Length < minLen)
                errors.Add($"Password must be at least {minLen} characters.");
            if (password.Length > 128)
                errors.Add("Password cannot exceed 128 characters.");
            if (password != password.Trim())
                errors.Add("Password cannot have leading or trailing spaces.");
            if (policy?.RequireUppercase == true && !password.Any(char.IsUpper))
                errors.Add("Must contain an uppercase letter.");
            if (policy?.RequireLowercase == true && !password.Any(char.IsLower))
                errors.Add("Must contain a lowercase letter.");
            if (policy?.RequireNumbers == true && !password.Any(char.IsDigit))
                errors.Add("Must contain a number.");
            if (policy?.RequireSpecial == true && !password.Any(c => "!@#$%^&*()_+-=[]{}|;':\",./<>?".Contains(c)))
                errors.Add("Must contain a special character.");

            return errors;
        }
    }

    public class UnlockAccountRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}