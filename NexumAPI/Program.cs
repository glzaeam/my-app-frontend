using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using NexumAPI.Data;
using NexumAPI.Middleware;
using NexumAPI.Services;
using NexumAPI.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NexumDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var key = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(key))
    throw new Exception("JWT key is not configured in appsettings.json!");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        RoleClaimType            = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    };
});

// ✅ RBAC Policies
builder.Services.AddAuthorization(options =>
{
    // System Admin only
    options.AddPolicy("SystemAdmin", policy =>
        policy.RequireRole("System Admin"));

    // System Admin + Branch Manager
    options.AddPolicy("BranchManager", policy =>
        policy.RequireRole("System Admin", "Branch Manager"));

    // System Admin + Branch Manager + Auditor
    options.AddPolicy("Auditor", policy =>
        policy.RequireRole("System Admin", "Branch Manager", "Auditor"));

    // All authenticated roles
    options.AddPolicy("BankTeller", policy =>
        policy.RequireRole("System Admin", "Branch Manager", "Auditor", "Bank Teller"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            "http://localhost:3000",
            "https://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3001"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
    );
});

builder.Services.AddHttpClient();
builder.Services.AddSingleton<LockoutService>();
builder.Services.AddScoped<RecaptchaService>();
builder.Services.AddScoped<SmsService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<NexumDbContext>();
    await DbSeeder.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    context.Response.Headers["X-Content-Type-Options"]    = "nosniff";
    context.Response.Headers["X-Frame-Options"]           = "DENY";
    context.Response.Headers["Referrer-Policy"]           = "no-referrer";
    context.Response.Headers["X-XSS-Protection"]          = "1; mode=block";
    await next();
});

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditMiddleware>();
app.MapControllers();

app.Run();