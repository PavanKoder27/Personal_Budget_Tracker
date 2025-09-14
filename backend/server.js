const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budget');
const groupRoutes = require('./routes/groups');
const clerkOrJwt = require('./middleware/clerkOrJwt');
const goalRoutes = require('./routes/goals');
const insightsRoutes = require('./routes/insights');
const Transaction = require('./models/Transaction');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lightweight request logger (skip noisy health checks)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/health')) return; // skip default health
    const ms = Date.now() - start;
    console.log(`[REQ] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms}ms`);
  });
  next();
});

// DB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/budgettrackr';
console.log('[BOOT] Connecting to MongoDB:', mongoUri);
mongoose.connect(mongoUri) // modern mongoose ignores old options
  .then(() => console.log('[BOOT] Connected to MongoDB'))
  .catch(err => {
    console.error('[BOOT] MongoDB connection failed:', err.message);
  });

// Environment / feature summary (non-sensitive)
console.log('[BOOT] Mode Summary:', {
  clerk: !!process.env.CLERK_SECRET_KEY ? 'enabled' : 'disabled',
  mailer: (process.env.GMAIL_USER && process.env.GMAIL_PASS) ? 'gmail' : 'log-only',
  jwtSecretFallback: !process.env.JWT_SECRET,
});

// Health route (lightweight, no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Alternate health (sometimes front-end or proxies use /healthz)
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
});

// Routes
app.use('/api/auth', authRoutes);
// Protected resource routes (hybrid auth)
app.use('/api/transactions', clerkOrJwt, transactionRoutes);
app.use('/api/budgets', clerkOrJwt, budgetRoutes);
app.use('/api/groups', clerkOrJwt, groupRoutes);
app.use('/api/goals', clerkOrJwt, goalRoutes);
app.use('/api/insights', clerkOrJwt, insightsRoutes);

const DESIRED_PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function startServer(port, attemptedFallback=false){
  const srv = app.listen(port, HOST, () => {
    console.log(`[BOOT] Server listening on http://${HOST}:${port}`);
    // Post-start self-check
    const http = require('http');
    const opts = { hostname: 'localhost', port, path: '/health', method: 'GET', timeout: 3000 };
    const req = http.request(opts, resp => {
      let data = '';
      resp.on('data', c => data += c);
      resp.on('end', () => {
        console.log('[SELF-CHECK] /health status', resp.statusCode, 'body', data.slice(0,100));
      });
    });
    req.on('error', err => {
      console.error('[SELF-CHECK] FAILED to reach own /health:', err.message);
    });
    req.end();
    // Heartbeat
    setInterval(()=> console.log('[HEARTBEAT]', new Date().toISOString()), 30000).unref();
  });
  srv.on('error', (error) => {
    if(!attemptedFallback && (error.code === 'EADDRINUSE' || error.code === 'EACCES')){
      const fb = (port === 5000 ? 5050 : port+1);
      console.warn(`[SERVER] Port ${port} unavailable (${error.code}). Attempting fallback ${fb}`);
      return startServer(fb, true);
    }
    console.error('[SERVER] Error:', error);
  });
}

startServer(DESIRED_PORT);

// Recurring transaction materializer (simple interval loop)
async function materializeRecurring(){
  try {
    const now = new Date();
    // Find active templates due (limit batch size to avoid runaway)
    const due = await Transaction.find({ isTemplate: true, 'recurrence.active': true, 'recurrence.nextRunAt': { $lte: now } }).limit(50);
    for (const template of due) {
      // Create concrete transaction
      const doc = await Transaction.create({
        user: template.user,
        type: template.type,
        amount: template.amount,
        category: template.category,
        description: template.description,
        date: now,
        generatedFrom: template._id
      });
      // Compute nextRunAt
      let next = new Date(template.recurrence.nextRunAt || now);
      const freq = template.recurrence.frequency;
      const interval = template.recurrence.interval || 1;
      switch(freq){
        case 'daily': next.setDate(next.getDate() + interval); break;
        case 'weekly': next.setDate(next.getDate() + 7*interval); break;
        case 'monthly': next.setMonth(next.getMonth() + interval); break;
        case 'yearly': next.setFullYear(next.getFullYear() + interval); break;
        case 'custom': next.setDate(next.getDate() + interval); break; // treat interval as days
      }
      // Decrement occurrences if finite
      if (template.recurrence.occurrencesLeft != null) {
        template.recurrence.occurrencesLeft -= 1;
        if (template.recurrence.occurrencesLeft <= 0) {
          template.recurrence.active = false;
        }
      }
      if (template.recurrence.endDate && next > template.recurrence.endDate) {
        template.recurrence.active = false;
      }
      template.recurrence.nextRunAt = next;
      await template.save();
      console.log('[RECUR]', 'materialized', template._id.toString(), '->', doc._id.toString());
    }
  } catch (err) {
    console.error('[RECUR] Error materializing recurring transactions:', err.message);
  }
}

setInterval(materializeRecurring, 60 * 1000).unref(); // run each minute

process.on('unhandledRejection', (reason) => {
  console.error('[PROCESS] Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[PROCESS] Uncaught exception:', err);
});

// Central error handler (must be after routes)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERR] Unhandled middleware error:', err);
  if (res.headersSent) return; // let default handler finish
  res.status(500).json({ message: 'Server error', error: err.message || 'Unknown error' });
});
