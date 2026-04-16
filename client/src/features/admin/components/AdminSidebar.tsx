import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flame, History, ArrowLeftRight, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { path: '/admin',         icon: LayoutDashboard, label: 'Dashboard'    },
  { path: '/admin/history', icon: History,         label: 'History'      },
  { path: '/admin/heatmap', icon: Flame,           label: 'Live Heatmap' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div
      className="w-64 h-screen border-r flex flex-col min-h-0 sticky top-0 shrink-0"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-2 pt-0 pb-2">
        {/* Logo */}
        <Link to="/admin" className="block shrink-0 leading-none outline-none">
          <img
            src="/icons/web logo.svg"
            alt="Whereto Admin"
            className="block w-full h-auto object-contain object-left"
          />
        </Link>

        {/* Role badge */}
        <div className="px-2 pb-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider"
            style={{
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              color: 'var(--primary)',
              border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)',
            }}
          >
            Admin Panel
          </span>
        </div>

        {/* Nav items */}
        <nav className="space-y-0.5 pb-2 pt-1 min-w-0">
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="relative block rounded-xl">
                {isActive && (
                  <motion.div
                    layoutId="adminActiveNav"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--primary) 12%, transparent)',
                    }}
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
                  <span
                    className={`min-w-0 flex-1 text-[13px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}
                  >
                    {item.label}
                  </span>
                  <span className="inline-flex w-3 shrink-0 justify-center" aria-hidden>
                    {isActive ? (
                      <span className="size-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
                    ) : (
                      <span className="size-1.5 shrink-0" />
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-2 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
          {admin && (
            <div
              className="flex items-center gap-2 px-2 py-2 rounded-xl text-[12px]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <div
                className="flex items-center justify-center rounded-lg shrink-0 text-[10px] font-bold"
                style={{ width: 24, height: 24, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {admin.name.charAt(0)}
              </div>
              <span className="truncate flex-1">{admin.name}</span>
              <ThemeToggle />
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-2 py-2 rounded-xl text-[12px] transition-colors hover:bg-red-50"
            style={{ color: 'var(--destructive)' }}
          >
            <LogOut className="size-3.5" strokeWidth={1.7} />
            Sign out
          </button>
          <span
            className="flex items-center gap-2 px-2 py-2 rounded-xl text-[12px] cursor-not-allowed select-none"
            style={{ color: 'var(--muted-foreground)', opacity: 0.4 }}
            title="Student dashboard unavailable"
          >
            <ArrowLeftRight className="size-3.5" strokeWidth={1.7} />
            Switch Role
          </span>
        </div>
      </div>
    </div>
  );
}
