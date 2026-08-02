import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      await api.getCsrfCookie();
      const res = await api.me();
      setUser(res.user);
      return res.user;
    } catch (error) {
      if (error?.status !== 401) {
        console.warn('Auth refresh failed:', error);
      }
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    refreshUser().finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const login = async (email, password, remember = false) => {
    const res = await api.login({ email, password, remember });
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    can: (permission) => user?.permissions?.[permission] ?? false,
  }), [user, loading, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
