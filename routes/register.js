const express = require("express");
const argon2 = require("argon2");
const uuid = require("uuid");
const db = require("../connectMysql"); // Assuming you have a database connection module

const router = express.Router();

router.use(express.json());

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

    // Log the registration
    const insertRegistrationLogQuery = `
        INSERT INTO registration_logs (username, email, registration_timestamp)
        VALUES (?, ?, ?)
      `;
    await db.query(insertRegistrationLogQuery, [username, email, new Date()]);

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

module.exports = router;
