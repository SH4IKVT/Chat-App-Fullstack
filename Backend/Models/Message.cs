public class Message
{
    public int Id { get; set; }
    public required string SenderEmail { get; set; }
    public required string ReceiverEmail { get; set; }
    public required string Text { get; set; }
    public DateTime CreatedAt { get; set; }
}