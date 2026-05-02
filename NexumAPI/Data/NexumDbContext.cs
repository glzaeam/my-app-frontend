using Microsoft.EntityFrameworkCore;
using NexumAPI.Models;

namespace NexumAPI.Data;

public class NexumDbContext : DbContext
{
    public NexumDbContext(DbContextOptions<NexumDbContext> options) : base(options) {}

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<Module> Modules { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Device> Devices { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    // ✅ ADD THESE (you missed some tables)
    public DbSet<SecurityAlert> SecurityAlerts { get; set; }
    public DbSet<LoginAttempt> LoginAttempts { get; set; }
    public DbSet<MfaSetting> MfaSettings { get; set; }
    public DbSet<PasswordPolicy> PasswordPolicies { get; set; }
    public DbSet<LoginSetting> LoginSettings { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<OtpCode> OtpCodes { get; set; }
    public DbSet<AccessRequest> AccessRequests { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<MfaConfig> MfaConfigs { get; set; }
    public DbSet<PasswordHistory> PasswordHistories { get; set; }
    public DbSet<TransactionTrail> TransactionTrails { get; set; }
    public DbSet<RoleHierarchy> RoleHierarchies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

    // -------------------------
    // USER ↔ BRANCH
    // -------------------------
    modelBuilder.Entity<User>()
        .HasOne(u => u.Branch)
        .WithMany(b => b.Users)
        .HasForeignKey(u => u.BranchId)
        .OnDelete(DeleteBehavior.SetNull);

    // -------------------------
    // USER ↔ USER ROLES
    // -------------------------
    modelBuilder.Entity<UserRole>()
        .HasOne(ur => ur.User)
        .WithMany(u => u.UserRoles)
        .HasForeignKey(ur => ur.UserId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<UserRole>()
        .HasOne(ur => ur.Role)
        .WithMany(r => r.UserRoles)
        .HasForeignKey(ur => ur.RoleId)
        .OnDelete(DeleteBehavior.Restrict);

    modelBuilder.Entity<UserRole>()
        .HasIndex(ur => new { ur.UserId, ur.RoleId })
        .IsUnique();

    // -------------------------
    // ROLE ↔ PERMISSIONS
    // -------------------------
    modelBuilder.Entity<Permission>()
        .HasOne(p => p.Role)
        .WithMany(r => r.Permissions)
        .HasForeignKey(p => p.RoleId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<Permission>()
        .HasOne(p => p.Module)
        .WithMany(m => m.Permissions)
        .HasForeignKey(p => p.ModuleId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<Permission>()
        .HasIndex(p => new { p.RoleId, p.ModuleId })
        .IsUnique();

    // -------------------------
    // USER ↔ SESSIONS
    // -------------------------
    modelBuilder.Entity<Session>()
        .HasOne(s => s.User)
        .WithMany(u => u.Sessions)
        .HasForeignKey(s => s.UserId)
        .OnDelete(DeleteBehavior.Cascade);

    // -------------------------
    // USER ↔ DEVICES
    // -------------------------
    modelBuilder.Entity<Device>()
        .HasOne(d => d.User)
        .WithMany(u => u.Devices)
        .HasForeignKey(d => d.UserId)
        .OnDelete(DeleteBehavior.Cascade);

    // -------------------------
    // USER ↔ AUDIT LOGS
    // -------------------------
    modelBuilder.Entity<AuditLog>()
        .HasOne(a => a.User)
        .WithMany(u => u.AuditLogs)
        .HasForeignKey(a => a.UserId)
        .OnDelete(DeleteBehavior.SetNull);

    // -------------------------
    // USER ↔ SECURITY ALERTS
    // -------------------------
    modelBuilder.Entity<SecurityAlert>()
        .HasOne(sa => sa.User)
        .WithMany(u => u.SecurityAlerts)
        .HasForeignKey(sa => sa.UserId)
        .OnDelete(DeleteBehavior.SetNull);

    // -------------------------
    // USER ↔ LOGIN ATTEMPTS
    // -------------------------
    modelBuilder.Entity<LoginAttempt>()
        .HasOne(la => la.User)
        .WithMany(u => u.LoginAttempts)
        .HasForeignKey(la => la.UserId)
        .OnDelete(DeleteBehavior.SetNull);

    // -------------------------
    // USER ↔ MFA SETTINGS
    // -------------------------
    modelBuilder.Entity<MfaSetting>()
        .HasOne(m => m.User)
        .WithMany(u => u.MfaSettings)
        .HasForeignKey(m => m.UserId)
        .OnDelete(DeleteBehavior.Cascade);

    // -------------------------
    // UNIQUE CONSTRAINTS
    // -------------------------
    modelBuilder.Entity<User>()
        .HasIndex(u => u.EmployeeId)
        .IsUnique();

    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .IsUnique();

    modelBuilder.Entity<Role>()
        .HasIndex(r => r.Name)
        .IsUnique();

    modelBuilder.Entity<Branch>()
        .HasIndex(b => b.Code)
        .IsUnique();

    modelBuilder.Entity<Branch>()
        .HasIndex(b => b.Name)
        .IsUnique();

    modelBuilder.Entity<Module>()
        .HasIndex(m => m.Name)
        .IsUnique();

        // -------------------------
    // ROLE HIERARCHY
    // -------------------------
    modelBuilder.Entity<RoleHierarchy>()
        .HasOne(h => h.ParentRole)
        .WithMany()
        .HasForeignKey(h => h.ParentRoleId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<RoleHierarchy>()
        .HasOne(h => h.ChildRole)
        .WithMany()
        .HasForeignKey(h => h.ChildRoleId)
        .OnDelete(DeleteBehavior.NoAction);

    // -------------------------
    // TRANSACTION TRAIL
    // -------------------------
    modelBuilder.Entity<TransactionTrail>()
        .HasOne(t => t.Performer)
        .WithMany()
        .HasForeignKey(t => t.PerformedBy)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<TransactionTrail>()
        .HasOne(t => t.TargetUser)
        .WithMany()
        .HasForeignKey(t => t.TargetUserId)
        .OnDelete(DeleteBehavior.NoAction);

    // -------------------------
    // USER ↔ MFA CONFIG
    // -------------------------
    modelBuilder.Entity<MfaConfig>()
        .HasOne(m => m.User)
        .WithMany(u => u.MfaConfigs)
        .HasForeignKey(m => m.UserId)
        .OnDelete(DeleteBehavior.Cascade);

    // -------------------------
    // ACCESS REQUEST ↔ REVIEWER (User)
    // -------------------------
    modelBuilder.Entity<AccessRequest>()
        .HasOne(a => a.Reviewer)
        .WithMany()
        .HasForeignKey(a => a.ReviewedBy)
        .OnDelete(DeleteBehavior.SetNull);

    // -------------------------
    // ROLE ↔ PASSWORD POLICY
    // -------------------------
    modelBuilder.Entity<PasswordPolicy>()
        .HasOne(p => p.Role)
        .WithMany(r => r.PasswordPolicies)
        .HasForeignKey(p => p.RoleId)
        .OnDelete(DeleteBehavior.SetNull);
}
}