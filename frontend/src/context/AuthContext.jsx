import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('crsp_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('crsp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('crsp_user', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('crsp_token');
        localStorage.removeItem('crsp_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, token } = res.data.data;
    localStorage.setItem('crsp_token', token);
    localStorage.setItem('crsp_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { user: u, token } = res.data.data;
    localStorage.setItem('crsp_token', token);
    localStorage.setItem('crsp_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crsp_token');
    localStorage.removeItem('crsp_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((u) => {
    setUser(u);
    localStorage.setItem('crsp_user', JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
