using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace NexumAPI.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        // ── OTP ──────────────────────────────────────────────
        public async Task<bool> SendOtpAsync(string toEmail, string toName, string otp)
        {
            var message = CreateMessage(toEmail, toName, "Your Nexum OTP Code", $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
                  <h2 style="color:#2dd4bf;">🔐 Two-Factor Authentication</h2>
                  <p style="color:#94a3b8;">Hello {toName}, your Nexum login OTP is:</p>
                  <div style="font-size:42px;font-weight:bold;letter-spacing:12px;text-align:center;padding:24px;background:#1e2d45;border-radius:12px;color:#2dd4bf;margin:24px 0;">
                    {otp}
                  </div>
                  <p style="color:#94a3b8;font-size:14px;">⏰ This code expires in <strong>5 minutes</strong>.</p>
                  <p style="color:#94a3b8;font-size:14px;">🚫 Do not share this code with anyone.</p>
                  <hr style="border-color:#1e2d45;margin:24px 0"/>
                  <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
                </div>
                """);
            return await SendAsync(message, toEmail);
        }

        // ── ACCESS REQUEST NOTIFICATION TO ADMIN ─────────────
        public async Task<bool> SendAccessRequestNotificationAsync(
            string toEmail, string toName, string applicantName, string employeeId)
        {
            var message = CreateMessage(toEmail, toName, "New Access Request - Nexum Banking ERP", $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
                  <h2 style="color:#2dd4bf;">📋 New Access Request</h2>
                  <p style="color:#94a3b8;">Hello {toName}, a new access request has been submitted.</p>
                  <div style="background:#1e2d45;border-radius:12px;padding:20px;margin:20px 0;">
                    <p style="color:white;margin:4px 0;"><strong>Name:</strong> {applicantName}</p>
                    <p style="color:white;margin:4px 0;"><strong>Employee ID:</strong> {employeeId}</p>
                  </div>
                  <p style="color:#94a3b8;">Please log in to the admin panel to review this request.</p>
                  <hr style="border-color:#1e2d45;margin:24px 0"/>
                  <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
                </div>
                """);
            return await SendAsync(message, toEmail);
        }

        // ── ACCESS APPROVED ───────────────────────────────────
        public async Task<bool> SendAccessApprovedAsync(
            string toEmail, string toName, string employeeId)
        {
            var message = CreateMessage(toEmail, toName, "Access Request Approved - Nexum Banking ERP", $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
                  <h2 style="color:#2dd4bf;">✅ Access Request Approved</h2>
                  <p style="color:#94a3b8;">Hello {toName}, your access request has been approved!</p>
                  <div style="background:#1e2d45;border-radius:12px;padding:20px;margin:20px 0;">
                    <p style="color:white;margin:4px 0;"><strong>Employee ID:</strong> {employeeId}</p>
                  </div>
                  <p style="color:#94a3b8;">You can now log in using your Employee ID and the password you set during registration.</p>
                  <hr style="border-color:#1e2d45;margin:24px 0"/>
                  <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
                </div>
                """);
            return await SendAsync(message, toEmail);
        }

        // ── ACCESS REJECTED ───────────────────────────────────
        public async Task<bool> SendAccessRejectedAsync(
            string toEmail, string toName, string? reason)
        {
            var reasonHtml = string.IsNullOrEmpty(reason) ? "" : $"""
                <div style="background:#1e2d45;border-radius:12px;padding:20px;margin:20px 0;">
                  <p style="color:white;margin:4px 0;"><strong>Reason:</strong> {reason}</p>
                </div>
                """;

            var message = CreateMessage(toEmail, toName, "Access Request Rejected - Nexum Banking ERP", $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
                  <h2 style="color:#ef4444;">❌ Access Request Rejected</h2>
                  <p style="color:#94a3b8;">Hello {toName}, unfortunately your access request has been rejected.</p>
                  {reasonHtml}
                  <p style="color:#94a3b8;">Please contact your system administrator for more information.</p>
                  <hr style="border-color:#1e2d45;margin:24px 0"/>
                  <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
                </div>
                """);
            return await SendAsync(message, toEmail);
        }

        public async Task<bool> SendPasswordResetAsync(string toEmail, string toName, string resetLink)
{
    var message = CreateMessage(toEmail, toName, "Password Reset - Nexum Banking ERP", $"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
          <h2 style="color:#2dd4bf;">🔑 Password Reset Request</h2>
          <p style="color:#94a3b8;">Hello {toName}, we received a request to reset your password.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="{resetLink}"
               style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,hsl(170,65%,42%),hsl(170,60%,48%));color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
              Reset Password
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;">⏰ This link expires in <strong>15 minutes</strong>.</p>
          <p style="color:#94a3b8;font-size:13px;">🚫 If you did not request this, ignore this email.</p>
          <hr style="border-color:#1e2d45;margin:24px 0"/>
          <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
        </div>
        """);
    return await SendAsync(message, toEmail);
}

public async Task<bool> SendWelcomeEmailAsync(
    string toEmail, string toName, string employeeId, string tempPassword)
{
    var message = CreateMessage(toEmail, toName, "Welcome to Nexum Banking ERP", $"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
          <h2 style="color:#2dd4bf;">👋 Welcome to Nexum!</h2>
          <p style="color:#94a3b8;">Hello {toName}, your account has been created.</p>
          <div style="background:#1e2d45;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="color:white;margin:4px 0;"><strong>Employee ID:</strong> {employeeId}</p>
            <p style="color:white;margin:4px 0;"><strong>Temporary Password:</strong> {tempPassword}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;">Please log in and change your password immediately.</p>
          <hr style="border-color:#1e2d45;margin:24px 0"/>
          <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
        </div>
        """);
    return await SendAsync(message, toEmail);
}

