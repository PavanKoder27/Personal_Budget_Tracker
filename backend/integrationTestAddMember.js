// Automated integration test: spins up server on alt port then exercises add-member flow
const { spawn } = require('child_process');
const fetch = require('node-fetch');

const PORT = 5050; // avoid clash with any existing 5000 listener
const BASE = `http://localhost:${PORT}`;
const API = BASE + '/api';

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function waitForHealth(timeoutMs=15000){
  const start = Date.now();
  while(Date.now()-start < timeoutMs){
    try {
      const res = await fetch(BASE + '/health');
      if(res.ok) return true;
    } catch(_) {}
    await wait(300);
  }
  return false;
}

(async ()=>{
  console.log('[INT] Starting server on port', PORT);
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(PORT) },
    cwd: __dirname,
    stdio: ['ignore','pipe','pipe']
  });
  server.stdout.on('data', d=> process.stdout.write('[SERVER] '+d.toString()));
  server.stderr.on('data', d=> process.stderr.write('[SERVER-ERR] '+d.toString()));

  let exiting = false;
  const safeExit = (code=0)=>{ if(exiting) return; exiting = true; server.kill(); process.exit(code); };

  // Safety timeout
  setTimeout(()=>{ console.error('[INT] Global timeout'); safeExit(1); }, 60000);

  const healthy = await waitForHealth();
  if(!healthy){ console.error('[INT] Server failed to become healthy'); return safeExit(1); }
  console.log('[INT] Health check passed');

  try {
    const rand = Math.floor(Math.random()*1e6);
    const email = `intuser${rand}@example.com`;
    const password = 'Passw0rd!';

    // Register
    console.log('[INT] Registering user', email);
    let res = await fetch(API + '/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name:'IntUser'+rand, email, password })});
    let data = await res.json();
    if(!res.ok){ console.error('[INT] Register failed', data); return safeExit(1); }

    // Login
    console.log('[INT] Logging in');
    res = await fetch(API + '/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })});
    data = await res.json();
    if(!res.ok){ console.error('[INT] Login failed', data); return safeExit(1); }
    const token = data.token;
    console.log('[INT] Token length', token?.length);
    const authHeaders = { 'Content-Type':'application/json', 'Authorization':'Bearer ' + token };

    // Create group
    console.log('[INT] Creating group');
    res = await fetch(API + '/groups', { method:'POST', headers: authHeaders, body: JSON.stringify({ name:'IntGroup'+rand, description:'Automated test' })});
    data = await res.json();
    if(!res.ok){ console.error('[INT] Create group failed', data); return safeExit(1); }
    const groupId = data._id;
    console.log('[INT] Group created', groupId);

    // Add placeholder member
    console.log('[INT] Adding member FriendA');
    res = await fetch(`${API}/groups/${groupId}/members`, { method:'POST', headers: authHeaders, body: JSON.stringify({ name:'FriendA' })});
    let addData = await res.json();
    console.log('[INT] Add FriendA status', res.status, 'members', addData.members?.length);
    if(res.status !== 200){ console.error('[INT] Unexpected status adding FriendA', addData); return safeExit(1); }

    // Duplicate (expect 400)
    console.log('[INT] Adding duplicate FriendA (expect 400)');
    res = await fetch(`${API}/groups/${groupId}/members`, { method:'POST', headers: authHeaders, body: JSON.stringify({ name:'FriendA' })});
    addData = await res.json();
    console.log('[INT] Duplicate status', res.status, 'message', addData.message);
    if(res.status !== 400){ console.error('[INT] Expected 400 duplicate, got', res.status); return safeExit(1); }

    // Add second placeholder
    console.log('[INT] Adding member FriendB');
    res = await fetch(`${API}/groups/${groupId}/members`, { method:'POST', headers: authHeaders, body: JSON.stringify({ name:'FriendB' })});
    addData = await res.json();
    console.log('[INT] Add FriendB status', res.status, 'members', addData.members?.length);
    if(res.status !== 200){ console.error('[INT] Add FriendB failed', addData); return safeExit(1); }

    console.log('[INT] All tests passed ✅');
    safeExit(0);
  } catch(err){
    console.error('[INT] Unexpected error', err);
    safeExit(1);
  }
})();
