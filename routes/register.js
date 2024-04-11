const express = require("express");
const argon2 = require("argon2");
const User = require("../model/user");

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());
router.post("/register", async (req, res) => {
  const { username, email } = req.body;

  try {
    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    // Generate a secure password using UUIDv4
    const password = require("uuid").v4();

    // Hash the password using Argon2
    const passwordHash = await argon2.hash(password);

    // Save the user to the database
    const newUser = new User({
      username,
      email,
      passwordHash,
    });
    await newUser.save();

    // Return the generated password to the user
    res.status(201).json({ password });
  } catch (error) {
    // Handle errors
    console.error("Error registering user:", error.message);
    if (error.code === 11000 && error.keyValue.username) {
      // Duplicate key error for username
      res.status(400).json({ error: "Username already exists" });
    } else if (error.code === 11000 && error.keyValue.email) {
      // Duplicate key error for email
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

module.exports = router;
