const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Add bcrypt directly for in-memory users
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Helper function to compare password
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (global.mongoConnected) {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create new user
      user = new User({
        email,
        password
      });

      // Save user to database
      await user.save();

      // Create JWT payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } else {
      // In-memory user registration
      // Check if user already exists
      const existingUser = global.inMemoryUsers.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const userId = Date.now().toString(); // Simple ID generation
      const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };

      // Save user to in-memory storage
      global.inMemoryUsers.push(newUser);

      // Create JWT payload
      const payload = {
        user: {
          id: userId
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (global.mongoConnected) {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Create JWT payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } else {
      // In-memory user login
      // Check if user exists
      const user = global.inMemoryUsers.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Create JWT payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    if (global.mongoConnected) {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } else {
      // In-memory user data
      const user = global.inMemoryUsers.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 