public async Task<bool> SendLockoutEmailAsync(string toEmail, string toName, int minutes)
{
    var message = CreateMessage(toEmail, toName, "⚠️ Nexum Account Locked", $"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
          <h2 style="color:#f87171;">⚠️ Account Temporarily Locked</h2>
          <p style="color:#94a3b8;">Hello {toName}, your account has been locked due to too many failed login attempts.</p>
          <div style="padding:16px;background:#1e2d45;border-radius:12px;margin:24px 0;border-left:4px solid #f87171;">
            <p style="color:#f87171;margin:0;font-weight:bold;">🔒 Locked for {minutes} minutes</p>
            <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Your account will unlock automatically after this period.</p>
          </div>
          <p style="color:#94a3b8;font-size:14px;">If this wasn't you, contact your administrator immediately.</p>
          <hr style="border-color:#1e2d45;margin:24px 0"/>
          <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
        </div>
        """);
    return await SendAsync(message, toEmail);
}

public async Task<bool> SendPasswordChangedEmailAsync(string toEmail, string toName, string ip)
{
    var message = CreateMessage(toEmail, toName, "Your Password Was Changed — Nexum Banking ERP", $"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
          <h2 style="color:#2dd4bf;">🔐 Password Changed</h2>
          <p style="color:#94a3b8;">Hello {toName}, your password was just changed.</p>
          <div style="background:#1e2d45;border-radius:12px;padding:16px;margin:20px 0;">
            <p style="color:#94a3b8;margin:4px 0;font-size:13px;">🕐 Time: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
            <p style="color:#94a3b8;margin:4px 0;font-size:13px;">🌐 IP Address: {ip}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;">If this wasn't you, secure your account immediately.</p>
          <hr style="border-color:#1e2d45;margin:24px 0"/>
          <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
        </div>
        """);
    return await SendAsync(message, toEmail);
}

public async Task<bool> SendUnlockEmailAsync(string toEmail, string toName, string unlockLink)
{
    var message = CreateMessage(toEmail, toName, "Unlock Your Account — Nexum Banking ERP", $"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
          <h2 style="color:#2dd4bf;">🔓 Account Locked</h2>
          <p style="color:#94a3b8;">Hello {toName}, your account was locked due to too many failed login attempts.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="{unlockLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,hsl(170,65%,42%),hsl(170,60%,48%));color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
              Unlock My Account
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;">⏰ This link expires in <strong>15 minutes</strong>.</p>
          <p style="color:#94a3b8;font-size:13px;">If you did not try to log in, your password may be compromised.</p>
          <hr style="border-color:#1e2d45;margin:24px 0"/>
          <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
        </div>
        """);
    return await SendAsync(message, toEmail);
}
public async Task<bool> SendNewDeviceAlertAsync(string toEmail, string toName, string ip, string userAgent)
{
    string browser = userAgent.Contains("Edg/")    ? "Edge"
                   : userAgent.Contains("Chrome/") ? "Chrome"
                   : userAgent.Contains("Firefox/") ? "Firefox"
                   : userAgent.Contains("Safari/")  ? "Safari"
                   : "Unknown Browser";

    string os = userAgent.Contains("Windows") ? "Windows"
              : userAgent.Contains("Mac")     ? "macOS"
              : userAgent.Contains("iPhone")  ? "iPhone"
              : userAgent.Contains("Android") ? "Android"
              : "Unknown OS";

    var message = CreateMessage(toEmail, toName, "New Login Detected — Nexum Banking ERP", $"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1a2e;border-radius:16px;color:white;">
          <h2 style="color:#2dd4bf;">🔔 New Device Login</h2>
          <p style="color:#94a3b8;">Hello {toName}, a login was detected from a new device.</p>
          <div style="background:#1e2d45;border-radius:12px;padding:16px;margin:20px 0;">
            <p style="color:#94a3b8;margin:4px 0;font-size:13px;">🌐 IP Address: {ip}</p>
            <p style="color:#94a3b8;margin:4px 0;font-size:13px;">💻 Device: {browser} / {os}</p>
            <p style="color:#94a3b8;margin:4px 0;font-size:13px;">🕐 Time: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;">If this wasn't you, change your password immediately.</p>
          <hr style="border-color:#1e2d45;margin:24px 0"/>
          <p style="color:#475569;font-size:12px;">© 2026 Nexum Banking ERP.</p>
        </div>
        """);
    return await SendAsync(message, toEmail);
}
        // ── HELPERS ───────────────────────────────────────────
        private MimeMessage CreateMessage(string toEmail, string toName, string subject, string htmlBody)
        {
            var gmailAddress = _config["Gmail:Email"]!;
            var displayName  = _config["Gmail:DisplayName"] ?? "Nexum Banking ERP";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(displayName, gmailAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };
            return message;
        }

        private async Task<bool> SendAsync(MimeMessage message, string toEmail)
        {
            var gmailAddress = _config["Gmail:Email"]!;
            var appPassword  = _config["Gmail:AppPassword"]!;

            try
            {
                using var client = new SmtpClient();
                await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(gmailAddress, appPassword);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                Console.WriteLine($"📧 Email sent to {toEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Email failed: {ex.Message}");
                return false;
            }
        }
    }
}