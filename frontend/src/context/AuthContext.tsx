import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { refreshApiBase, getApiBase } from '../services/api';
import { useNotification } from './NotificationContext';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
  apiUp: boolean; // backend health status
  lastNetworkError: string | null;
  refreshHealth: () => Promise<void>;
  apiBase: string;
}

const AuthContext = createContext({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactElement }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiUp, setApiUp] = useState(true);
  const [lastNetworkError, setLastNetworkError] = useState<string | null>(null);

  // notification hook is only available when used inside NotificationProvider
  let notify: { show: (m: string, v?: any) => void } | null = null;
  try {
    notify = useNotification();
  } catch (e) {
    notify = null; // ignore when NotificationProvider not present yet
  }

  useEffect(() => {
    const init = async () => {
      await refreshHealth();
      const token = localStorage.getItem('token');
      const sessionActive = (()=>{ try { return sessionStorage.getItem('sessionActive') === '1'; } catch { return false; } })();
      // Only resume auth automatically if this browser session was previously authenticated.
      // This ensures a fresh run starts at the login page even if a token exists in localStorage.
      if (token && sessionActive) {
        await checkAuth();
      } else {
        setLoading(false);
      }
    };
    init();
    // Periodic health check (every 30s) to update connectivity indicator
    const id = setInterval(refreshHealth, 30000);
    return () => clearInterval(id);
  }, []);

  const refreshHealth = async () => {
    try {
      await api.get('/auth/me', { timeout: 4000 }); // piggyback to check auth/health
      setApiUp(true);
      setLastNetworkError(null);
    } catch (err: any) {
      if (err?.response) {
        // Server reachable but responded with error (e.g., 401 if not logged in) => API is up
        setApiUp(true);
      } else {
        setApiUp(false);
        setLastNetworkError('Cannot reach server');
      }
    }
  };

  const checkAuth = async () => {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const extractError = (err: any, fallback: string) => {
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.response) return `Server error (${err.response.status})`;
    if (err?.request) return 'Network unreachable. Is the backend running?';
    return fallback;
  };

  const login = async (email: string, password: string) => {
    setLastNetworkError(null);
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      try { sessionStorage.setItem('sessionActive', '1'); } catch {}
      try { localStorage.setItem('savedEmail', email); } catch {}
      setUser(user);
      notify?.show('Logged in successfully', 'success');
    } catch (err: any) {
      // attempt base refresh & single retry on network unreachable
      const firstMsg = extractError(err, 'Login failed');
      if (firstMsg.includes('Network unreachable')) {
        await refreshApiBase();
        if (getApiBase()) {
          try {
            const response2 = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
            const { token, user } = response2.data;
            localStorage.setItem('token', token);
            setUser(user);
            notify?.show('Logged in successfully (after retry)', 'success');
            return;
          } catch (err2: any) {
            const msg2 = extractError(err2, 'Login failed');
            if (msg2.includes('Network unreachable')) setLastNetworkError(msg2 + ' (after retry)');
            notify?.show(msg2, 'error');
            throw err2;
          }
        }
      }
      if (firstMsg.includes('Network unreachable')) setLastNetworkError(firstMsg);
      notify?.show(firstMsg, 'error');
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLastNetworkError(null);
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      try { sessionStorage.setItem('sessionActive', '1'); } catch {}
      try { localStorage.setItem('savedEmail', email); } catch {}
      setUser(user);
      notify?.show('Welcome! Account created.', 'success');
    } catch (err: any) {
      const msg = extractError(err, 'Registration failed');
      if (msg.includes('Network unreachable')) setLastNetworkError(msg);
      notify?.show(msg, 'error');
      throw err;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    try { sessionStorage.removeItem('sessionActive'); } catch {}
    setUser(null);
    notify?.show('Logged out', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout, loading, apiUp, lastNetworkError, refreshHealth, apiBase: getApiBase() }}>
      {children}
    </AuthContext.Provider>
  );
};
