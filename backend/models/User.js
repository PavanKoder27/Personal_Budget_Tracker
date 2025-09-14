const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  clerkId: {
    type: String,
    index: true,
    unique: true,
    sparse: true // allow null for legacy users without Clerk
  },
  otpHash: {
    type: String,
    select: false
  },
  otpExpiresAt: {
    type: Date,
    select: false
  },
  lastOtpSentAt: {
    type: Date,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  otpAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  profilePicture: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
