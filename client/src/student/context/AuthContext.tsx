import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  login as bbLogin,
  logout as bbLogout,
  register as bbRegister,
  getCurrentUser,
  getPreferences,
  savePreferences as bbSavePreferences,
  type UserProfile,
  type UserPreferences,
} from '../services/backboard';

// ── Context shape ──────────────────────────────────────────────

interface AuthContextValue {
  user: UserProfile | null;
  preferences: UserPreferences;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  savePreferences: (prefs: UserPreferences) => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());
  const [isLoading, setIsLoading] = useState(true);

  // Apply dark mode class to <html> whenever preferences change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!preferences.darkMode);
  }, [preferences.darkMode]);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = getCurrentUser();
    if (stored) {
      setUser(stored);
      setPreferences(getPreferences());
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const profile = await bbLogin(email, password);
    setUser(profile);
    setPreferences(getPreferences());
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const profile = await bbRegister(name, email, password);
      setUser(profile);
      setPreferences(getPreferences());
    },
    []
  );

  const logout = useCallback(() => {
    bbLogout();
    setUser(null);
  }, []);

  const savePreferences = useCallback(async (prefs: UserPreferences) => {
    await bbSavePreferences(prefs);
    setPreferences(prefs);
  }, []);

  const refreshUser = useCallback(() => {
    const stored = getCurrentUser();
    if (stored) setUser(stored);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        savePreferences,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
