import { X, Trophy, Timer, MapPin, TrendingUp, Flame, Sunrise, MoonStar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface User {
  rank: number;
  name: string;
  avatar: string;
  tokens: number;
  isCurrentUser: boolean;
  totalSessions?: number;
  studyHours?: number;
  streak?: number;
}

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

const avatarPalette = [
  'bg-emerald-700', 'bg-slate-600', 'bg-primary', 'bg-accent',
  'bg-amber-700', 'bg-slate-500', 'bg-teal-700', 'bg-indigo-700',
  'bg-rose-700', 'bg-cyan-700',
];

const achievements = [
  { name: 'Week Warrior', icon: Flame,    color: 'text-orange-500' },
  { name: 'Early Bird',   icon: Sunrise,  color: 'text-amber-500'  },
  { name: 'Night Owl',    icon: MoonStar, color: 'text-indigo-400' },
];

export function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  if (!user) return null;

  const stats = [
    { label: 'Study Hours', value: `${user.studyHours ?? 0}h`,            icon: Timer,      color: 'text-primary'  },
    { label: 'Sessions',    value: String(user.totalSessions ?? 0),        icon: MapPin,     color: 'text-accent'   },
    { label: 'Streak',      value: `${user.streak ?? 0} days`,             icon: TrendingUp, color: 'text-warning'  },
  ];

  const recentActivity = [
    { space: 'Casgrain 202',  duration: '2h 15m', date: 'Today'     },
    { space: 'Library 3F',    duration: '1h 45m', date: 'Yesterday' },
    { space: 'Hochelaga 105', duration: '3h 20m', date: 'Apr 10'    },
  ];

  const avatarBg = avatarPalette[(user.rank - 1) % avatarPalette.length];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 8 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border shadow-2xl"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="relative px-6 pt-6 pb-6 rounded-t-3xl overflow-hidden texture-bg" style={{ background: 'var(--hero)' }}>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X className="w-4 h-4 text-white" strokeWidth={1.8} />
            </button>
            <div className="flex flex-col items-center text-center pt-4">
              <div className={`w-20 h-20 rounded-full ${avatarBg} flex items-center justify-center text-white text-2xl font-bold border-2 shadow-lg mb-3`} style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                {user.avatar}
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-white mb-0.5">{user.name}</h2>
              {user.isCurrentUser && (
                <span className="text-[12px] text-white/80 px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  This is you
                </span>
              )}
            </div>
          </div>

          <div className="px-5 pt-4 mb-4">
            <div className="rounded-2xl p-4 border" style={{ background: 'color-mix(in srgb, var(--muted) 50%, transparent)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)' }}>
                    <Trophy className="w-5 h-5" style={{ color: 'var(--warning)' }} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Current rank</p>
                    <p className="text-[20px] font-bold leading-tight" style={{ color: 'var(--foreground)' }}>#{user.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Tokens</p>
                  <p className="text-[20px] font-bold leading-tight" style={{ color: 'var(--warning)' }}>{user.tokens}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Statistics</h3>
            <div className="grid grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl p-3 text-center border" style={{ background: 'color-mix(in srgb, var(--muted) 50%, transparent)', borderColor: 'var(--border)' }}>
                  <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} strokeWidth={1.8} />
                  <div className="text-[16px] font-bold mb-0.5 leading-tight" style={{ color: 'var(--foreground)' }}>{stat.value}</div>
                  <div className="text-[10px] leading-tight" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Recent Activity</h3>
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--muted) 40%, transparent)', borderColor: 'var(--border)' }}>
                  <div>
                    <p className="font-medium text-[13px]" style={{ color: 'var(--foreground)' }}>{a.space}</p>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{a.date}</p>
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{a.duration}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 pb-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Achievements</h3>
            <div className="flex gap-2">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                  <div key={ach.name} className="flex-1 rounded-xl p-3 text-center border" style={{ background: 'color-mix(in srgb, var(--muted) 50%, transparent)', borderColor: 'var(--border)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--muted)' }}>
                      <Icon className={`w-4 h-4 ${ach.color}`} strokeWidth={1.8} />
                    </div>
                    <div className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                      {ach.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
