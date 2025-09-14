const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  recurrence: {
    active: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily','weekly','monthly','yearly','custom'], default: 'monthly' },
    interval: { type: Number, default: 1 }, // every N frequency units
    // for monthly/yearly we reuse date's day-of-month; for weekly we use day-of-week of original date
    nextRunAt: { type: Date },
    occurrencesLeft: { type: Number }, // null = infinite
    endDate: { type: Date }
  },
  isTemplate: { type: Boolean, default: false }, // template rows that generate concrete transactions
  generatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }, // link back to template
  anomaly: {
    isAnomaly: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    reason: { type: String }
  }
}, {
  timestamps: true
});

transactionSchema.index({ 'recurrence.nextRunAt': 1, user: 1 }, { sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
