using System.Security.Cryptography;
using System.Text;

public class RsaService
{
    private static readonly RSA rsa = RSA.Create(2048);

    public static string Encrypt(string text)
    {
        var data = Encoding.UTF8.GetBytes(text);
        var encrypted = rsa.Encrypt(data, RSAEncryptionPadding.Pkcs1);
        return Convert.ToBase64String(encrypted);
    }

    public static string Decrypt(string cipher)
    {
        try
        {
            var data = Convert.FromBase64String(cipher);
            var decrypted = rsa.Decrypt(data, RSAEncryptionPadding.Pkcs1);
            return Encoding.UTF8.GetString(decrypted);
        }
        catch
        {
            return cipher; // 🔥 fallback (important for old messages)
        }
    }
}