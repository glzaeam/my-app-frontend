using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Models;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/password-policy")]
    [Authorize]
    public class PasswordPolicyController : ControllerBase
    {
        private readonly NexumDbContext _context;
        public PasswordPolicyController(NexumDbContext context) => _context = context;

        // GET /api/password-policy
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var policy = await _context.PasswordPolicies.FirstOrDefaultAsync();
            if (policy == null)
                return Ok(new {
                    minLength         = 12,   // changed from 8
                    requireUppercase  = true,
                    requireLowercase  = true,
                    requireNumbers    = true,
                    requireSpecial    = true,
                    blockCommon       = true,
                    expiryDays        = 90,
                    historyCount      = 5,
                });

            return Ok(new {
                minLength        = policy.MinLength < 12 ? 12 : policy.MinLength,
                policy.RequireUppercase,
                policy.RequireLowercase,
                policy.RequireNumbers,
                policy.RequireSpecial,
                blockCommon  = true,
                policy.ExpiryDays,
                policy.HistoryCount,
            });
        }

        // PUT /api/password-policy
        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Save([FromBody] PasswordPolicyRequest dto)
        {
            // Enforce minimum of 12
            if (dto.MinLength < 12) dto.MinLength = 12;

            var policy = await _context.PasswordPolicies.FirstOrDefaultAsync();
            if (policy == null)
            {
                policy = new PasswordPolicy { Id = Guid.NewGuid() };
                _context.PasswordPolicies.Add(policy);
            }

            policy.MinLength        = dto.MinLength;
            policy.RequireUppercase = dto.RequireUppercase;
            policy.RequireLowercase = dto.RequireLowercase;
            policy.RequireNumbers   = dto.RequireNumbers;
            policy.RequireSpecial   = dto.RequireSpecial;
            policy.ExpiryDays       = dto.ExpiryDays;
            policy.HistoryCount     = dto.HistoryCount;

            _context.AuditLogs.Add(new AuditLog {
                Action    = "Password Policy Updated",
                Module    = "Password Policy",
                Details   = $"MinLength:{dto.MinLength}, Expiry:{dto.ExpiryDays}days, History:{dto.HistoryCount}",
                Status    = "Success",
                CreatedAt = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Password policy saved" });
        }

        // GET /api/password-policy/roles
        [HttpGet("roles")]
        public async Task<IActionResult> GetRolePolicies()
        {
            var roles = await _context.Roles
                .Include(r => r.UserRoles)
                .Select(r => new {
                    r.Id,
                    r.Name,
                    r.MfaRequired,
                    r.MfaRequirement,
                    UserCount = r.UserRoles.Count,
                })
                .ToListAsync();

            var policy = await _context.PasswordPolicies.FirstOrDefaultAsync();

            return Ok(roles.Select(r => new {
                r.Id,
                r.Name,
                r.UserCount,
                MinLength    = Math.Max(12, policy?.MinLength ?? 12),
                ExpiryDays   = policy?.ExpiryDays ?? 90,
                HistoryCount = policy?.HistoryCount ?? 5,
                MfaRequired  = r.MfaRequired,
            }));
        }

        // POST /api/password-policy/validate
        [HttpPost("validate")]
        [AllowAnonymous]
        public async Task<IActionResult> Validate([FromBody] ValidatePasswordRequest dto)
        {
            var policy = await _context.PasswordPolicies.FirstOrDefaultAsync();
            var errors = new List<string>();

            int minLen = Math.Max(12, policy?.MinLength ?? 12); // never below 12
            int maxLen = 128;

            if (dto.Password.Length < minLen)
                errors.Add($"Password must be at least {minLen} characters.");

            if (dto.Password.Length > maxLen)
                errors.Add($"Password must not exceed {maxLen} characters.");

            if (policy?.RequireUppercase == true && !dto.Password.Any(char.IsUpper))
                errors.Add("Must contain an uppercase letter.");

            if (policy?.RequireLowercase == true && !dto.Password.Any(char.IsLower))
                errors.Add("Must contain a lowercase letter.");

            if (policy?.RequireNumbers == true && !dto.Password.Any(char.IsDigit))
                errors.Add("Must contain a number.");

            if (policy?.RequireSpecial == true && !dto.Password.Any(c => "!@#$%^&*()_+-=[]{}|;':\",./<>?".Contains(c)))
                errors.Add("Must contain a special character (!@#$%^&*).");

            if (dto.UserId.HasValue && policy?.HistoryCount > 0)
            {
                var recentHashes = await _context.PasswordHistories
                    .Where(h => h.UserId == dto.UserId.Value)
                    .OrderByDescending(h => h.CreatedAt)
                    .Take(policy.HistoryCount)
                    .Select(h => h.PasswordHash)
                    .ToListAsync();

                if (recentHashes.Any(hash => BCrypt.Net.BCrypt.Verify(dto.Password, hash)))
                    errors.Add($"Cannot reuse your last {policy.HistoryCount} passwords.");
            }

            return Ok(new { valid = errors.Count == 0, errors });
        }
    }

    public class PasswordPolicyRequest
    {
        public int  MinLength        { get; set; } = 12;
        public bool RequireUppercase { get; set; } = true;
        public bool RequireLowercase { get; set; } = true;
        public bool RequireNumbers   { get; set; } = true;
        public bool RequireSpecial   { get; set; } = true;
        public bool BlockCommon      { get; set; } = true;
        public int  ExpiryDays       { get; set; } = 90;
        public int  HistoryCount     { get; set; } = 5;
    }

    public class ValidatePasswordRequest
    {
        public string Password { get; set; } = string.Empty;
        public Guid?  UserId   { get; set; }
    }
}