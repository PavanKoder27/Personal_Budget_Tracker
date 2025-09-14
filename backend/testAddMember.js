// Quick manual integration test for add-member flow
const fetch = require('node-fetch');

const base = 'http://localhost:5000/api';

(async ()=> {
  try {
    const rand = Math.floor(Math.random()*1e6);
    const email = `tester${rand}@example.com`;
    const password = 'Passw0rd!';
    console.log('[TEST] Registering user', email);
    let res = await fetch(base + '/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name:'Tester'+rand, email, password })});
    const regData = await res.json();
    if(!res.ok){ console.error('[TEST] Register failed', regData); return; }

    console.log('[TEST] Logging in');
    res = await fetch(base + '/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })});
    const loginData = await res.json();
    if(!res.ok){ console.error('[TEST] Login failed', loginData); return; }
    const token = loginData.token;
    console.log('[TEST] Token acquired length', token?.length);

    console.log('[TEST] Creating group');
    res = await fetch(base + '/groups', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ name: 'Group'+rand, description:'Integration test group' })});
    const group = await res.json();
    if(!res.ok){ console.error('[TEST] Create group failed', group); return; }
    console.log('[TEST] Group created', group._id);

    console.log('[TEST] Adding placeholder member name = FriendA');
    res = await fetch(base + `/groups/${group._id}/members`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ name:'FriendA' })});
    let addResp = await res.json();
    console.log('[TEST] Add placeholder status', res.status, 'members now', addResp.members?.length);

    console.log('[TEST] Adding duplicate name FriendA (expect 400)');
    res = await fetch(base + `/groups/${group._id}/members`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ name:'FriendA' })});
    addResp = await res.json();
    console.log('[TEST] Duplicate add status', res.status, 'response', addResp);

    console.log('[TEST] Done');
  } catch(err){
    console.error('[TEST] Unexpected error', err);
  }
})();
