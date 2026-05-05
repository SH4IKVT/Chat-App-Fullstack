using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly string conn =
        "Host=localhost;Port=5432;Username=postgres;Password=1234;Database=chatdb";

    [HttpPost("send")]
    public IActionResult Send([FromBody] Message msg)
    {
        using var con = new NpgsqlConnection(conn);
        con.Open();

        var query = @"INSERT INTO messages (sender_email, receiver_email, message)
                    VALUES (@s, @r, @m)";

        using var cmd = new NpgsqlCommand(query, con);
        cmd.Parameters.AddWithValue("s", msg.SenderEmail);
        cmd.Parameters.AddWithValue("r", msg.ReceiverEmail);

        var encryptedMsg = RsaService.Encrypt(msg.Text);
        cmd.Parameters.AddWithValue("m", encryptedMsg);

        cmd.ExecuteNonQuery();

        return Ok(new { message = "Saved" });
    }

    [AllowAnonymous]
    [HttpGet("all")]
    public IActionResult GetAllMessages()
    {
        using var con = new NpgsqlConnection(conn);
        con.Open();

        var query = "SELECT * FROM messages ORDER BY created_at DESC";

        using var cmd = new NpgsqlCommand(query, con);
        using var reader = cmd.ExecuteReader();

        var list = new List<object>();

        while (reader.Read())
        {
            list.Add(new
            {
                id = reader.GetInt32(0),
                senderEmail = reader.GetString(1),
                receiverEmail = reader.GetString(2),
                text = RsaService.Decrypt(reader.GetString(3)),
                createdAt = reader.GetDateTime(4)
            });
        }
        return Ok(list);
    }

    [HttpGet("{u1}/{u2}")]
    public IActionResult GetMessages(string u1, string u2)
    {
        u1 = Uri.UnescapeDataString(u1);
        u2 = Uri.UnescapeDataString(u2);

        using var con = new NpgsqlConnection(conn);
        con.Open();

        string query;

        // ✅ CASE 1: Broadcast chat
        if (u2.ToLower() == "all")
        {
            query = @"
            SELECT * FROM messages
            WHERE receiver_email = 'ALL'
            ORDER BY created_at ASC";
        }
        else
        {
            // ✅ CASE 2: Normal 1-to-1 chat ONLY
            query = @"
            SELECT * FROM messages
            WHERE 
                (sender_email = @u1 AND receiver_email = @u2)
                OR
                (sender_email = @u2 AND receiver_email = @u1)
            ORDER BY created_at ASC";
        }

        using var cmd = new NpgsqlCommand(query, con);

        if (u2.ToLower() != "all")
        {
            cmd.Parameters.AddWithValue("u1", u1);
            cmd.Parameters.AddWithValue("u2", u2);
        }

        using var reader = cmd.ExecuteReader();

        var list = new List<object>();

        while (reader.Read())
        {
            list.Add(new
            {
                id = reader.GetInt32(0),
                senderEmail = reader.GetString(1),
                receiverEmail = reader.GetString(2),
                text = RsaService.Decrypt(reader.GetString(3)),
                createdAt = reader.GetDateTime(4)
            });
        }

        return Ok(list);
    }
}