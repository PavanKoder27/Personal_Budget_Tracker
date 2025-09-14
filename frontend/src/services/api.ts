import axios from 'axios';

// Multi-endpoint fallback list (first reachable wins). Order matters.
// We now prioritize explicit env, then common dev port 5000, then 5050 fallbacks.
// Build candidate list & deduplicate while preserving order
const rawCandidates = [
  process.env.REACT_APP_API_URL,
  'http://localhost:5000/api',
  'http://127.0.0.1:5000/api',
  'http://localhost:5050/api',
  'http://127.0.0.1:5050/api'
].filter(Boolean) as string[];
const seen = new Set<string>();
const candidateBases = rawCandidates.filter(b => {
  if (seen.has(b)) return false;
  seen.add(b); return true;
});

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
  // If we have no active base yet or the current one failed, scan for first reachable.
  if (!activeBase || (erroringBase && erroringBase === activeBase)) {
    for (const b of candidateBases) {
      const ok = await probeBase(b);
      if (ok) {
        if (activeBase !== b) {
          // eslint-disable-next-line no-console
          console.info('[api] switching active base ->', b, ' (prev:', activeBase, ')');
        }
        activeBase = b;
        break;
      }
    }
  }
}

// Perform an initial async probe (non-blocking). Consumers can call refreshApiBase() to await readiness.
(async () => {
  try { await ensureActiveBase(); } catch (e) { /* ignore */ }
  try {
    console.info('[api] active base resolved to', activeBase, 'candidates=', candidateBases);
    // Expose for quick debugging in browser console
    (window as any).__API_BASE__ = activeBase;
  } catch {}
})();

const api = axios.create({ baseURL: activeBase });

// Request interceptor to add auth token
api.interceptors.request.use(async (config: any) => {
  // If we switched bases after creation, update per request
  if (config.baseURL !== activeBase) {
    config.baseURL = activeBase;
  }
  // If activeBase is still the first candidate but hasn't been validated, opportunistically probe.
  if (!healthCache[activeBase]) {
    ensureActiveBase(); // fire and forget; next request will benefit
  }
  // Pure JWT token (Clerk & OTP removed)
  const token = localStorage.getItem('token');
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
        const retryCfg = { ...error.config, baseURL: activeBase };
        // eslint-disable-next-line no-console
        console.warn('[api] network error, retried with new base', activeBase);
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
