const mongoose = require('mongoose');

// Rolling stats per (user, category, type) for anomaly detection using Welford algorithm
const statsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['income','expense'], required: true },
  count: { type: Number, default: 0 },
  mean: { type: Number, default: 0 },
  M2: { type: Number, default: 0 }, // sum of squares of differences from mean
  lastAmount: { type: Number },
  updatedAt: { type: Date, default: Date.now }
});

statsSchema.index({ user: 1, category: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Stats', statsSchema);
