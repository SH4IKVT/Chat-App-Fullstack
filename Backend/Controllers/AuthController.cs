using Microsoft.AspNetCore.Mvc;
using ChatApplication.Models;
using System.Text;
using System.Text.Json;
using BCrypt.Net;

namespace ChatApplication.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly HttpClient _http;

        public AuthController()
        {
            _http = new HttpClient();

            var byteArray = Encoding.ASCII.GetBytes("admin:admin123");
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue(
                    "Basic", Convert.ToBase64String(byteArray));
        }

        // ===========================
        // ✅ SIGNUP
        // ===========================
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] User user)
        {
            try
            {
                var checkRes = await _http.GetAsync($"http://localhost:5984/userdb/{user.Email}");

                if (checkRes.IsSuccessStatusCode)
                    return BadRequest(new { message = "User already exists" });

                user.Status = "pending";
                user.Role = "User";
                user.CreatedAt = DateTime.Now;

                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

                var json = JsonSerializer.Serialize(user);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                await _http.PutAsync(
                    $"http://localhost:5984/userdb/{user.Email}",
                    content
                );

                return Ok(new { message = "User registered successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Signup error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // ===========================
        // 🔥 LOGIN
        // ===========================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var response = await _http.GetAsync($"http://localhost:5984/userdb/{req.Email}");

                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadAsStringAsync();
                    var user = JsonSerializer.Deserialize<User>(data);

                    if (user == null)
                        return Unauthorized(new { message = "Invalid credentials" });

                    if (!BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
                        return Unauthorized(new { message = "Invalid credentials" });

                    if (user.Status != "approved")
                        return BadRequest(new { message = "User not approved yet" });

                    return Ok(new
                    {
                        role = user.Role,
                        name = user.FirstName + " " + user.LastName,
                        email = user.Email
                    });
                }

                if (req.Email == "admin@gmail.com" && req.Password == "123")
                {
                    return Ok(new
                    {
                        role = "Admin",
                        name = "Admin User",
                        email = "admin@gmail.com"
                    });
                }

                return Unauthorized(new { message = "Invalid credentials" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Login error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // ===========================
        // 🔥 FIXED GET USER (IMPORTANT)
        // ===========================
        [HttpGet("user/{email}")]
        public async Task<IActionResult> GetUser([FromRoute] string email)
        {
            try
            {
                // 🔹 Decode URL (handles @ properly)
                email = Uri.UnescapeDataString(email);

                var response = await _http.GetAsync($"http://localhost:5984/userdb/{email}");

                if (!response.IsSuccessStatusCode)
                    return NotFound(new { message = "User not found" });

                var data = await response.Content.ReadAsStringAsync();
                var user = JsonSerializer.Deserialize<User>(data);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new
                {
                    name = user.FirstName + " " + user.LastName,
                    email = user.Email,
                    role = user.Role,
                    status = user.Status,
                    createdAt = user.CreatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetUser error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // ===========================
        // GET USERS
        // ===========================
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var response = await _http.GetAsync(
                    "http://localhost:5984/userdb/_all_docs?include_docs=true"
                );

                var data = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(data);

                var usersList = new List<object>();

                foreach (var row in doc.RootElement.GetProperty("rows").EnumerateArray())
                {
                    if (row.TryGetProperty("doc", out var userDoc))
                    {
                        if (userDoc.TryGetProperty("Email", out _))
                        {
                            var user = JsonSerializer.Deserialize<User>(userDoc.ToString());

                            if (user != null)
                            {
                                usersList.Add(new
                                {
                                    user.FirstName,
                                    user.LastName,
                                    user.Email,
                                    user.Role,
                                    user.Status,
                                    user.CreatedAt
                                });
                            }
                        }
                    }
                }

                return Ok(usersList);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Fetch error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // ===========================
        // APPROVE
        // ===========================
        [HttpPost("approve")]
        public async Task<IActionResult> Approve([FromBody] EmailRequest req)
        {
            try
            {
                var getRes = await _http.GetAsync($"http://localhost:5984/userdb/{req.Email}");

                if (!getRes.IsSuccessStatusCode)
                    return NotFound(new { message = "User not found" });

                var getData = await getRes.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(getData);
                var rev = doc.RootElement.GetProperty("_rev").GetString();

                var user = JsonSerializer.Deserialize<User>(getData);

                user.Status = "approved";

                var json = JsonSerializer.Serialize(user);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                await _http.PutAsync(
                    $"http://localhost:5984/userdb/{req.Email}?rev={rev}",
                    content
                );

                return Ok(new { message = "User approved" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Approve error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // ===========================
        // REJECT
        // ===========================
        [HttpPost("reject")]
        public async Task<IActionResult> Reject([FromBody] EmailRequest req)
        {
            try
            {
                var getRes = await _http.GetAsync($"http://localhost:5984/userdb/{req.Email}");

                if (!getRes.IsSuccessStatusCode)
                    return NotFound(new { message = "User not found" });

                var getData = await getRes.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(getData);
                var rev = doc.RootElement.GetProperty("_rev").GetString();

                var user = JsonSerializer.Deserialize<User>(getData);

                user.Status = "rejected";

                var json = JsonSerializer.Serialize(user);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                await _http.PutAsync(
                    $"http://localhost:5984/userdb/{req.Email}?rev={rev}",
                    content
                );

                return Ok(new { message = "User rejected" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Reject error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }
    }
}