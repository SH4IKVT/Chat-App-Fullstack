using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Microsoft.AspNetCore.Authorization;

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
        cmd.Parameters.AddWithValue("m", msg.Text);

        cmd.ExecuteNonQuery();

        return Ok(new { message = "Saved" });
    }
}