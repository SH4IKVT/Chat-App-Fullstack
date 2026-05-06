using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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
    [Authorize]
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
        // SIGNUP
        // ===========================
        [AllowAnonymous]
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] User user)
        {
            try
            {
                var check = await _http.GetAsync($"http://localhost:5984/userdb/{user.Email}");

                if (check.IsSuccessStatusCode)
                    return BadRequest(new { message = "User already exists" });

                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                user.Role = "User";
                user.Status = "pending";
                user.SessionId = "";

                var json = JsonSerializer.Serialize(user);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _http.PutAsync(
                    $"http://localhost:5984/userdb/{user.Email}",
                    content
                );

                if (response.IsSuccessStatusCode)
                    return Ok(new { message = "Signup successful. Wait for admin approval." });

                return BadRequest(new { message = "Signup failed" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Signup error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // ===========================
        // LOGIN
        // ===========================
        [AllowAnonymous]
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

                    if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
                        return Unauthorized(new { message = "Invalid credentials" });

                    if (user.Status != "approved")
                        return BadRequest(new { message = "User not approved yet" });

                    var sessionId = Guid.NewGuid().ToString();
                    user.SessionId = sessionId;

                    var doc = JsonDocument.Parse(data);
                    var rev = doc.RootElement.GetProperty("_rev").GetString();

                    var updatedJson = JsonSerializer.Serialize(user);
                    var content = new StringContent(updatedJson, Encoding.UTF8, "application/json");

                    await _http.PutAsync(
                        $"http://localhost:5984/userdb/{user.Email}?rev={rev}",
                        content
                    );
                    //for json web token
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
                        sessionId,
                        role = user.Role,
                        name = user.FirstName + " " + user.LastName,
                        email = user.Email
                    });
                }

                // ADMIN LOGIN
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
                        sessionId,
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
        // 🔥 GET USER BY EMAIL (FIXED)
        // ===========================
        [HttpGet("user/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            try
            {
                var decodedEmail = Uri.UnescapeDataString(email);

                var response = await _http.GetAsync($"http://localhost:5984/userdb/{decodedEmail}");

                if (!response.IsSuccessStatusCode)
                    return NotFound(new { message = "User not found" });

                var data = await response.Content.ReadAsStringAsync();
                var user = JsonSerializer.Deserialize<User>(data);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new
                {
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    role = user.Role,
                    status = user.Status
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetUser error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }
        // ===========================t
        // APPROVE USER
        // ===========================
        [HttpPost("approve")]
        public async Task<IActionResult> Approve([FromBody] EmailRequest req)
        {
            try
            {
                var email = req.Email;

                var response = await _http.GetAsync($"http://localhost:5984/userdb/{email}");

                if (!response.IsSuccessStatusCode)
                    return NotFound(new { message = "User not found" });

                var json = await response.Content.ReadAsStringAsync();
                var user = JsonSerializer.Deserialize<User>(json);

                var doc = JsonDocument.Parse(json);
                var rev = doc.RootElement.GetProperty("_rev").GetString();

                user.Status = "approved";

                var updatedJson = JsonSerializer.Serialize(user);
                var content = new StringContent(updatedJson, Encoding.UTF8, "application/json");

                await _http.PutAsync(
                    $"http://localhost:5984/userdb/{email}?rev={rev}",
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
        // REJECT USER
        // ===========================
        [HttpPost("reject")]
        public async Task<IActionResult> Reject([FromBody] EmailRequest req)
        {
            try
            {
                var email = req.Email;

                var response = await _http.GetAsync($"http://localhost:5984/userdb/{email}");

                if (!response.IsSuccessStatusCode)
                    return NotFound(new { message = "User not found" });

                var json = await response.Content.ReadAsStringAsync();
                var user = JsonSerializer.Deserialize<User>(json);

                var doc = JsonDocument.Parse(json);
                var rev = doc.RootElement.GetProperty("_rev").GetString();

                user.Status = "rejected";

                var updatedJson = JsonSerializer.Serialize(user);
                var content = new StringContent(updatedJson, Encoding.UTF8, "application/json");

                await _http.PutAsync(
                    $"http://localhost:5984/userdb/{email}?rev={rev}",
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

        // ===========================
        // USERS
        // ===========================
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var role = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

                if (role == "Admin")
                    return await FetchAllUsers();

                return await FetchAllUsers();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Fetch error: " + ex.Message);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        private async Task<IActionResult> FetchAllUsers()
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
                        var u = JsonSerializer.Deserialize<User>(userDoc.ToString());

                        if (u != null)
                        {
                            usersList.Add(new
                            {
                                name = u.FirstName + " " + u.LastName,
                                email = u.Email,
                                role = u.Role,
                                status = u.Status
                            });
                        }
                    }
                }
            }

            return Ok(usersList);
        }
    }
}