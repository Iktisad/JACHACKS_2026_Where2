import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Settings, Coins, Timer, MapPin, Award, ChevronRight,
  Bell, Moon, HelpCircle, LogOut, GraduationCap, Sliders,
  Pencil, X, Check, Loader2, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getSessions, updateProfile } from '../services/backboard';

export function Profile() {
  const { user, preferences, logout, savePreferences, refreshUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const navigate = useNavigate();
  const sessions = getSessions();

  if (!user) return null;

  const initials = user.avatar || user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  function openEdit() {
    setEditName(user!.name);
    setEditError(null);
    setEditOpen(true);
    document.body.style.overflow = 'hidden';
  }
  function closeEdit() {
    setEditOpen(false);
    document.body.style.overflow = '';
  }

  async function handleEditSave() {
    const trimmed = editName.trim();
    if (!trimmed) { setEditError('Name cannot be empty.'); return; }
    setEditLoading(true);
    setEditError(null);
    try {
      await updateProfile({ name: trimmed });
      refreshUser();
      closeEdit();
    } catch (err: any) {
      setEditError(err?.message ?? 'Failed to save.');
    } finally {
      setEditLoading(false);
    }
  }

  const stats = [
    { label: 'Sessions',  value: String(user.totalSessions || sessions.length || 0), icon: Timer,  colorVar: '--primary', bgVar: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
    { label: 'Study Hrs', value: `${user.studyHours || 0}h`,                         icon: Timer,  colorVar: '--accent',  bgVar: 'color-mix(in srgb, var(--accent) 10%, transparent)'  },
    { label: 'Spaces',    value: String(user.spacesVisited || 0),                    icon: MapPin, colorVar: '--primary', bgVar: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
    { label: 'Tokens',    value: String(user.tokens || 0),                           icon: Coins,  colorVar: '--warning', bgVar: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
  ];

  const recentActivity = sessions.slice(0, 3).map((s) => ({
    space: s.spaceName,
    duration: formatDuration(s.durationSeconds),
    tokens: `+${s.tokensEarned}`,
    time: formatDate(s.startedAt),
  }));

  function formatDuration(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const today = new Date();
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff === 0) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (diff === 1) return 'Yesterday';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch { return '—'; }
  }

  function handleLogout() {
    logout();
    navigate('/student/login');
  }

  function toggleDarkMode() {
    savePreferences({ ...preferences, darkMode: !preferences.darkMode });
  }

  const menuItems = [
    { label: 'Notifications',  icon: Bell,       action: 'notifications', toggle: false },
    { label: 'Dark Mode',      icon: Moon,       action: 'darkmode',      toggle: true  },
    { label: 'Help & Support', icon: HelpCircle, action: 'help',          toggle: false },
    { label: 'Settings',       icon: Settings,   action: 'settings',      toggle: false },
  ];

  return (
    <>
      <div className="pb-10" style={{ background: 'var(--background)' }}>
        <div className="text-white px-5 pt-10 pb-16 relative overflow-hidden texture-bg" style={{ background: 'var(--hero)' }}>
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border border-white/5 pointer-events-none" />
          <div className="relative flex items-center justify-between mb-8 max-w-2xl mx-auto">
            <h1 className="text-[20px] font-semibold tracking-tight">Profile</h1>
            <div className="flex items-center gap-2">
              <button type="button" onClick={openEdit} className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }} title="Edit profile">
                <Pencil className="w-4 h-4" strokeWidth={1.8} />
              </button>
              <Link to="/student/preferences" className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }} title="Edit preferences">
                <Sliders className="w-4 h-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
          <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="relative mb-3">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-white/20"
                style={{ color: 'var(--primary)' }}
              >
                {initials}
              </motion.div>
              {(user.rank ?? 99) <= 10 && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow border-2" style={{ borderColor: 'var(--foreground)' }}>
                  <Award className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                </div>
              )}
            </div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <h2 className="text-[20px] font-semibold tracking-tight mb-0.5">{user.name}</h2>
              <p className="text-[13px] mb-3" style={{ color: 'rgba(255,255,255,0.50)' }}>{user.email}</p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span className="text-[12px] font-semibold">Rank #{user.rank || '—'} · This week</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="px-4 pt-4 max-w-2xl mx-auto space-y-3.5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl p-4 shadow-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 gap-2.5">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--muted) 40%, transparent)', borderColor: 'var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: stat.bgVar }}>
                    <stat.icon className="w-[18px] h-[18px]" style={{ color: `var(${stat.colorVar})` }} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-[18px] font-semibold leading-tight tabular-nums" style={{ color: 'var(--foreground)' }}>{stat.value}</div>
                    <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Timer className="w-8 h-8 mx-auto mb-2" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 40%, transparent)' }} strokeWidth={1.5} />
                <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>No sessions yet.</p>
                <Link to="/student" className="text-[13px] font-semibold hover:underline underline-offset-2 mt-1 inline-block" style={{ color: 'var(--primary)' }}>
                  Find a space →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-3 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--muted) 40%, transparent)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                        <MapPin className="w-[15px] h-[15px]" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="font-semibold text-[13px] leading-tight" style={{ color: 'var(--foreground)' }}>{a.space}</p>
                        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{a.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>{a.duration}</p>
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--warning)' }}>{a.tokens} SOL</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-2xl p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--foreground)' }}>Study preferences</h3>
              <Link to="/student/preferences" className="text-[12px] font-semibold hover:underline underline-offset-2" style={{ color: 'var(--primary)' }}>Edit</Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Building',    value: preferences.preferredBuilding === 'all' ? 'Any' : preferences.preferredBuilding.split(' ')[0] },
                { label: 'Environment', value: preferences.preferredEnvironment.charAt(0).toUpperCase() + preferences.preferredEnvironment.slice(1) },
                { label: 'Duration',    value: preferences.defaultDuration === 'short' ? '<1 hr' : preferences.defaultDuration === 'medium' ? '1–2 hr' : '2+ hr' },
              ].map((item) => (
                <div key={item.label} className="text-center p-2.5 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--muted) 40%, transparent)', borderColor: 'var(--border)' }}>
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>{item.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {menuItems.map((item, index) => (
              <button
                key={item.action}
                type="button"
                className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
                style={{ borderBottom: index !== menuItems.length - 1 ? `1px solid var(--border)` : 'none' }}
                onClick={() => {
                  if (item.action === 'darkmode') toggleDarkMode();
                  if (item.action === 'settings') navigate('/student/preferences');
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-[17px] h-[17px]" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
                  <span className="font-medium text-[14px]" style={{ color: 'var(--foreground)' }}>{item.label}</span>
                </div>
                {item.toggle ? (
                  <div className="w-11 h-6 rounded-full relative transition-colors" style={{ background: preferences.darkMode ? 'var(--primary)' : 'var(--border)' }}>
                    <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all" style={{ left: preferences.darkMode ? '1.5rem' : '0.25rem' }} />
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 50%, transparent)' }} strokeWidth={1.5} />
                )}
              </button>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.24 }}
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 border rounded-2xl font-semibold text-[14px] transition-colors"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--destructive)' }}
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
            Log Out
          </motion.button>

          <p className="text-center text-[12px] pb-2" style={{ color: 'var(--muted-foreground)' }}>
            Whereto v1.0.0 · John Abbott College
          </p>
        </div>
      </div>

      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 backdrop-blur-sm z-40" style={{ background: 'rgba(0,0,0,0.50)' }} onClick={closeEdit} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', bounce: 0.18, duration: 0.32 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 pointer-events-auto" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[17px] font-semibold" style={{ color: 'var(--foreground)' }}>Edit profile</h3>
                  <button type="button" onClick={closeEdit} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors" style={{ background: 'var(--muted)' }}>
                    <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={2} />
                  </button>
                </div>
                {editError && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-[13px] border" style={{ background: 'color-mix(in srgb, var(--destructive) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--destructive) 20%, transparent)', color: 'var(--destructive)' }}>
                    {editError}
                  </div>
                )}
                <div className="mb-5">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Full name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(); }}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border text-[14px] focus:outline-none transition-colors"
                      style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeEdit} className="flex-1 py-3 rounded-xl border-2 text-[14px] font-semibold transition-all" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Cancel</button>
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={editLoading || !editName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  >
                    {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" strokeWidth={2.2} /> Save</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
