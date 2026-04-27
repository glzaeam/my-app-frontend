using System.Security.Claims;
using System.Text;

namespace NexumAPI.Helpers
{
    public class JwtHelper
    {
        // TODO: Implement JWT token generation
        public static string GenerateToken(int userId, string email, string username)
        {
            throw new NotImplementedException();
        }

        // TODO: Implement JWT token validation
        public static ClaimsPrincipal ValidateToken(string token)
        {
            throw new NotImplementedException();
        }

        // TODO: Implement JWT refresh token generation
        public static string GenerateRefreshToken()
        {
            throw new NotImplementedException();
        }
    }
}
