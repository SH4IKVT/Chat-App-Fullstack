using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using ChatApplication.Models;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly string conn =
        "Host=localhost;Port=5432;Username=postgres;Password=1234;Database=chatdb";

    private readonly IHubContext<ChatHub> _hub;

    private readonly HttpClient _http;

    public MessageController(
        IHubContext<ChatHub> hub
    )
    {
        _hub = hub;

        _http = new HttpClient();

        var byteArray =
            System.Text.Encoding.ASCII.GetBytes(
                "admin:admin123"
            );

        _http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers
            .AuthenticationHeaderValue(
                "Basic",
                Convert.ToBase64String(byteArray)
            );
    }

    // ===========================
    // VALIDATE TAB ACCESS
    // ===========================
    private async Task<bool>
    ValidateTabAccess()
    {
        try
        {
            var email =
                User.Identity?.Name;

            // ✅ ADMIN ALLOWED
            if (
                string.IsNullOrEmpty(email)
                ||
                email == "admin@gmail.com"
            )
            {
                return true;
            }

            var currentTabId =
                Request.Headers["X-Tab-Id"]
                .ToString();

            var response =
                await _http.GetAsync(
                    $"http://localhost:5984/userdb/{email}"
                );

            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            var data =
                await response.Content
                .ReadAsStringAsync();

            var user =
                JsonSerializer.Deserialize<User>(
                    data
                );

            if (user == null)
            {
                return false;
            }

            return
                user.ActiveTabId ==
                currentTabId;
        }
        catch
        {
            return false;
        }
    }

    // ===========================
    // SEND MESSAGE
    // ===========================
    [HttpPost("send")]
    public async Task<IActionResult>
    Send([FromBody] Message msg)
    {
        // ✅ BLOCK COPIED TAB
        if (!await ValidateTabAccess())
        {
            return Unauthorized(new
            {
                message =
                "Session already active in another tab"
            });
        }

        using var con =
            new NpgsqlConnection(conn);

        con.Open();

        var query = @"
        INSERT INTO messages
        (
            sender_email,
            receiver_email,
            message
        )
        VALUES (@s, @r, @m)";

        using var cmd =
            new NpgsqlCommand(query, con);

        cmd.Parameters.AddWithValue(
            "s",
            msg.SenderEmail
        );

        cmd.Parameters.AddWithValue(
            "r",
            msg.ReceiverEmail
        );

        var encryptedMsg =
            RsaService.Encrypt(msg.Text);

        cmd.Parameters.AddWithValue(
            "m",
            encryptedMsg
        );

        cmd.ExecuteNonQuery();

        // ✅ SIGNALR REALTIME
        await _hub.Clients.All.SendAsync(
            "ReceiveMessage",
            new
            {
                senderEmail =
                    msg.SenderEmail,

                receiverEmail =
                    msg.ReceiverEmail,

                text =
                    msg.Text,

                createdAt =
                    DateTime.Now
            }
        );

        return Ok(new
        {
            message = "Saved"
        });
    }

    // ===========================
    // ALL MESSAGES
    // ===========================
    [HttpGet("all")]
    public async Task<IActionResult>
    GetAllMessages()
    {
        // ✅ BLOCK COPIED TAB
        if (!await ValidateTabAccess())
        {
            return Unauthorized(new
            {
                message =
                "Session already active in another tab"
            });
        }

        using var con =
            new NpgsqlConnection(conn);

        con.Open();

        var query =
            "SELECT * FROM messages ORDER BY created_at DESC";

        using var cmd =
            new NpgsqlCommand(query, con);

        using var reader =
            cmd.ExecuteReader();

        var list =
            new List<object>();

        while (reader.Read())
        {
            list.Add(new
            {
                id =
                    reader.GetInt32(0),

                senderEmail =
                    reader.GetString(1),

                receiverEmail =
                    reader.GetString(2),

                text =
                    RsaService.Decrypt(
                        reader.GetString(3)
                    ),

                createdAt =
                    reader.GetDateTime(4)
            });
        }

        return Ok(list);
    }

    // ===========================
    // CHAT BETWEEN USERS
    // ===========================
    [HttpGet("{u1}/{u2}")]
    public async Task<IActionResult>
    GetMessages(
        string u1,
        string u2
    )
    {
        // ✅ BLOCK COPIED TAB
        if (!await ValidateTabAccess())
        {
            return Unauthorized(new
            {
                message =
                "Session already active in another tab"
            });
        }

        u1 =
            Uri.UnescapeDataString(u1);

        u2 =
            Uri.UnescapeDataString(u2);

        using var con =
            new NpgsqlConnection(conn);

        con.Open();

        string query;

        // ✅ BROADCAST
        if (u2.ToLower() == "all")
        {
            query = @"
            SELECT * FROM messages
            WHERE receiver_email = 'ALL'
            ORDER BY created_at ASC";
        }
        else
        {
            // ✅ NORMAL CHAT
            query = @"
            SELECT * FROM messages
            WHERE
                (
                    sender_email = @u1
                    AND
                    receiver_email = @u2
                )
                OR
                (
                    sender_email = @u2
                    AND
                    receiver_email = @u1
                )
            ORDER BY created_at ASC";
        }

        using var cmd =
            new NpgsqlCommand(query, con);

        if (u2.ToLower() != "all")
        {
            cmd.Parameters.AddWithValue(
                "u1",
                u1
            );

            cmd.Parameters.AddWithValue(
                "u2",
                u2
            );
        }

        using var reader =
            cmd.ExecuteReader();

        var list =
            new List<object>();

        while (reader.Read())
        {
            list.Add(new
            {
                id =
                    reader.GetInt32(0),

                senderEmail =
                    reader.GetString(1),

                receiverEmail =
                    reader.GetString(2),

                text =
                    RsaService.Decrypt(
                        reader.GetString(3)
                    ),

                createdAt =
                    reader.GetDateTime(4)
            });
        }

        return Ok(list);
    }
}