using System.Collections.Concurrent;

namespace NexumAPI.Services
{
    public class LockoutEntry
    {
        public int FailedAttempts { get; set; }
        public DateTime? LockedUntil { get; set; }
        public DateTime LastAttempt { get; set; }
    }

    public class LockoutService
    {
        private static readonly ConcurrentDictionary<string, LockoutEntry> _ipStore
            = new();
        private static readonly ConcurrentDictionary<string, LockoutEntry> _accountStore
            = new();

        // ✅ No longer static — loaded from DB on startup via InitializeAsync
        private int _maxAttempts    = 5;
        private int _lockoutMinutes = 15;
        private int _captchaAfter   = 3;

        // ✅ Called once at startup by Program.cs to load DB settings
        public void Initialize(int maxAttempts, int lockoutMinutes, int captchaAfter)
        {
            _maxAttempts    = maxAttempts;
            _lockoutMinutes = lockoutMinutes;
            _captchaAfter   = captchaAfter;
        }

        public void UpdateSettings(int maxAttempts, int lockoutMinutes, int captchaAfter)
        {
            _maxAttempts    = maxAttempts;
            _lockoutMinutes = lockoutMinutes;
            _captchaAfter   = captchaAfter;
        }

        // ✅ Expose so AuthService can use the real value for attemptsLeft
        public int MaxAttempts => _maxAttempts;

        public bool IsIpLocked(string ip)
        {
            // ✅ IP never gets fully locked — only used for CAPTCHA threshold tracking
            return false;
        }

        public bool IsAccountLocked(string employeeId)
        {
            if (!_accountStore.TryGetValue(employeeId, out var entry)) return false;
            if (entry.LockedUntil == null) return false;
            if (DateTime.UtcNow < entry.LockedUntil) return true;
            _accountStore.TryRemove(employeeId, out _);
            return false;
        }

        public int GetIpFailedAttempts(string ip)
            => _ipStore.TryGetValue(ip, out var entry) ? entry.FailedAttempts : 0;

        public int GetAccountFailedAttempts(string employeeId)
            => _accountStore.TryGetValue(employeeId, out var entry) ? entry.FailedAttempts : 0;

        public bool RequiresCaptcha(string ip, string employeeId)
            => GetIpFailedAttempts(ip) >= _captchaAfter
            || GetAccountFailedAttempts(employeeId) >= _captchaAfter;

        public (bool isLocked, DateTime? lockedUntil) RecordFailedAttempt(
            string ip, string employeeId)
        {
            // ✅ IP store only tracks count for CAPTCHA threshold — never locks the IP
            var ipEntry = _ipStore.GetOrAdd(ip, _ => new LockoutEntry());
            lock (ipEntry)
            {
                ipEntry.FailedAttempts++;
                ipEntry.LastAttempt = DateTime.UtcNow;
                // ❌ Removed: IP lockout — too aggressive, blocks all users on same network
            }

            // ✅ Only the specific ACCOUNT gets locked
            var accEntry = _accountStore.GetOrAdd(employeeId, _ => new LockoutEntry());
            lock (accEntry)
            {
                accEntry.FailedAttempts++;
                accEntry.LastAttempt = DateTime.UtcNow;
                if (accEntry.FailedAttempts >= _maxAttempts)
                    accEntry.LockedUntil = DateTime.UtcNow.AddMinutes(_lockoutMinutes);
            }

            bool isLocked = accEntry.LockedUntil.HasValue;
            DateTime? lockedUntil = accEntry.LockedUntil;
            return (isLocked, lockedUntil);
        }

        public int GetBackoffSeconds(string ip, string employeeId)
        {
            int attempts = Math.Max(
                GetIpFailedAttempts(ip),
                GetAccountFailedAttempts(employeeId));
            return attempts switch { <= 2 => 0, 3 => 2, 4 => 4, _ => 8 };
        }

        public void ResetAttempts(string ip, string employeeId)
        {
            _ipStore.TryRemove(ip, out _);
            _accountStore.TryRemove(employeeId, out _);
        }

        public TimeSpan? GetRemainingLockout(string ip, string employeeId)
        {
            DateTime? ipLocked  = _ipStore.TryGetValue(ip, out var ie) ? ie.LockedUntil : null;
            DateTime? accLocked = _accountStore.TryGetValue(employeeId, out var ae) ? ae.LockedUntil : null;
            DateTime? latest    = ipLocked.HasValue && accLocked.HasValue
                ? (ipLocked > accLocked ? ipLocked : accLocked)
                : ipLocked ?? accLocked;
            if (latest == null || DateTime.UtcNow >= latest) return null;
            return latest - DateTime.UtcNow;
        }
    }
}