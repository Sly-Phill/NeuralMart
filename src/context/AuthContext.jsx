import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(user);
    return user;
  }, []);

  const signup = useCallback(async (fullName, email, password) => {
    const { user } = await api('/auth/signup', { method: 'POST', body: { fullName, email, password } });
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* cookie cleared anyway on next request */ }
    setUser(null);
    toast('You’re logged out', { type: 'info', description: 'See you soon!' });
    navigate('/');
  }, [navigate, toast]);

  /** Send the visitor to log in, then bring them back to where they were. */
  const requireLogin = useCallback((reason) => {
    const next = `${location.pathname}${location.search}`;
    if (reason) toast(reason, { type: 'info', description: 'Log in or create a free account — it takes 20 seconds.' });
    navigate(`/login?next=${encodeURIComponent(next)}`);
  }, [location.pathname, location.search, navigate, toast]);

  return (
    <AuthCtx.Provider value={{ user, ready, login, signup, logout, requireLogin }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
