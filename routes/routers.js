const express = require("express");
const argon2 = require("argon2");
const crypto = require("crypto");
const uuid = require("uuid");
const db = require("../connectMysql"); // Assuming you have a database connection module

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

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
function encrypt(text, key) {
  key = ensureKeyLength(Buffer.from(key, "hex").toString("hex"));
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
function decrypt(text, key, iv) {
  try {
    key = ensureKeyLength(Buffer.from(key, "hex").toString("hex"));
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key,
      Buffer.from(iv, "hex")
    );
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw new Error("Decryption error");
  }
}

// Endpoint for user registration
router.post("/register", async (req, res) => {
  const { username, email } = req.body;

  try {
    // Check if the username or email already exists
    const existingUserQuery = `
      SELECT * FROM users
      WHERE username = ? OR email = ?
    `;
    const existingUser = await db.query(existingUserQuery, [username, email]);

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    // Generate a secure password using UUIDv4
    const password = uuid.v4();

    // Hash the password using Argon2
    const passwordHash = await argon2.hash(password);

    // Save the user to the database
    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;
    await db.query(insertUserQuery, [username, email, passwordHash]);

    // Return the generated password to the user
    res.status(201).json({ password });
  } catch (error) {
    // Handle errors
    console.error("Error registering user:", error.message);
    if (error.code === "ER_DUP_ENTRY") {
      // Duplicate key error
      if (error.sqlMessage.includes("username")) {
        res.status(400).json({ error: "Username already exists" });
      } else if (error.sqlMessage.includes("email")) {
        res.status(400).json({ error: "Email already exists" });
      }
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Endpoint for user authentication
router.post("/auth", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the database to find the user by username
    const getUserQuery = `
      SELECT * FROM users
      WHERE username = ?
    `;
    const [user] = await db.query(getUserQuery, [username]);

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
