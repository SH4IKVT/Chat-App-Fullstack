using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace ChatApplication.Controllers
{
    [ApiController]
    [Route("api/test-couch")]
    public class TestCouchController : ControllerBase
    {
        private readonly HttpClient _http;

        public TestCouchController()
        {
            _http = new HttpClient();

            // 🔐 Basic Auth (change password if needed)
            var byteArray = Encoding.ASCII.GetBytes("admin:admin123");
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue(
                    "Basic", Convert.ToBase64String(byteArray));
        }

        [HttpGet]
        public async Task<IActionResult> TestCouch()
        {
            try
            {
                var testData = new
                {
                    name = "test_user",
                    time = DateTime.Now
                };

                var json = JsonSerializer.Serialize(testData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _http.PostAsync("http://localhost:5984/userdb", content);

                var result = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new
                    {
                        message = "CouchDB error",
                        error = result
                    });
                }

                return Ok(new
                {
                    message = "CouchDB working",
                    response = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = "Exception occurred",
                    error = ex.Message
                });
            }
        }
    }
}