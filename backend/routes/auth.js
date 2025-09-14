const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

// Register (OTP verification required before login)
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

    // Create user (unverified initially)
    const user = new User({ name, email, password, isVerified: false });
    await user.save();

    // Generate OTP for email verification
    const code = ('' + Math.floor(100000 + Math.random()*900000));
    user.otpHash = await bcrypt.hash(code, 10);
    user.otpExpiresAt = new Date(Date.now() + 10*60*1000); // 10 minutes for initial verify
    user.lastOtpSentAt = new Date();
    await user.save();
    try { await sendOtpEmail(email, code); } catch(mailErr){ console.warn('[REGISTER][OTP EMAIL] send failed:', mailErr.message); }

    res.status(201).json({
      message: 'Registration successful. Please verify the OTP sent to your email to activate your account.',
      needsVerification: true,
      userId: user._id
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
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(423).json({ message: 'Account not verified. Please complete OTP verification.' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

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

// OTP Endpoints (appended for clarity)
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if(!email) return res.status(400).json({ message: 'Email required' });
    if(!/@gmail\.com$/i.test(email)) return res.status(400).json({ message: 'Only Gmail addresses supported for OTP login currently' });
    let user = await User.findOne({ email }).select('+otpHash +otpExpiresAt +lastOtpSentAt');
    if(!user) {
      // Auto-provision lightweight account with random password (can later set real password)
      user = new User({ name: email.split('@')[0], email, password: Math.random().toString(36).slice(2,10) });
    }
    const now = new Date();
    if(user.lastOtpSentAt && (now - user.lastOtpSentAt) < 60*1000) {
      const secs = 60 - Math.floor((now - user.lastOtpSentAt)/1000);
      return res.status(429).json({ message: `OTP already sent. Try again in ${secs}s` });
    }
    const code = ('' + Math.floor(100000 + Math.random()*900000));
    user.otpHash = await bcrypt.hash(code, 10);
    user.otpExpiresAt = new Date(Date.now() + 5*60*1000); // 5 minutes
    user.lastOtpSentAt = now;
    await user.save();
    await sendOtpEmail(email, code);
    return res.json({ message: 'OTP sent' });
  } catch(err){
    console.error('[REQUEST OTP] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if(!email || !code) return res.status(400).json({ message: 'Email and code required' });
    const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt');
    if(!user || !user.otpHash || !user.otpExpiresAt) return res.status(400).json({ message: 'Invalid or expired code' });
    if(user.otpExpiresAt < new Date()) return res.status(400).json({ message: 'Code expired' });
    const ok = await bcrypt.compare(code, user.otpHash);
    if(!ok) return res.status(400).json({ message: 'Invalid or expired code' });
    // Invalidate OTP after use
    user.otpHash = undefined; user.otpExpiresAt = undefined; await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture || '' } });
  } catch(err){
    console.error('[LOGIN OTP] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify registration OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if(!userId || !code) return res.status(400).json({ message: 'userId and code required' });
    const user = await User.findById(userId).select('+otpHash +otpExpiresAt +otpAttempts');
    if(!user) return res.status(404).json({ message: 'User not found' });
    if(user.isVerified) return res.json({ message: 'Already verified', verified: true });
    if(!user.otpHash || !user.otpExpiresAt) return res.status(400).json({ message: 'No active OTP. Please request a new one.' });
    if(user.otpExpiresAt < new Date()) return res.status(400).json({ message: 'OTP expired. Request a new code.' });
    if(user.otpAttempts >= 5) return res.status(429).json({ message: 'Too many attempts. Request a new code.' });

    const ok = await bcrypt.compare(code, user.otpHash);
    user.otpAttempts += 1;
    if(!ok) {
      await user.save();
      return res.status(400).json({ message: 'Invalid code' });
    }
    // Success
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    return res.json({ message: 'Account verified', verified: true, token, user: { id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture || '' } });
  } catch(err) {
    console.error('[VERIFY OTP] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend registration OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    if(!userId) return res.status(400).json({ message: 'userId required' });
    const user = await User.findById(userId).select('+otpHash +otpExpiresAt');
    if(!user) return res.status(404).json({ message: 'User not found' });
    if(user.isVerified) return res.status(400).json({ message: 'Already verified' });
    const now = new Date();
    if(user.lastOtpSentAt && (now - user.lastOtpSentAt) < 60*1000) {
      const secs = 60 - Math.floor((now - user.lastOtpSentAt)/1000);
      return res.status(429).json({ message: `Please wait ${secs}s before requesting another code.` });
    }
    const code = ('' + Math.floor(100000 + Math.random()*900000));
    user.otpHash = await bcrypt.hash(code, 10);
    user.otpExpiresAt = new Date(Date.now() + 10*60*1000);
    user.lastOtpSentAt = now;
    user.otpAttempts = 0;
    await user.save();
    try { await sendOtpEmail(user.email, code); } catch(mailErr){ console.warn('[RESEND OTP] email failed:', mailErr.message); }
    return res.json({ message: 'New OTP sent' });
  } catch(err) {
    console.error('[RESEND OTP] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});
