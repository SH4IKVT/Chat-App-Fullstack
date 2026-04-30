namespace ChatApplication.Models
{
    public class User
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string Role { get; set; } = "User";
        public string Status { get; set; } = "pending";

        public DateTime CreatedAt { get; set; }

        // 🔥 NEW FIELD
        public string SessionId { get; set; } = "";
    }
}
