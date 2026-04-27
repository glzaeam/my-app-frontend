namespace NexumAPI.Services
{
    public class SmsService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _http;

        public SmsService(IConfiguration config, IHttpClientFactory httpFactory)
        {
            _config = config;
            _http   = httpFactory.CreateClient();
        }

        public async Task<bool> SendOtpAsync(string phone, string otp)
        {
            var apiKey     = _config["Semaphore:ApiKey"];
            var senderName = _config["Semaphore:SenderName"] ?? "NexumBank";

            var formatted = phone.StartsWith("0")
                ? "63" + phone.Substring(1)
                : phone;

            var payload = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "apikey",     apiKey! },
                { "number",     formatted },
                { "message",    $"Your Nexum OTP is: {otp}. Valid for 5 minutes. Do not share this code." },
                { "sendername", senderName }
            });

            try
            {
                var response = await _http.PostAsync(
                    "https://api.semaphore.co/api/v4/messages", payload);
                var result = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"📱 SMS result: {result}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ SMS failed: {ex.Message}");
                return false;
            }
        }
    }
}