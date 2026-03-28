import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { storeAuth, getToken as loadToken, getUser as loadUser, clearAuth } from '../utils/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const [savedToken, savedUser] = await Promise.all([loadToken(), loadUser()]);
      setToken(savedToken || null);
      setUser(savedUser || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const saveAuth = useCallback(async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await storeAuth(nextToken, nextUser);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await clearAuth();
  }, []);

  const value = useMemo(() => ({ token, user, loading, saveAuth, logout, refresh: bootstrap }), [token, user, loading, saveAuth, logout, bootstrap]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
