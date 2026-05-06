using Microsoft.EntityFrameworkCore;
using NexumAPI.Models;

namespace NexumAPI.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(NexumDbContext context)
        {
            await context.Database.MigrateAsync();

            // 1. BRANCH
            if (!await context.Branches.AnyAsync())
            {
                context.Branches.Add(new Branch
                {
                    Name           = "Head Office",
                    Location       = "Main",
                    Code           = "HO001",
                    IsHeadquarters = true,
                    CreatedAt      = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            // 2. MODULES
            if (!await context.Modules.AnyAsync())
            {
                context.Modules.AddRange(
                    new Module { Name = "Users",    Description = "User management", Route = "/users" },
                    new Module { Name = "Roles",    Description = "Role management", Route = "/roles" },
                    new Module { Name = "Audit",    Description = "Audit logs",      Route = "/audit" },
                    new Module { Name = "Security", Description = "Security alerts", Route = "/security" },
                    new Module { Name = "Sessions", Description = "Active sessions", Route = "/sessions" },
                    new Module { Name = "Password Policy", Description = "Password policy management", Route = "/authentication/password-policy" }
                );
                await context.SaveChangesAsync();
            }

            // 3. ROLES
            if (!await context.Roles.AnyAsync())
            {
                context.Roles.AddRange(
                    new Role { Name = "System Admin",   Description = "Full system access" },
                    new Role { Name = "Branch Manager", Description = "Department manager" },
                    new Role { Name = "Auditor",        Description = "Audit and compliance" },
                    new Role { Name = "Bank Teller",    Description = "Standard user" }
                );
                await context.SaveChangesAsync();
            }

            // 4. PERMISSIONS
            if (!await context.Permissions.AnyAsync())
            {
                var adminRolePerms = await context.Roles.FirstAsync(r => r.Name == "System Admin");
                var modules        = await context.Modules.ToListAsync();

                context.Permissions.AddRange(modules.Select(m => new Permission
                {
                    RoleId    = adminRolePerms.Id,
                    ModuleId  = m.Id,
                    CanView   = true,
                    CanEdit   = true,
                    CanDelete = true
                }));
                await context.SaveChangesAsync();
            }

            // 5. ADMIN USER
            if (!await context.Users.AnyAsync(u => u.EmployeeId == "ADM001"))
            {
                var adminBranch = await context.Branches.FirstAsync(b => b.Code == "HO001");
                var adminRole   = await context.Roles.FirstAsync(r => r.Name == "System Admin");

                var adminUser = new User
                {
                    FirstName    = "Admin",
                    LastName     = "User",
                    Username     = "adminuser",
                    EmployeeId   = "ADM001",
                    Name         = "Admin User",
                    Email        = "admin@nexum.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Department   = "IT",
                    BranchId     = adminBranch.Id,
                    Status       = "Active",
                    MfaEnabled   = false,
                    CreatedAt    = DateTime.UtcNow
                };
                context.Users.Add(adminUser);
                await context.SaveChangesAsync();

                context.UserRoles.Add(new UserRole
                {
                    UserId     = adminUser.Id,
                    RoleId     = adminRole.Id,
                    AssignedAt = DateTime.UtcNow,
                    AssignedBy = null
                });

                context.MfaSettings.Add(new MfaSetting
                {
                    UserId     = adminUser.Id,
                    Method     = "None",
                    IsEnabled  = false,
                    EnrolledAt = DateTime.UtcNow
                });

                await context.SaveChangesAsync();
            }

            // 6. LOGIN SETTINGS
            if (!await context.LoginSettings.AnyAsync())
            {
                context.LoginSettings.Add(new LoginSetting
                {
                    MaxFailedAttempts     = 5,
                    LockoutDuration       = 15,
                    SessionTimeoutMinutes = 480,
                    MaxConcurrentSessions = 3,
                    IpBlockingEnabled     = false,
                    BlockedIps            = ""
                });
                await context.SaveChangesAsync();
            }

            // 7. PASSWORD POLICY
            if (!await context.PasswordPolicies.AnyAsync())
            {
                context.PasswordPolicies.Add(new PasswordPolicy
                {
                    MinLength              = 8,
                    RequireUppercase       = true,
                    RequireLowercase       = true,
                    RequireNumbers         = true,
                    RequireSpecial         = true,
                    ExpiryDays             = 90,
                    HistoryCount           = 5,
                    MaxFailedAttempts      = 5,
                    LockoutDurationMinutes = 15
                });
                await context.SaveChangesAsync();
            }

            Console.WriteLine("✅ Database seeding complete.");
        }
    }
}