import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flame, History, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { path: '/admin',         icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/history', icon: History,         label: 'History'   },
  { path: '/admin/heatmap', icon: Flame,           label: 'Heatmap'   },
];

export function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-50 pb-safe pl-safe pr-safe"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-around max-w-[600px] mx-auto px-2 sm:px-4" style={{ height: '64px' }}>
        {navItems.map((item, index) => {
          const isActive =
            item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          const isCenter = index === 2;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 ${isCenter ? '-mt-5' : ''}`}
            >
              {isCenter ? (
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: '#0f172a',
                    color: '#f97316',
                    boxShadow: '0 4px 18px rgba(249,115,22,0.35)',
                  }}
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </motion.div>
              ) : (
                <motion.div whileTap={{ scale: 0.92 }} className="flex flex-col items-center gap-1">
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                    style={{
                      background: isActive ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                    }}
                  >
                    <Icon
                      className="w-5 h-5 transition-colors"
                      style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                      strokeWidth={isActive ? 2.2 : 1.7}
                    />
                  </div>
                  <span
                    className="text-[10px] leading-none font-medium transition-colors"
                    style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="adminActiveTab"
                      className="absolute bottom-1 w-1 h-1 rounded-full"
                      style={{ background: 'var(--primary)' }}
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    />
                  )}
                </motion.div>
              )}
            </Link>
          );
        })}

        {/* Theme toggle */}
        <div className="relative flex flex-col items-center justify-center flex-1 h-full gap-1">
          <ThemeToggle />
          <span className="text-[10px] leading-none font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Theme
          </span>
        </div>

        {/* Logout button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleLogout}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-1"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-xl transition-all">
            <LogOut className="w-5 h-5" style={{ color: 'var(--destructive)' }} strokeWidth={1.7} />
          </div>
          <span className="text-[10px] leading-none font-medium" style={{ color: 'var(--destructive)' }}>
            Sign out
          </span>
        </motion.button>
      </div>
    </nav>
  );
}
