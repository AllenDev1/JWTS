const express = require("express");
const argon2 = require("argon2");
const crypto = require("crypto");
const db = require("../connectMysql"); // Assuming you have a database connection module

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
  const { username, password } = req.body;

  try {
    // Query the database to find the user by username
    const getUserQuery = `
        SELECT * FROM users
        WHERE username = ?
      `;
    const result = await db.query(getUserQuery, [username]);
    console.log("Query result:", result);

    // Extract the user from the result
    const user = result[0];

    // If user doesn't exist, return authentication failure
    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Verify the password using Argon2
    const validPassword = await argon2.verify(user.password_hash, password);

    // If password is invalid, return authentication failure
    if (!validPassword) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Log the authentication request
    const insertAuthLogQuery = `
        INSERT INTO auth_logs (request_ip, user_id)
        VALUES (?, ?)
      `;
    await db.query(insertAuthLogQuery, [req.ip, user.id]);

    // Authentication successful
    res.status(200).json({ message: "Authentication successful" });
  } catch (error) {
    // Handle errors
    console.error("Error authenticating user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
