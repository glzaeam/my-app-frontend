using System.Text.Json;

namespace NexumAPI.Services
{
    public class RecaptchaService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _http;

        public RecaptchaService(IConfiguration config, IHttpClientFactory factory)
        {
            _config = config;
            _http   = factory.CreateClient();
        }

        public async Task<bool> VerifyAsync(string token)
        {
            var secretKey = _config["ReCaptcha:SecretKey"];
            var response  = await _http.PostAsync(
                "https://www.google.com/recaptcha/api/siteverify",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "secret",   secretKey! },
                    { "response", token }
                })
            );
            var json = await response.Content.ReadAsStringAsync();
            var doc  = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("success").GetBoolean();
        }
    }
}