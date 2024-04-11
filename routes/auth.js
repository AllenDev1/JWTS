const express = require("express");
const argon2 = require("argon2");
const crypto = require("crypto");
const AuthLog = require("../model/authLog");


const router = express.Router();

// Encryption and Decryption Functions
const NOT_MY_KEY = process.env.NOT_MY_KEY; // Use a stable encryption key

// Function to ensure key length is correct
function ensureKeyLength(key) {
  // If the key length is less than 32 bytes, pad it with zeros
  while (key.length < 32) {
    key += "\0";
  }
  // If the key length is greater than 32 bytes, truncate it
  if (key.length > 32) {
    key = key.slice(0, 32);
  }
  return key;
}

// Encryption function
function encrypt(text) {
  const key = ensureKeyLength(Buffer.from(NOT_MY_KEY, "hex").toString("hex"));
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    key,
    crypto.randomBytes(16)
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Decryption function
// Decryption function
function decrypt(text) {
    try {
      const key = ensureKeyLength(Buffer.from(NOT_MY_KEY, "hex").toString("hex"));
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        key,
        crypto.randomBytes(16)
      );
      let decrypted = decipher.update(text, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Error decrypting data:", error);
      throw new Error("Decryption error");
    }
  }
  

// Middleware to parse JSON bodies
router.use(express.json());
router.post("/auth", async (req, res) => {
    const { requestIP, userID, privateKeyToEncrypt } = req.body; // Assuming privateKeyToEncrypt is the data you want to encrypt
  
    try {
      // Encrypt private key
      const encryptedPrivateKey = encrypt(privateKeyToEncrypt); // Pass the data to encrypt
  
      // Decrypt encrypted private key
      const decryptedPrivateKey = decrypt(encryptedPrivateKey);
  
      // Log the authentication request
      const authLog = new AuthLog({
        requestIP,
        userID,
        encryptedPrivateKey,
        decryptedPrivateKey,
      });
      await authLog.save();
  
      res.status(200).send("Authentication successful");
    } catch (error) {
      console.error("Error logging authentication request:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

module.exports = router;

