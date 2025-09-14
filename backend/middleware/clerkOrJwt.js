const { clerkClient, verifyToken } = require('@clerk/clerk-sdk-node');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Hybrid auth middleware:
 * 1. If Authorization Bearer token is a Clerk token, verify via Clerk and map/create local user.
 * 2. Else fallback to legacy JWT verification.
 * 3. Attaches req.user (mongoose document) + req.authSource ('clerk' | 'jwt').
 */
module.exports = async function clerkOrJwt(req, res, next) {
  try {
    const header = req.header('Authorization');
    if (!header) return res.status(401).json({ message: 'No token provided' });
    const token = header.replace('Bearer ', '').trim();

    // Heuristic: Clerk session/jwt tokens often start with 'ey' (jwt) but include 'sess_' for session tokens when using frontend helpers.
    // We attempt Clerk verification first, catching errors and falling back.
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (secretKey) {
      try {
        const verified = await verifyToken(token, { secretKey });
        if (verified) {
          // verified.sub is the Clerk user ID
          const clerkUserId = verified.sub;
          let user = await User.findOne({ clerkId: clerkUserId });
          if (!user) {
            // Try linking by email
            let primaryEmail = verified.email || (verified.email_addresses && verified.email_addresses[0]);
            if (primaryEmail) {
              user = await User.findOne({ email: primaryEmail.toLowerCase() });
            }
            if (!user) {
              // create minimal user (password placeholder)
              user = await User.create({
                name: verified.first_name && verified.last_name ? `${verified.first_name} ${verified.last_name}`.trim() : (verified.first_name || verified.last_name || 'User'),
                email: (primaryEmail || `user-${clerkUserId}@placeholder.local`).toLowerCase(),
                password: jwt.sign({ r: Math.random() }, process.env.JWT_SECRET || 'fallback-secret').slice(0, 12), // random placeholder
                clerkId: clerkUserId,
                profilePicture: verified.image_url || ''
              });
            } else if (!user.clerkId) {
              user.clerkId = clerkUserId;
              await user.save();
            }
          }
          req.user = user;
          req.authSource = 'clerk';
          return next();
        }
      } catch (clerkErr) {
        // If it's a clerk-related token error, we just fall back to legacy JWT verification
        // console.debug('[AUTH] Clerk verify failed, falling back:', clerkErr.message);
      }
    }

    // Legacy JWT fallback
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'Token invalid' });
      req.user = user;
      req.authSource = 'jwt';
      return next();
    } catch (jwtErr) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Auth middleware error', error: err.message });
  }
};
