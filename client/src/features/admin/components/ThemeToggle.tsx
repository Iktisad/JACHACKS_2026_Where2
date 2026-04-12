import { Sun, Moon } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ThemeToggleProps {
  /** 'light' = on a light background, 'dark' = on the dark hero band */
  variant?: 'light' | 'dark';
  className?: string;
}

export function ThemeToggle({ variant = 'light', className = '' }: ThemeToggleProps) {
  const { darkMode, toggleDarkMode } = useAdminAuth();

  const isDark = variant === 'dark';

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center rounded-xl transition-colors shrink-0 ${className}`}
      style={
        isDark
          ? {
              width: 32, height: 32,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)',
            }
          : {
              width: 36, height: 36,
              background: 'var(--muted)',
              border: '1px solid var(--border)',
            }
      }
    >
      {darkMode
        ? <Sun
            className={isDark ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            style={{ color: isDark ? 'rgba(255,255,255,0.80)' : 'var(--muted-foreground)' }}
            strokeWidth={1.8}
          />
        : <Moon
            className={isDark ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            style={{ color: isDark ? 'rgba(255,255,255,0.80)' : 'var(--muted-foreground)' }}
            strokeWidth={1.8}
          />
      }
    </button>
  );
}
