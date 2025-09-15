// Lightweight environment validation & diagnostics
// Import early in server.js after dotenv.

function requireVar(name, { minLength = 1 } = {}) {
  const val = process.env[name];
  if (!val || (val.length < minLength)) {
    return { name, ok: false, message: `Missing or too short (minLength=${minLength})` };
  }
  return { name, ok: true };
}

function optionalVar(name) {
  const val = process.env[name];
  return { name, ok: !!val, optional: true };
}

function validateEnv() {
  const checks = [
    requireVar('MONGODB_URI'),
    requireVar('JWT_SECRET', { minLength: 24 }),
    optionalVar('CLERK_SECRET_KEY'),
    optionalVar('GMAIL_USER'),
    optionalVar('GMAIL_PASS')
  ];

  const problems = checks.filter(c => !c.ok && !c.optional);
  const report = {
    NODE_ENV: process.env.NODE_ENV,
    checks
  };

  // In production, fail fast if required vars missing.
  if (process.env.NODE_ENV === 'production' && problems.length) {
    console.error('[ENV] FATAL missing required environment variables:', problems.map(p => p.name).join(', '));
    return { ok: false, report };
  }
  if (problems.length) {
    console.warn('[ENV] WARN missing required environment variables (allowed in non-production):', problems.map(p => p.name).join(', '));
  }
  if (process.env.JWT_SECRET === 'replace-with-strong-secret') {
    console.warn('[ENV] WARN JWT_SECRET still set to placeholder value; replace before production deployment.');
  }
  return { ok: true, report };
}

module.exports = { validateEnv };
