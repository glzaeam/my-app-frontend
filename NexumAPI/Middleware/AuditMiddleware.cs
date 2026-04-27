using NexumAPI.Data;
using NexumAPI.Models;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;

    public AuditMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context, NexumDbContext db)
    {
        await _next(context);

        // DO NOT log raw HTTP requests — only real user actions should be logged
        // User actions are logged explicitly by controllers (auth, device trust, etc.)
        // This middleware should NOT create automatic audit entries
    }
}