import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────

export interface AdminProfile {
  email: string;
  name: string;
}

interface AdminAuthContextValue {
  admin: AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Hardcoded admin credentials (localStorage-backed) ──────────
// In a real app this would be a proper backend check.

const ADMIN_KEY = 'whereto_admin';

const ADMINS: Record<string, { name: string; password: string }> = {
  'admin@johnabbott.qc.ca': { name: 'ITS Admin', password: 'admin123' },
  'its@johnabbott.qc.ca':   { name: 'ITS Staff',  password: 'its123'  },
};

function saveAdmin(profile: AdminProfile) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(profile));
}
function loadAdmin(): AdminProfile | null {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AdminProfile; } catch { return null; }
}
function clearAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}

// ── Context ────────────────────────────────────────────────────

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAdmin(loadAdmin());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const key = email.toLowerCase().trim();
    const match = ADMINS[key];
    if (!match) throw new Error('No admin account found with that email.');
    if (match.password !== password) throw new Error('Incorrect password.');
    const profile: AdminProfile = { email: key, name: match.name };
    saveAdmin(profile);
    setAdmin(profile);
  }, []);

  const logout = useCallback(() => {
    clearAdmin();
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
