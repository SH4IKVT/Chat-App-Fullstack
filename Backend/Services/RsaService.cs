using System.Security.Cryptography;
using System.Text;
using System.IO;

public class RsaService
{
    private static readonly RSA rsa = RSA.Create();
    private static readonly string keyPath = Path.Combine(Directory.GetCurrentDirectory(), "rsa_private_key.xml");

    static RsaService()
    {
        if (File.Exists(keyPath))
        {
            // Load the existing key
            var xmlKey = File.ReadAllText(keyPath);
            rsa.FromXmlString(xmlKey);
        }
        else
        {
            // Generate a new key pair and save it
            rsa.KeySize = 2048;
            var xmlKey = rsa.ToXmlString(true);
            File.WriteAllText(keyPath, xmlKey);
        }
    }

    public static string Encrypt(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        try
        {
            var data = Encoding.UTF8.GetBytes(text);
            var encrypted = rsa.Encrypt(data, RSAEncryptionPadding.Pkcs1);
            return Convert.ToBase64String(encrypted);
        }
        catch
        {
            return text;
        }
    }

    public static string Decrypt(string cipher)
    {
        if (string.IsNullOrEmpty(cipher)) return cipher;
        try
        {
            var data = Convert.FromBase64String(cipher);
            var decrypted = rsa.Decrypt(data, RSAEncryptionPadding.Pkcs1);
            return Encoding.UTF8.GetString(decrypted);
        }
        catch
        {
            // Return raw cipher if decryption fails (helpful for legacy plain text messages)
            return cipher;
        }
    }
}