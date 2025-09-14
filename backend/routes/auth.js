const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Register (immediate activation, returns JWT)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('[REGISTER] payload:', { name, email });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        details: 'Name, email, and password are required',
        missingFields: {
          name: !name,
          email: !email,
          password: !password
        }
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Invalid name', 
        details: 'Name must be at least 2 characters long' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Invalid password', 
        details: 'Password must be at least 6 characters long' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format', 
        details: 'Please enter a valid email address' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists', 
        details: `An account with email ${email} already exists. Please try logging in instead.`,
        suggestionAction: 'login'
      });
    }

    const user = new User({ name, email, password });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture || '' }
    });
  } catch (error) {
    console.error('[REGISTER] error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        details: validationErrors.join(', '),
        validationErrors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'User already exists', 
        details: 'An account with this email already exists',
        suggestionAction: 'login'
      });
    }

    res.status(500).json({ 
      message: 'Server error', 
      details: 'Something went wrong on our end. Please try again later.',
      error: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  const start = Date.now();
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password', details: { email: !email, password: !password } });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.warn('[LOGIN] user not found', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn('[LOGIN] password mismatch', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    const duration = Date.now() - start;
    console.log('[LOGIN] success', { email, ms: duration });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || ''
      }
    });
  } catch (error) {
    console.error('[LOGIN] error', { error: error.message });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profilePicture || ''
    }
  });
});

// Update profile (name/email/profilePicture)
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body;
    const len = profilePicture ? profilePicture.length : 0;
    console.log('[UPDATE PROFILE] payload:', { name, email, profilePicture: profilePicture ? `len=${len}` : 'no data' });

    // Basic server-side validation for base64 image string (data URI) if provided
    if (profilePicture) {
      // Accept data URLs: data:<mime>;base64,<data>
      const match = /^data:(.+);base64,(.*)$/.exec(profilePicture);
      if (!match) {
        console.warn('[UPDATE PROFILE] image reject: not data URI');
        return res.status(400).json({ message: 'Invalid image format. Expecting base64 data URI.' });
      }
      const mimeOriginal = match[1];
      const mime = mimeOriginal.toLowerCase();
      const base64Data = match[2];
      // Include common legacy/alternative MIME variants
      const allowed = [
        'image/png',
        'image/x-png', // some browsers still emit this
        'image/jpeg',
        'image/jpg',
        'image/pjpeg', // progressive jpeg
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml'
      ];
      if (!allowed.includes(mime)) {
        console.warn('[UPDATE PROFILE] image reject: mime not allowed', { mimeOriginal });
        return res.status(400).json({ message: 'Unsupported image type. Use PNG, JPEG, GIF, WebP, BMP, or SVG.' });
      }
      // Approximate size in bytes
      const approxBytes = Math.ceil(base64Data.length * 0.75);
      const MAX = 10 * 1024 * 1024; // 10MB
      if (approxBytes > MAX) {
        console.warn('[UPDATE PROFILE] image reject: too large', { approxBytes });
        return res.status(400).json({ message: 'Image exceeds 10MB limit.' });
      }
      console.log('[UPDATE PROFILE] image accepted', { mimeOriginal, approxKB: Math.round(approxBytes/1024) });
    }

    // Check if email is changing and if it's already taken
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (name) req.user.name = name;
    if (email) req.user.email = email;
    if (profilePicture !== undefined) {
      req.user.profilePicture = profilePicture;
    }

    await req.user.save();
    console.log('[UPDATE PROFILE] success:', { id: req.user._id, name: req.user.name, email: req.user.email });

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture
      }
    });
  } catch (error) {
    console.error('[UPDATE PROFILE] error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' });
    }

    const isMatch = await req.user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get existing user profiles (for suggestions)
router.get('/profiles', async (req, res) => {
  try {
    const users = await User.find({}, 'name email').limit(10).lean();
    const profiles = users.map(user => ({
      name: user.name,
      email: user.email
    }));
    res.json({ profiles });
  } catch (error) {
    console.error('[PROFILES] error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

