using Microsoft.AspNetCore.Mvc;
using ChatApplication.Models;
using System.Text;
using System.Text.Json;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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

                // 🔥 USER LOGIN
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

                    // 🔥 GENERATE SESSION ID
                    var sessionId = Guid.NewGuid().ToString();
                    user.SessionId = sessionId;

                    // 🔥 GET _rev
                    var doc = JsonDocument.Parse(data);
                    var rev = doc.RootElement.GetProperty("_rev").GetString();

                    // 🔥 UPDATE USER IN COUCHDB
                    var updatedJson = JsonSerializer.Serialize(user);
                    var content = new StringContent(updatedJson, Encoding.UTF8, "application/json");

                    await _http.PutAsync(
                        $"http://localhost:5984/userdb/{user.Email}?rev={rev}",
                        content
                    );

                    // 🔥 JWT GENERATION
                    var key = "THIS_IS_MY_SUPER_SECRET_KEY_12345";

                    var claims = new[]
                    {
                        new Claim(ClaimTypes.Name, user.Email),
                        new Claim(ClaimTypes.Role, user.Role)
                    };

                    var token = new JwtSecurityToken(
                        claims: claims,
                        expires: DateTime.Now.AddHours(2),
                        signingCredentials: new SigningCredentials(
                            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                            SecurityAlgorithms.HmacSha256
                        )
                    );

                    var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

                    return Ok(new
                    {
                        token = tokenString,
                        sessionId = sessionId,   // 🔥 IMPORTANT
                        role = user.Role,
                        name = user.FirstName + " " + user.LastName,
                        email = user.Email
                    });
                }

                // 🔥 ADMIN LOGIN
                if (req.Email == "admin@gmail.com" && req.Password == "123")
                {
                    var sessionId = Guid.NewGuid().ToString();

                    var key = "THIS_IS_MY_SUPER_SECRET_KEY_12345";

                    var claims = new[]
                    {
                        new Claim(ClaimTypes.Name, "admin@gmail.com"),
                        new Claim(ClaimTypes.Role, "Admin")
                    };

                    var token = new JwtSecurityToken(
                        claims: claims,
                        expires: DateTime.Now.AddHours(2),
                        signingCredentials: new SigningCredentials(
                            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                            SecurityAlgorithms.HmacSha256
                        )
                    );

                    var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

                    return Ok(new
                    {
                        token = tokenString,
                        sessionId = sessionId,
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