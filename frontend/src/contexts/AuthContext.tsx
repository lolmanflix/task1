import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api } from '../utils/api';

export type User = {
  id: string;
  email: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (payload: { email?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(data: any): User | null {
  if (!data) return null;
  const u = data.admin || data.user || data;
  if (!u?.id || !u?.email) return null;
  return {
    id: u.id,
    email: u.email,
    isAdmin: Boolean(u.isAdmin)
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(normalizeUser(data));
    } catch (_) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(normalizeUser(data));
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateProfile = useCallback(async (payload: { email?: string; currentPassword?: string; newPassword?: string }) => {
    const { data } = await api.put('/auth/me', payload);
    setUser(normalizeUser(data));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
