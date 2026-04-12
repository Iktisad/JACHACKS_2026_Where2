import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, Timer, Trophy, ChevronDown, User, LogOut, Sliders } from 'lucide-react';
import { motion } from 'motion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../context/AuthContext';

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/student',            icon: LayoutDashboard, label: 'Home'        },
    { path: '/student/map',        icon: Map,             label: 'Map'         },
    { path: '/student/session',    icon: Timer,           label: 'Session'     },
    { path: '/student/leaderboard',icon: Trophy,          label: 'Leaderboard' },
  ];

  function handleLogout() {
    logout();
    navigate('/student/login');
  }

  const initials = user?.avatar || '?';
  const displayName = user?.name || 'Guest';
  const tokenCount = user?.tokens ?? 0;

  return (
    <div className="w-64 h-screen border-r flex flex-col min-h-0 sticky top-0 shrink-0" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-2 pt-0 pb-2">
        <Link to="/student" className="block shrink-0 leading-none outline-none">
          <img
            src="/icons/web logo.svg"
            alt="Whereto"
            className="block w-full h-auto object-contain object-left"
          />
        </Link>

        <nav className="space-y-0.5 pb-2 pt-2.5 min-w-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="relative block rounded-xl">
                {isActive && (
                  <motion.div
                    layoutId="studentActiveNav"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 12%, transparent)' }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                  />
                )}
                <div
                  className="relative flex items-center gap-3 px-2 py-2 rounded-xl transition-colors"
                  style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                >
                  <span className="inline-flex w-5 shrink-0 items-center justify-center">
                    <Icon className="size-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className={`min-w-0 flex-1 text-[13px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  <span className="inline-flex w-3 shrink-0 justify-center" aria-hidden>
                    {isActive
                      ? <span className="size-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
                      : <span className="size-1.5 shrink-0" />
                    }
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Switch role link */}
        <div className="mt-auto pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link
            to="/"
            className="flex items-center gap-2 px-2 py-2 rounded-xl text-[12px] transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            ← Switch Role
          </Link>
        </div>
      </div>

      <div className="shrink-0 border-t px-2 py-2" style={{ borderColor: 'var(--border)' }}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl border border-transparent text-left group transition-all"
              style={{ color: 'var(--foreground)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--muted) 70%, transparent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] truncate leading-tight" style={{ color: 'var(--foreground)' }}>{displayName}</div>
                <div className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{tokenCount} tokens earned</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] rounded-xl border p-1 shadow-lg z-[100]"
              style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}
              sideOffset={6}
              align="end"
            >
              <DropdownMenu.Item asChild>
                <Link
                  to="/student/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg outline-none cursor-pointer"
                  style={{ color: 'var(--foreground)' }}
                >
                  <User className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
                  View profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  to="/student/preferences"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg outline-none cursor-pointer"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Sliders className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
                  Preferences
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px my-1" style={{ background: 'var(--border)' }} />
              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg outline-none cursor-pointer"
                style={{ color: 'var(--destructive)' }}
                onSelect={handleLogout}
              >
                <LogOut className="w-4 h-4" strokeWidth={1.7} />
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}
