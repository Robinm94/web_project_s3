const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Generate unique API Key
    let apiKey;
    do {
      apiKey = require('crypto').randomBytes(16).toString('hex');
    } while (await User.findOne({ apiKey }));

    // Create a new user (password will be hashed in pre-save hook)
    const newUser = new User({
      username,
      password,
      apiKey,
    });

    await newUser.save();
    console.log('New user created:', newUser);

    res.status(201).json({ message: 'User registered successfully', apiKey });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login request received:", username, password);

    // Fetch the user by username
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    console.log("Database record found:", user);

    // Validate password using bcrypt.compare
    try {
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        console.log("Password mismatch");
        return res.status(400).json({ error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error("Error during password comparison:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    console.log("Passwords match, generating JWT.");

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
