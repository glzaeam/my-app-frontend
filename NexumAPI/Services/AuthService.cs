using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NexumAPI.Data;
using NexumAPI.DTOs.Auth;
using NexumAPI.Models;
using NexumAPI.Services.Interfaces;

namespace NexumAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly NexumDbContext       _context;
        private readonly IConfiguration       _config;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly SmsService           _sms;
        private readonly EmailService         _email;
        private readonly LockoutService       _lockout;
        private readonly RecaptchaService     _recaptcha;

        public AuthService(
            NexumDbContext context,
            IConfiguration config,
            IHttpContextAccessor httpContextAccessor,
            SmsService sms,
            EmailService email,
            LockoutService lockout,
            RecaptchaService recaptcha)
        {
            _context             = context;
            _config              = config;
            _httpContextAccessor = httpContextAccessor;
            _sms                 = sms;
            _email               = email;
            _lockout             = lockout;
            _recaptcha           = recaptcha;
        }

        public async Task<object> LoginAsync(LoginDto loginDto)
        {
            var ip = _httpContextAccessor.HttpContext?
                .Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // IP Whitelist check
            var loginSettings = await _context.LoginSettings.FirstOrDefaultAsync();
            if (loginSettings?.IpWhitelistEnabled == true && !string.IsNullOrEmpty(loginSettings.AllowedIps))
            {
                var allowedList = loginSettings.AllowedIps
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .ToList();
                if (!allowedList.Contains(ip))
                {
                    await RecordLoginAttemptAsync(null, ip, "Blocked", "IP not whitelisted");
                    return new { success = false, locked = false, requireCaptcha = false,
                                 attemptsLeft = 0, remainingMinutes = 0,
                                 message = "Access denied from this IP address." };
                }
            }

            if (_lockout.IsIpLocked(ip))
            {
                var remaining = _lockout.GetRemainingLockout(ip, loginDto.EmployeeId);
                await RecordLoginAttemptAsync(null, ip, "Blocked", "IP temporarily locked");
                return new { success = false, locked = true, requireCaptcha = false,
                             message = "Invalid credentials.",
                             remainingMinutes = (int)(remaining?.TotalMinutes ?? 15) };
            }

            if (_lockout.IsAccountLocked(loginDto.EmployeeId))
            {
                var remaining = _lockout.GetRemainingLockout(ip, loginDto.EmployeeId);
                await RecordLoginAttemptAsync(null, ip, "Blocked", "Account locked");
                return new { success = false, locked = true, requireCaptcha = false,
                             message = "Invalid credentials.",
                             remainingMinutes = (int)(remaining?.TotalMinutes ?? 15) };
            }

            bool needsCaptcha = _lockout.RequiresCaptcha(ip, loginDto.EmployeeId);
            if (needsCaptcha)
            {
                if (string.IsNullOrEmpty(loginDto.CaptchaToken))
                    return new { success = false, locked = false, requireCaptcha = true,
                                 attemptsLeft = Math.Max(0, 5 - _lockout.GetAccountFailedAttempts(loginDto.EmployeeId)),
                                 message = "Invalid credentials." };

                bool captchaOk = await _recaptcha.VerifyAsync(loginDto.CaptchaToken);
                if (!captchaOk)
                    return new { success = false, locked = false, requireCaptcha = true,
                                 attemptsLeft = Math.Max(0, 5 - _lockout.GetAccountFailedAttempts(loginDto.EmployeeId)),
                                 message = "Invalid credentials." };
            }

            int backoff = _lockout.GetBackoffSeconds(ip, loginDto.EmployeeId);
            if (backoff > 0)
                await Task.Delay(TimeSpan.FromSeconds(backoff));

            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.EmployeeId == loginDto.EmployeeId);

            if (user == null)
            {
                await RecordLoginAttemptAsync(null, ip, "Failed", "User not found");
                var (locked, _) = _lockout.RecordFailedAttempt(ip, loginDto.EmployeeId);
                int failCount   = _lockout.GetAccountFailedAttempts(loginDto.EmployeeId);
                return new { success = false, locked, requireCaptcha = failCount >= 3,
                             attemptsLeft = Math.Max(0, _lockout.MaxAttempts - failCount),
                             remainingMinutes = locked ? 15 : 0, message = "Invalid credentials." };
            }

            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                await RecordLoginAttemptAsync(user.Id, ip, "Failed", "Wrong password");
                var (locked, _) = _lockout.RecordFailedAttempt(ip, loginDto.EmployeeId);
                int failCount   = _lockout.GetAccountFailedAttempts(loginDto.EmployeeId);

                if (locked)
                {
                    user.Status = "Locked";

                    var rawUnlock  = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
                        .Replace("+", "-").Replace("/", "_").Replace("=", "");
                    var unlockHash = Convert.ToHexString(
                        System.Security.Cryptography.SHA256.HashData(
                            System.Text.Encoding.UTF8.GetBytes(rawUnlock))).ToLower();

                    _context.PasswordResetTokens.Add(new PasswordResetToken {
                        UserId    = user.Id,
                        Token     = unlockHash,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                        Used      = false,
                        CreatedAt = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();

                    if (!string.IsNullOrEmpty(user.Email))
                    {
                        var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:3000";
                        var unlockLink  = $"{frontendUrl}/unlock-account?token={Uri.EscapeDataString(rawUnlock)}";
                        await _email.SendUnlockEmailAsync(user.Email, user.Name, unlockLink);
                    }
                }

                return new { success = false, locked, requireCaptcha = failCount >= 3,
                             attemptsLeft = Math.Max(0, _lockout.MaxAttempts - failCount),
                             remainingMinutes = locked ? 15 : 0, message = "Invalid credentials." };
            }

            if (user.Status.ToLower() != "active")
                return new { success = false, locked = false, requireCaptcha = false,
                             message = "Invalid credentials." };

            _lockout.ResetAttempts(ip, loginDto.EmployeeId);

            // ── Role-based MFA method check ───────────────────────────────────
            var userRole       = user.UserRoles.FirstOrDefault()?.Role;
            var mfaRequirement = userRole?.MfaRequirement ?? "Optional";
            var allowedMethods = (userRole?.AllowedMfaMethods ?? "SMS,Email")
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(m => m.Trim())
                .ToList();

            // If role allows Authenticator, check if this user has it set up
            if (allowedMethods.Contains("Authenticator", StringComparer.OrdinalIgnoreCase))
            {
                var authenticatorSetting = await _context.MfaSettings
                    .FirstOrDefaultAsync(m => m.UserId == user.Id
                                           && m.Method == "Authenticator"
                                           && m.IsEnabled == true);

                if (authenticatorSetting != null)
                {
                    // User already has TOTP set up — ask them to verify
                    await RecordLoginAttemptAsync(user.Id, ip, "Success", null);
                    return new
                    {
                        success           = true,
                        locked            = false,
                        requiresOtp       = false,
                        requiresTotp      = true,
                        requiresTotpSetup = false,
                        userId            = user.Id.ToString(),
                        message           = "Enter the code from your Authenticator app"
                    };
                }
                else if (mfaRequirement == "Required")
                {
                    // Role requires Authenticator but user hasn't set it up yet
                    // Create an OTP gate so /totp-setup endpoint can verify the user passed password check
                    await GenerateOtpAsync(user.Id);
                    await RecordLoginAttemptAsync(user.Id, ip, "Success", null);
                    return new
                    {
                        success           = true,
                        locked            = false,
                        requiresOtp       = false,
                        requiresTotp      = false,
                        requiresTotpSetup = true,
                        userId            = user.Id.ToString(),
                        message           = "Your role requires Authenticator app setup. Please scan the QR code to continue."
                    };
                }
            }

            // ── Normal OTP flow (SMS / Email) ─────────────────────────────────
            var otp       = await GenerateOtpAsync(user.Id);
            var mfaConfig = await _context.MfaConfigs.FirstOrDefaultAsync();

            var roleAllowedMethods = allowedMethods
                .Select(m => m.ToLower())
                .ToList();

            var smsSent   = false;
            var emailSent = false;

            if ((mfaConfig?.SmsEnabled ?? true)
                && roleAllowedMethods.Contains("sms")
                && !string.IsNullOrEmpty(user.Phone))
                smsSent = await _sms.SendOtpAsync(user.Phone, otp);

            if ((mfaConfig?.EmailEnabled ?? true)
                && roleAllowedMethods.Contains("email")
                && !string.IsNullOrEmpty(user.Email))
                emailSent = await _email.SendOtpAsync(user.Email, user.Name, otp);

            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine($"  OTP for {user.EmployeeId}: {otp}");
            Console.WriteLine($"  SMS: {smsSent}  Email: {emailSent}");
            Console.ResetColor();

            await RecordLoginAttemptAsync(user.Id, ip, "Success", null);

            return new
            {
                success     = true,
                locked      = false,
                requiresOtp = true,
                userId      = user.Id.ToString(),
                message     = "OTP sent via SMS and Email"
            };
        }

        // ── Shared helper: enforce concurrent session limit ───────────────────
        private async Task<object?> EnforceConcurrentSessionsAsync(Guid userId)
        {
            var settings     = await _context.LoginSettings.FirstOrDefaultAsync();
            int maxSessions  = settings?.MaxConcurrentSessions ?? 3;
            bool forceLogout = settings?.ForceLogoutOnNew      ?? true;

            if (maxSessions <= 0) return null;

            var activeSessions = await _context.Sessions
                .Where(s => s.UserId == userId && s.Status == "Active")
                .OrderBy(s => s.StartedAt)
                .ToListAsync();

            if (activeSessions.Count < maxSessions) return null;

            if (!forceLogout)
                return new { success = false,
                             message = $"Maximum of {maxSessions} concurrent session(s) reached. Please log out from another device first." };

            int toRemove = activeSessions.Count - maxSessions + 1;
            for (int i = 0; i < toRemove; i++)
                activeSessions[i].Status = "Ended";

            return null;
        }

        public async Task<object> VerifyOtpAsync(string userId, string code)
        {
            var ip = _httpContextAccessor.HttpContext?
                .Connection.RemoteIpAddress?.ToString() ?? "unknown";

            if (!Guid.TryParse(userId, out var userGuid))
                return new { success = false, message = "Invalid user" };

            var otp = await _context.OtpCodes
                .Where(o => o.UserId == userGuid && o.Code == code
                         && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            if (otp == null)
                return new { success = false, message = "Invalid or expired OTP" };

            otp.IsUsed = true;

            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userGuid);

            if (user == null)
                return new { success = false, message = "User not found" };

            var concurrentError = await EnforceConcurrentSessionsAsync(userGuid);
            if (concurrentError != null) return concurrentError;

            var token     = GenerateJwtToken(user);
            var userAgent = _httpContextAccessor.HttpContext?
                .Request.Headers["User-Agent"].ToString() ?? "unknown";

            string browser = userAgent.Contains("Edg/")     ? "Edge"
                           : userAgent.Contains("Chrome/")  ? "Chrome"
                           : userAgent.Contains("Firefox/") ? "Firefox"
                           : userAgent.Contains("Safari/")  ? "Safari"
                           : "Browser";

            string os = userAgent.Contains("Windows") ? "Windows"
                      : userAgent.Contains("Mac")     ? "macOS"
                      : userAgent.Contains("iPhone")  ? "iPhone"
                      : userAgent.Contains("Android") ? "Android"
                      : userAgent.Contains("Linux")   ? "Linux"
                      : "Unknown OS";

            string deviceType = userAgent.Contains("Mobile")   || userAgent.Contains("iPhone") || userAgent.Contains("Android") ? "mobile"
                              : userAgent.Contains("Tablet")   || userAgent.Contains("iPad")   ? "tablet"
                              : "desktop";

            var loginSettings = await _context.LoginSettings.FirstOrDefaultAsync();
            int sessionHours  = loginSettings?.MaxSessionDurationHours > 0
                                ? loginSettings.MaxSessionDurationHours : 8;

            _context.Sessions.Add(new Session
            {
                UserId     = user.Id,
                IpAddress  = ip,
                DeviceInfo = userAgent,
                StartedAt  = DateTime.UtcNow,
                ExpiresAt  = DateTime.UtcNow.AddHours(sessionHours),
                Status     = "Active"
            });

            var uaFingerprint = Convert.ToHexString(
                System.Security.Cryptography.SHA256.HashData(
                    System.Text.Encoding.UTF8.GetBytes(userAgent)
                )).ToLower()[..16];

            var existingDevice = await _context.Devices
                .FirstOrDefaultAsync(d => d.UserId == user.Id
                                       && d.Fingerprint == uaFingerprint);

            bool isNewDevice = existingDevice == null;

            if (existingDevice != null)
            {
                existingDevice.LastUsed  = DateTime.UtcNow;
                existingDevice.IpAddress = ip;
                if (existingDevice.Status == "revoked")
                    existingDevice.Status = "active";
            }
            else
            {
                _context.Devices.Add(new Device
                {
                    Id          = Guid.NewGuid(),
                    UserId      = user.Id,
                    DeviceName  = $"{browser} on {os}",
                    DeviceType  = deviceType,
                    OS          = os,
                    Browser     = browser,
                    IpAddress   = ip,
                    Fingerprint = uaFingerprint,
                    Location    = "Unknown",
                    IsTrusted   = false,
                    LastUsed    = DateTime.UtcNow,
                    Status      = "active",
                });

                _context.SecurityAlerts.Add(new SecurityAlert
                {
                    Id          = Guid.NewGuid(),
                    UserId      = user.Id,
                    AlertType   = "New Device Login",
                    Severity    = "medium",
                    Description = $"User '{user.Name}' ({user.EmployeeId}) logged in from a new device: {browser} on {os}. IP: {ip}",
                    Status      = "active",
                    CreatedAt   = DateTime.UtcNow,
                });
            }

            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            if (isNewDevice && !string.IsNullOrEmpty(user.Email))
                await _email.SendNewDeviceAlertAsync(user.Email, user.Name, ip, userAgent);

            var firstRole = user.UserRoles.FirstOrDefault();

            return new
            {
                success = true, token,
                user = new {
                    id              = user.Id.ToString(),
                    user.EmployeeId,
                    user.Name,
                    user.Email,
                    user.Department,
                    user.Status,
                    user.ProfileImageUrl,
                    roleId = firstRole?.RoleId.ToString(),
                    roles  = user.UserRoles.Select(ur => ur.Role?.Name).ToList()
                }
            };
        }

        // Verify TOTP code from Google/Microsoft Authenticator
        public async Task<object> VerifyTotpAsync(string userId, string code)
        {
            var ip = _httpContextAccessor.HttpContext?
                .Connection.RemoteIpAddress?.ToString() ?? "unknown";

            if (!Guid.TryParse(userId, out var userGuid))
                return new { success = false, message = "Invalid user" };

            var setting = await _context.MfaSettings
                .FirstOrDefaultAsync(m => m.UserId == userGuid
                                       && m.Method == "Authenticator"
                                       && m.IsEnabled == true);

            if (setting?.SecretKey == null)
                return new { success = false, message = "Authenticator not set up for this account." };

            var secretBytes = OtpNet.Base32Encoding.ToBytes(setting.SecretKey);
            var totp        = new OtpNet.Totp(secretBytes);
            var valid       = totp.VerifyTotp(code, out _, new OtpNet.VerificationWindow(2, 2));

            if (!valid)
                return new { success = false, message = "Invalid or expired code. Try again." };

            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userGuid);

            if (user == null)
                return new { success = false, message = "User not found" };

            var concurrentError = await EnforceConcurrentSessionsAsync(userGuid);
            if (concurrentError != null) return concurrentError;

            var token     = GenerateJwtToken(user);
            var userAgent = _httpContextAccessor.HttpContext?
                .Request.Headers["User-Agent"].ToString() ?? "unknown";

            string browser = userAgent.Contains("Edg/")     ? "Edge"
                           : userAgent.Contains("Chrome/")  ? "Chrome"
                           : userAgent.Contains("Firefox/") ? "Firefox"
                           : userAgent.Contains("Safari/")  ? "Safari"
                           : "Browser";

            string os = userAgent.Contains("Windows") ? "Windows"
                      : userAgent.Contains("Mac")     ? "macOS"
                      : userAgent.Contains("iPhone")  ? "iPhone"
                      : userAgent.Contains("Android") ? "Android"
                      : userAgent.Contains("Linux")   ? "Linux"
                      : "Unknown OS";

            string deviceType = userAgent.Contains("Mobile")   || userAgent.Contains("iPhone") || userAgent.Contains("Android") ? "mobile"
                              : userAgent.Contains("Tablet")   || userAgent.Contains("iPad")   ? "tablet"
                              : "desktop";

            var loginSettings = await _context.LoginSettings.FirstOrDefaultAsync();
            int sessionHours  = loginSettings?.MaxSessionDurationHours > 0
                                ? loginSettings.MaxSessionDurationHours : 8;

            _context.Sessions.Add(new Session
            {
                UserId     = user.Id,
                IpAddress  = ip,
                DeviceInfo = userAgent,
                StartedAt  = DateTime.UtcNow,
                ExpiresAt  = DateTime.UtcNow.AddHours(sessionHours),
                Status     = "Active"
            });

            var uaFingerprint = Convert.ToHexString(
                System.Security.Cryptography.SHA256.HashData(
                    System.Text.Encoding.UTF8.GetBytes(userAgent)
                )).ToLower()[..16];

            var existingDevice = await _context.Devices
                .FirstOrDefaultAsync(d => d.UserId == user.Id
                                       && d.Fingerprint == uaFingerprint);

            bool isNewDevice = existingDevice == null;

            if (existingDevice != null)
            {
                existingDevice.LastUsed  = DateTime.UtcNow;
                existingDevice.IpAddress = ip;
                if (existingDevice.Status == "revoked")
                    existingDevice.Status = "active";
            }
            else
            {
                _context.Devices.Add(new Device
                {
                    Id          = Guid.NewGuid(),
                    UserId      = user.Id,
                    DeviceName  = $"{browser} on {os}",
                    DeviceType  = deviceType,
                    OS          = os,
                    Browser     = browser,
                    IpAddress   = ip,
                    Fingerprint = uaFingerprint,
                    Location    = "Unknown",
                    IsTrusted   = false,
                    LastUsed    = DateTime.UtcNow,
                    Status      = "active",
                });

                _context.SecurityAlerts.Add(new SecurityAlert
                {
                    Id          = Guid.NewGuid(),
                    UserId      = user.Id,
                    AlertType   = "New Device Login",
                    Severity    = "medium",
                    Description = $"User '{user.Name}' ({user.EmployeeId}) logged in from a new device: {browser} on {os}. IP: {ip}",
                    Status      = "active",
                    CreatedAt   = DateTime.UtcNow,
                });
            }

            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            if (isNewDevice && !string.IsNullOrEmpty(user.Email))
                await _email.SendNewDeviceAlertAsync(user.Email, user.Name, ip, userAgent);

            var firstRole = user.UserRoles.FirstOrDefault();

            return new
            {
                success = true, token,
                user = new {
                    id              = user.Id.ToString(),
                    user.EmployeeId,
                    user.Name,
                    user.Email,
                    user.Department,
                    user.Status,
                    user.ProfileImageUrl,
                    roleId = firstRole?.RoleId.ToString(),
                    roles  = user.UserRoles.Select(ur => ur.Role?.Name).ToList()
                }
            };
        }

        public async Task<object> RegisterAsync(RegisterDto registerDto)
        {
            bool exists = await _context.Users
                .AnyAsync(u => u.Email == registerDto.Email || u.EmployeeId == registerDto.EmployeeId);

            if (exists)
                return new { success = false, message = "EmployeeId or Email already in use" };

            var user = new User
            {
                FirstName    = registerDto.FirstName,
                LastName     = registerDto.LastName,
                Username     = registerDto.FirstName.ToLower() + registerDto.LastName.ToLower(),
                Name         = $"{registerDto.FirstName} {registerDto.LastName}",
                EmployeeId   = registerDto.EmployeeId,
                Email        = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Status       = "Active",
                MfaEnabled   = false,
                CreatedAt    = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new { success = true, message = "Registered successfully", userId = user.Id };
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return false;
            var sessions = await _context.Sessions
                .Where(s => s.UserId == userGuid && s.Status == "Active").ToListAsync();
            foreach (var s in sessions) s.Status = "Ended";
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object> RefreshTokenAsync(string refreshToken) =>
            await Task.FromResult<object>(new { success = false, message = "Not yet implemented" });

        private async Task<string> GenerateOtpAsync(Guid userId)
        {
            var old = await _context.OtpCodes
                .Where(o => o.UserId == userId && !o.IsUsed).ToListAsync();
            _context.OtpCodes.RemoveRange(old);

            var code = new Random().Next(100000, 999999).ToString();
            _context.OtpCodes.Add(new OtpCode
            {
                UserId    = userId,
                Code      = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(
                    (await _context.MfaConfigs.FirstOrDefaultAsync())?.CodeExpiryMinutes ?? 5),
                IsUsed    = false,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return code;
        }

       public string GenerateJwtToken(User user) 
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new("employeeId",                  user.EmployeeId),
                new("name",                        user.Name),
            };
            foreach (var ur in user.UserRoles)
                if (ur.Role?.Name != null)
                    claims.Add(new Claim("role", ur.Role.Name));

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds      = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
            var token      = new JwtSecurityToken(
                issuer:             _config["Jwt:Issuer"],
                audience:           _config["Jwt:Audience"],
                claims:             claims,
                expires:            DateTime.UtcNow.AddHours(8),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task RecordLoginAttemptAsync(Guid? userId, string ip, string status, string? reason)
        {
            _context.LoginAttempts.Add(new LoginAttempt
            {
                UserId        = userId,
                IpAddress     = ip,
                Status        = status,
                FailureReason = reason,
                AttemptedAt   = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                UserId    = userId,
                Action    = status == "Success" ? "Login Success" : "Login Failed",
                Module    = "Authentication",
                Details   = $"Status: {status}. Reason: {reason ?? "N/A"}. IP: {ip}",
                Status    = status == "Success" ? "Success" : "Failed",
                CreatedAt = DateTime.UtcNow,
                IpAddress = ip,
            });

            if (status == "Failed" && ip != "unknown")
            {
                var settings  = await _context.LoginSettings.FirstOrDefaultAsync();
                int threshold = settings?.MaxFailedAttempts ?? 5;
                var window    = DateTime.UtcNow.AddMinutes(-15);

                var recentFailures = await _context.LoginAttempts
                    .CountAsync(l => l.IpAddress == ip
                                  && l.Status == "Failed"
                                  && l.AttemptedAt >= window);

                if (recentFailures >= threshold - 1)
                {
                    var alertWindow = DateTime.UtcNow.AddHours(-1);
                    var existing    = await _context.SecurityAlerts
                        .AnyAsync(a => a.Description.Contains(ip)
                                    && a.CreatedAt >= alertWindow
                                    && a.Status == "active");

                    if (!existing)
                    {
                        _context.SecurityAlerts.Add(new SecurityAlert
                        {
                            Id          = Guid.NewGuid(),
                            UserId      = userId,
                            AlertType   = "Brute Force Detected",
                            Severity    = recentFailures >= threshold * 2 ? "critical" : "high",
                            Description = $"Repeated login failures from IP {ip}. {recentFailures + 1} attempts in 15 minutes.",
                            Status      = "active",
                            CreatedAt   = DateTime.UtcNow,
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}