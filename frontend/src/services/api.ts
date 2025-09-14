import axios from 'axios';

// Multi-endpoint fallback list (first reachable wins). Add/remove as needed.
const candidateBases = [
  process.env.REACT_APP_API_URL,
  'http://localhost:5050/api',
  'http://127.0.0.1:5050/api',
  'http://localhost:5000/api'
].filter(Boolean) as string[];

let activeBase = candidateBases[0];

// Simple reachability cache to avoid hammering endpoints
const healthCache: Record<string, { ok: boolean; ts: number }> = {};
async function probeBase(base: string): Promise<boolean> {
  const cached = healthCache[base];
  const now = Date.now();
  if (cached && now - cached.ts < 10000) return cached.ok; // 10s cache
  try {
    await axios.get(base.replace(/\/api$/, '') + '/health', { timeout: 2500 });
    healthCache[base] = { ok: true, ts: now };
    return true;
  } catch {
    healthCache[base] = { ok: false, ts: now };
    return false;
  }
}

async function ensureActiveBase(erroringBase?: string) {
  if (erroringBase && erroringBase === activeBase) {
    // try to find another one that works
    for (const b of candidateBases) {
      if (b === activeBase) continue;
      const ok = await probeBase(b);
      if (ok) { activeBase = b; break; }
    }
  } else if (!activeBase) {
    for (const b of candidateBases) {
      const ok = await probeBase(b);
      if (ok) { activeBase = b; break; }
    }
  }
}

const api = axios.create({ baseURL: activeBase });

// Request interceptor to add auth token
api.interceptors.request.use(async (config: any) => {
  // If we switched bases after creation, update per request
  if (config.baseURL !== activeBase) {
    config.baseURL = activeBase;
  }
  // Prefer Clerk auth token if available. Clerk stores tokens in memory via its hooks; however as a
  // simple bridge we allow a manually stored clerk session token (if you later implement retrieval
  // via Clerk's useAuth, you can pass it down instead of reading localStorage).
  const legacyToken = localStorage.getItem('token');
  const clerkToken = localStorage.getItem('clerkToken'); // optional manual bridge placeholder
  const token = clerkToken || legacyToken;
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    // Network or CORS failure (no response)
    if (!error.response && error.config) {
      const prevBase = activeBase;
      await ensureActiveBase(prevBase); // try switching
      if (activeBase !== prevBase) {
        // retry once with new base
        const retryCfg = { ...error.config, baseURL: activeBase };
        return api.request(retryCfg);
      }
    }
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export a helper so AuthContext can ask for current base
export function getApiBase(){ return activeBase; }
export async function refreshApiBase(){ await ensureActiveBase(); }

export default api;
