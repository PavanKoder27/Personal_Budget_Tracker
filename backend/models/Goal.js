const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  category: { type: String },
  deadline: { type: Date },
  autoAllocate: { type: Boolean, default: false }, // future enhancement
  notes: { type: String, trim: true }
}, { timestamps: true });

goalSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Goal', goalSchema);
