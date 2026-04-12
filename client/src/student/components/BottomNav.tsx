import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Timer, Trophy, User } from 'lucide-react';
import { motion } from 'motion/react';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/student',            icon: LayoutDashboard, label: 'Home'    },
    { path: '/student/session',    icon: Timer,           label: 'Session' },
    { path: '/student/map',        icon: Map,             label: 'Map'     },
    { path: '/student/leaderboard',icon: Trophy,          label: 'Ranks'   },
    { path: '/student/profile',    icon: User,            label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-50 pb-safe pl-safe pr-safe" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-around max-w-[600px] mx-auto px-2 sm:px-4" style={{ height: '64px' }}>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isCenter = index === 2;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                isCenter ? '-mt-5' : ''
              }`}
            >
              {isCenter ? (
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent)' }}
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: isActive ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent' }}
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
                      layoutId="studentActiveTab"
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
      </div>
    </nav>
  );
}
