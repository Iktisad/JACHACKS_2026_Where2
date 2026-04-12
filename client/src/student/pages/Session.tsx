import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Square, Timer, MapPin, Coins, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { recordSession, updateProfile, getNudge } from '../services/backboard';

export function Session() {
  const { user, refreshUser } = useAuth();
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSpace] = useState('Casgrain 202');
  const [currentSpaceId] = useState(1);
  const [sessionName, setSessionName] = useState('');
  const [sessionNudge, setSessionNudge] = useState<string | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sessionActive) {
      interval = setInterval(() => setSessionTime((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = sessionTime > 0 ? Math.min((sessionTime / 7200) * 100, 100) : 0;
  const tokensEarned = Math.floor(sessionTime / 360);
  const R = 44; // percentage-based: works with viewBox 100x100
  const circ = 2 * Math.PI * R;

  async function endSession() {
    setSessionActive(false);
    if (sessionTime > 0) {
      const label = sessionName.trim() || 'Study Session';
      await recordSession({
        spaceId: currentSpaceId,
        spaceName: `${label} @ ${currentSpace}`,
        startedAt: new Date(Date.now() - sessionTime * 1000).toISOString(),
        durationSeconds: sessionTime,
        tokensEarned,
      });
      if (user) {
        const updatedProfile = {
          tokens: (user.tokens || 0) + tokensEarned,
          totalSessions: (user.totalSessions || 0) + 1,
          studyHours: Math.round((user.studyHours || 0) + sessionTime / 3600),
        };
        await updateProfile(updatedProfile);
        refreshUser();
        // Fetch a personalised nudge after the session ends
        setNudgeLoading(true);
        setSessionNudge(null);
        getNudge({ ...user, ...updatedProfile }).then((msg) => {
          setSessionNudge(msg);
          setNudgeLoading(false);
        });
      }
    }
    setSessionTime(0);
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="pb-6" style={{ background: 'var(--background)' }}>
      <div className="relative text-white overflow-hidden" style={{ background: 'var(--hero)' }}>
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute right-8 top-10 w-24 h-24 rounded-full border border-white/5 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-10">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <Timer className="w-4 h-4 text-white" strokeWidth={1.8} />
              </div>
              <h1 className="text-[22px] font-semibold tracking-tight">Study Session</h1>
            </div>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Hey {firstName} · Track focus time and earn tokens
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 mt-5 max-w-2xl mx-auto space-y-4">
        {sessionActive && (
          <div className="rounded-2xl px-4 py-3.5 border flex items-center gap-3" style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)', borderColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
              <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{sessionName.trim() || 'Study Session'}</p>
              <p className="text-[15px] font-semibold leading-tight truncate" style={{ color: 'var(--foreground)' }}>{currentSpace}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl px-4 sm:px-6 py-6 sm:py-8 border shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-7">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={R} stroke="var(--border)" strokeWidth="5" fill="none" />
              <circle
                cx="50" cy="50" r={R}
                stroke="var(--primary)"
                strokeWidth="5"
                fill="none"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - progress / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[28px] sm:text-[42px] font-semibold tabular-nums tracking-tight leading-none" style={{ color: 'var(--foreground)' }}>
                {formatTime(sessionTime)}
              </div>
              <div className="text-[11px] sm:text-[13px] mt-1.5 sm:mt-2" style={{ color: 'var(--muted-foreground)' }}>
                {sessionActive ? 'In Progress' : 'Ready to Start'}
              </div>
              {sessionActive && tokensEarned > 0 && (
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full border" style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--warning) 20%, transparent)' }}>
                  <Coins className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} strokeWidth={1.8} />
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--warning)' }}>+{tokensEarned} tokens</span>
                </div>
              )}
            </div>
          </div>

          {!sessionActive && (
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Session name <span style={{ color: 'var(--muted-foreground)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Algorithms exam prep"
                maxLength={60}
                className="w-full px-4 py-2.5 rounded-xl border text-[14px] focus:outline-none transition-colors"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          )}

          <div className="flex gap-2.5">
            {!sessionActive ? (
              <button
                onClick={() => setSessionActive(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[14px] shadow-sm transition-colors"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Play className="w-4 h-4" strokeWidth={2} />
                Start Session
              </button>
            ) : (
              <>
                <button
                  onClick={() => setSessionActive(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 border rounded-xl font-semibold text-[14px] transition-colors"
                  style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)', color: 'var(--warning)', borderColor: 'color-mix(in srgb, var(--warning) 25%, transparent)' }}
                >
                  <Pause className="w-4 h-4" strokeWidth={2} />
                  Pause
                </button>
                <button
                  onClick={endSession}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 border rounded-xl font-semibold text-[14px] transition-colors"
                  style={{ background: 'color-mix(in srgb, var(--destructive) 8%, transparent)', color: 'var(--destructive)', borderColor: 'color-mix(in srgb, var(--destructive) 20%, transparent)' }}
                >
                  <Square className="w-4 h-4" strokeWidth={2} />
                  End
                </button>
              </>
            )}
          </div>
        </div>

        {!sessionActive && (nudgeLoading || sessionNudge) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'color-mix(in srgb, var(--primary) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--primary) 18%, transparent)' }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'color-mix(in srgb, var(--primary) 12%, transparent)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}>
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'color-mix(in srgb, var(--primary) 70%, transparent)' }}>
                Session Summary
              </p>
            </div>
            <div className="px-4 py-3">
              {nudgeLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 rounded w-4/5" style={{ background: 'var(--muted)' }} />
                  <div className="h-3 rounded w-3/5" style={{ background: 'var(--muted)' }} />
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--foreground)' }}>{sessionNudge}</p>
              )}
            </div>
          </motion.div>
        )}

        {!sessionActive && (
          <div className="space-y-2">
            <h3 className="text-[13px] font-semibold px-0.5" style={{ color: 'var(--foreground)' }}>Quick Start</h3>
            <Link to="/student" className="flex items-center justify-between p-4 rounded-xl border transition-colors" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                  <MapPin className="w-5 h-5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color: 'var(--foreground)' }}>Find a Space</p>
                  <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>Browse available spots</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.5} />
            </Link>
          </div>
        )}

        <div className="rounded-2xl p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Today's Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Timer,  colorVar: '--primary',  bgVar: 'color-mix(in srgb, var(--primary) 10%, transparent)',  value: `${user?.studyHours || 0}h`,     label: 'Study Time' },
              { icon: MapPin, colorVar: '--accent',   bgVar: 'color-mix(in srgb, var(--accent) 10%, transparent)',   value: String(user?.totalSessions || 0), label: 'Sessions'   },
              { icon: Coins,  colorVar: '--warning',  bgVar: 'color-mix(in srgb, var(--warning) 10%, transparent)',  value: String(user?.tokens || 0),        label: 'Tokens'     },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: s.bgVar }}>
                  <s.icon className="w-5 h-5" style={{ color: `var(${s.colorVar})` }} strokeWidth={1.8} />
                </div>
                <div className="text-[18px] font-semibold leading-tight tabular-nums" style={{ color: 'var(--foreground)' }}>{s.value}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4 border" style={{ background: 'color-mix(in srgb, var(--accent) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>Weekly Progress</h3>
          </div>
          <div className="text-[22px] font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            {user?.studyHours || 0}h studied
          </div>
          <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
            Keep it up — every session earns <span className="font-semibold" style={{ color: 'var(--accent)' }}>SOL tokens</span>
          </p>
        </div>
      </div>
    </div>
  );
}
