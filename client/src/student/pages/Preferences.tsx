import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Volume2, Timer, Bell, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import type { UserPreferences } from '../services/backboard';

type Environment = UserPreferences['preferredEnvironment'];
type Duration    = UserPreferences['defaultDuration'];

const BUILDINGS = [
  { value: 'all',            label: 'Any building',   desc: 'No preference' },
  { value: 'Casgrain Hall',  label: 'Casgrain Hall',  desc: 'Theatre & classrooms' },
  { value: 'Main Library',   label: 'Main Library',   desc: 'Quiet study floors' },
  { value: 'Hochelaga Wing', label: 'Hochelaga Wing', desc: 'Collaborative spaces' },
];

const ENVIRONMENTS: { value: Environment; label: string; desc: string }[] = [
  { value: 'silent',        label: 'Silent',        desc: 'Exams, deep focus' },
  { value: 'quiet',         label: 'Quiet',         desc: 'Reading, notes' },
  { value: 'collaborative', label: 'Collaborative', desc: 'Group work' },
];

const DURATIONS: { value: Duration; label: string; desc: string }[] = [
  { value: 'short',  label: 'Under 1 hr', desc: 'Quick review' },
  { value: 'medium', label: '1–2 hours',  desc: 'Standard session' },
  { value: 'long',   label: '2+ hours',   desc: 'Deep work' },
];

function OptionChip<T extends string>({ value, selected, label, desc, onSelect }: {
  value: T; selected: boolean; label: string; desc: string; onSelect: (v: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.98]"
      style={selected
        ? { borderColor: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }
        : { borderColor: 'var(--border)', background: 'var(--card)' }
      }
    >
      <div>
        <p className="text-[14px] font-semibold leading-tight" style={{ color: selected ? 'var(--primary)' : 'var(--foreground)' }}>{label}</p>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
      </div>
      {selected && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--primary)' }} strokeWidth={2} />}
    </button>
  );
}

const STEPS = [
  { icon: Building2, title: 'Preferred building',     subtitle: 'Where do you usually study?' },
  { icon: Volume2,   title: 'Study environment',      subtitle: 'How do you like it to feel?' },
  { icon: Timer,     title: 'Typical session length', subtitle: 'How long do you usually study?' },
  { icon: Bell,      title: 'Notifications',          subtitle: 'Get alerted when spaces open up' },
];

export function Preferences() {
  const { preferences, savePreferences } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();

  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState(1);
  const [building, setBuilding]   = useState(preferences.preferredBuilding);
  const [environment, setEnvironment] = useState<Environment>(preferences.preferredEnvironment);
  const [duration, setDuration]   = useState<Duration>(preferences.defaultDuration);
  const [notifications, setNotifications] = useState(preferences.notificationsEnabled);
  const [loading, setLoading]     = useState(false);

  const isOnboarding = location.state?.fromRegister === true;
  const totalSteps   = STEPS.length;

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function handleSave() {
    setLoading(true);
    try {
      await savePreferences({ ...preferences, preferredBuilding: building, preferredEnvironment: environment, defaultDuration: duration, notificationsEnabled: notifications });
      navigate('/student');
    } finally {
      setLoading(false);
    }
  }

  const StepIcon = STEPS[step].icon;
  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="px-5 pt-10 pb-8 relative overflow-hidden" style={{ background: 'var(--hero)' }}>
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full border border-white/10" />
        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full border border-white/8" />
        <div className="relative max-w-md mx-auto">
          {!isDesktop && !isOnboarding && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="absolute -top-1 right-0 w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {isOnboarding && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[11px] font-semibold text-white" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)' }}>
              <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
              Account created!
            </div>
          )}
          <h1 className="text-[22px] font-bold tracking-tight leading-snug text-white">
            {isOnboarding ? 'Set your study style' : 'Study preferences'}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
            We'll use this to match you with the best spaces.
          </p>
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((_, i) => (
              <div key={i} className="transition-all duration-300 rounded-full" style={{ width: i === step ? 24 : 8, height: 8, background: i <= step ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.25)' }} />
            ))}
            <span className="ml-auto text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>{step + 1} / {totalSteps}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'var(--primary)' }}>
            <StepIcon className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--foreground)' }}>{STEPS[step].title}</h2>
            <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>{STEPS[step].subtitle}</p>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeInOut' }} className="w-full">
              {step === 0 && (
                <div className="space-y-2.5">
                  {BUILDINGS.map((b) => <OptionChip key={b.value} value={b.value} selected={building === b.value} label={b.label} desc={b.desc} onSelect={setBuilding} />)}
                </div>
              )}
              {step === 1 && (
                <div className="space-y-2.5">
                  {ENVIRONMENTS.map((e) => <OptionChip key={e.value} value={e.value} selected={environment === e.value} label={e.label} desc={e.desc} onSelect={(v) => setEnvironment(v as Environment)} />)}
                </div>
              )}
              {step === 2 && (
                <div className="grid grid-cols-3 gap-3">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDuration(d.value as Duration)}
                      className="flex flex-col items-center py-5 px-2 rounded-2xl border-2 text-center transition-all active:scale-[0.97]"
                      style={duration === d.value
                        ? { borderColor: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }
                        : { borderColor: 'var(--border)', background: 'var(--card)' }
                      }
                    >
                      <p className="text-[13px] font-bold" style={{ color: duration === d.value ? 'var(--primary)' : 'var(--foreground)' }}>{d.label}</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>{d.desc}</p>
                    </button>
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="rounded-2xl border p-5 shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: 'var(--foreground)' }}>Space availability alerts</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Get notified when your preferred space opens up</p>
                    </div>
                    <button type="button" onClick={() => setNotifications((p) => !p)} className="relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4" style={{ background: notifications ? 'var(--primary)' : 'var(--border)' }}>
                      <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: notifications ? '1.75rem' : '0.25rem' }} />
                    </button>
                  </div>
                  <p className="text-[12px] mt-4" style={{ color: 'var(--muted-foreground)' }}>
                    {notifications ? "Notifications are on — we'll ping you when a space opens." : 'Notifications are off — you can enable them any time in your profile.'}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-2xl font-semibold text-[14px] border-2 transition-all active:scale-[0.97]" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}>
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Back
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button type="button" onClick={() => go(step + 1)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px] shadow-md active:scale-[0.98] transition-colors" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              Next
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px] shadow-md active:scale-[0.98] disabled:opacity-60 transition-colors" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <>{isOnboarding ? "Let's go!" : 'Save preferences'} <ArrowRight className="w-4 h-4" strokeWidth={2} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
