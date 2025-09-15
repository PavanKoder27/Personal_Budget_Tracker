const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Simple in-memory rate limiter (auth endpoints) to avoid brute force.
// For production scale, replace with Redis-based limiter.
const rateWindows = new Map(); // key=ip, value { count, reset }
function rateLimit({ windowMs=15*60*1000, max=100 }={}){
  return (req,res,next)=>{
    const now = Date.now();
    let rec = rateWindows.get(req.ip);
    if(!rec || rec.reset < now){
      rec = { count:0, reset: now + windowMs };
      rateWindows.set(req.ip, rec);
    }
    rec.count++;
    if(rec.count > max){
      const retrySec = Math.ceil((rec.reset - now)/1000);
      res.set('Retry-After', retrySec.toString());
      return res.status(429).json({ message:'Too many requests', retryAfterSeconds: retrySec });
    }
    next();
  };
}
require('dotenv').config();
// Early environment validation (non-fatal outside production)
try {
  const { validateEnv } = require('./utils/envCheck');
  const envResult = validateEnv();
  console.log('[BOOT] Env validation summary:', envResult.report);
  if (!envResult.ok) {
    console.error('[BOOT] Exiting due to failed env validation in production');
    process.exit(1);
  }
} catch (e) {
  console.warn('[BOOT] Env validation skipped:', e.message);
}

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budget');
const groupRoutes = require('./routes/groups');
const auth = require('./middleware/auth');
const goalRoutes = require('./routes/goals');
const insightsRoutes = require('./routes/insights');
const Transaction = require('./models/Transaction');

const app = express();

// CORS (restrict if CORS_ORIGINS set, else allow all for dev)
const rawCors = (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
const allowedOrigins = new Set(rawCors);
app.use(cors({
  origin: (origin, cb) => {
    if(!origin) return cb(null, true); // non-browser or same-origin
    if(allowedOrigins.size === 0 || allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  credentials: true
}));
if(allowedOrigins.size){
  console.log('[BOOT] CORS restricted to:', [...allowedOrigins]);
} else {
  console.warn('[BOOT] CORS unrestricted (no CORS_ORIGINS set)');
}

// Apply rate limiter only to auth endpoints
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 100 }));
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
// Database-specific health
app.get('/health/db', async (req,res)=>{
  const state = mongoose.connection.readyState; // 1 connected
  const states = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  res.json({ dbState: states[state] || 'unknown', code: state });
});

// Routes
app.use('/api/auth', authRoutes);
// Protected resource routes (JWT auth)
app.use('/api/transactions', auth, transactionRoutes);
app.use('/api/budgets', auth, budgetRoutes);
app.use('/api/groups', auth, groupRoutes);
app.use('/api/goals', auth, goalRoutes);
app.use('/api/insights', auth, insightsRoutes);

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
  // Graceful shutdown handler
  const shutdown = async (sig) => {
    try {
      console.log(`[SHUTDOWN] Signal ${sig} received. Closing server...`);
      srv.close(()=> console.log('[SHUTDOWN] HTTP server closed'));
      await mongoose.connection.close();
      console.log('[SHUTDOWN] Mongo connection closed');
      process.exit(0);
    } catch (e) {
      console.error('[SHUTDOWN] Error during shutdown', e);
      process.exit(1);
    }
  };
  ['SIGINT','SIGTERM'].forEach(sig => process.once(sig, () => shutdown(sig)) );
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
