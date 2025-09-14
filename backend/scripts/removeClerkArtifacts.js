#!/usr/bin/env node
/**
 * Migration helper: remove legacy Clerk artifacts from the database.
 * - Drops any indexes on `clerkId` (if still present from old schema versions)
 * - Unsets `clerkId` field from all user documents (safety idempotent)
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/budgettrackr';

async function run(){
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Drop index on clerkId if exists
  try {
    const indexes = await users.indexes();
    const clerkIndex = indexes.find(i => i.key && Object.keys(i.key).includes('clerkId'));
    if (clerkIndex) {
      console.log('[MIGRATION] Dropping index:', clerkIndex.name);
      await users.dropIndex(clerkIndex.name);
    } else {
      console.log('[MIGRATION] No clerkId index found.');
    }
  } catch (err) {
    console.warn('[MIGRATION] Could not inspect/drop clerkId index:', err.message);
  }

  // Unset clerkId field
  const res = await users.updateMany({ clerkId: { $exists: true } }, { $unset: { clerkId: 1 } });
  console.log(`[MIGRATION] clerkId unset result: matched=${res.matchedCount} modified=${res.modifiedCount}`);

  await mongoose.disconnect();
  console.log('[MIGRATION] Completed Clerk artifact removal.');
}

run().catch(err => { console.error('[MIGRATION] Fatal error:', err); process.exit(1); });
