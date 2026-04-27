using Microsoft.AspNetCore.Http;
using System.Net;

namespace NexumAPI.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                // TODO: Implement global exception handling logic
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // TODO: Log exception
            // TODO: Return appropriate error response

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            return context.Response.WriteAsJsonAsync(new
            {
                message = "An error occurred processing the request.",
                detail = exception.Message
            });
        }
    }
}
