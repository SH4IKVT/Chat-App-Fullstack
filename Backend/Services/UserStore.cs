using ChatApplication.Models;

namespace ChatApplication.Services
{
    public static class UserStore
    {
        public static List<User> Users = new List<User>()
        {
            new User
            {
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@gmail.com",
                Password = "123",
                Role = "Admin",
                Status = "approved"
            }
        };
    }
}