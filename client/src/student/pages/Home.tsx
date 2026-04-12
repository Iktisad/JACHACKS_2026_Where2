import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers, SunMedium, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { SpaceCard } from '../components/SpaceCard';
import { AIRecommendation } from '../components/AIRecommendation';
import { SpaceFinderPanel, type SpaceFinderFormState } from '../components/SpaceFinderPanel';
import { runSpaceFinder, type FinderSpace } from '../services/spaceFinder';
import { LiveStats } from '../components/LiveStats';
import { useAuth } from '../context/AuthContext';

const spaces: FinderSpace[] = [
  {
    id: 1,
    name: 'Casgrain 202',
    building: 'Casgrain Hall',
    occupancy: 15,
    capacity: 40,
    status: 'low',
    floor: '2nd Floor',
    distance: '50m',
    noiseLevel: 'Silent',
    amenities: ['wifi', 'outlets', 'whiteboard', 'quiet'],
  },
  {
    id: 2,
    name: 'Library 3F',
    building: 'Main Library',
    occupancy: 28,
    capacity: 35,
    status: 'moderate',
    floor: '3rd Floor',
    distance: '120m',
    noiseLevel: 'Quiet',
    amenities: ['wifi', 'outlets', 'quiet', 'natural-light'],
  },
  {
    id: 3,
    name: 'Hochelaga 105',
    building: 'Hochelaga Wing',
    occupancy: 8,
    capacity: 25,
    status: 'low',
    floor: '1st Floor',
    distance: '200m',
    noiseLevel: 'Moderate',
    amenities: ['wifi', 'whiteboard', 'projector'],
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Home() {
  const isDesktop = useIsDesktop();
  const { user, preferences, savePreferences } = useAuth();

  function toggleDark() {
    savePreferences({ ...preferences, darkMode: !preferences.darkMode });
  }

  const defaultFinder: SpaceFinderFormState = {
    building: preferences.preferredBuilding as SpaceFinderFormState['building'],
    environment: preferences.preferredEnvironment,
    duration: preferences.defaultDuration,
  };

  const [finderValues, setFinderValues] = useState<SpaceFinderFormState>(defaultFinder);
  const [recommended, setRecommended] = useState<FinderSpace>(spaces[0]);
  const [insight, setInsight] = useState<string | undefined>(undefined);
  const [finderLoading, setFinderLoading] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const handleRunFinder = useCallback(async () => {
    setFinderLoading(true);
    try {
      const { space, insight: nextInsight } = await runSpaceFinder(finderValues, spaces);
      setRecommended(space);
      setInsight(nextInsight);
    } finally {
      setFinderLoading(false);
    }
  }, [finderValues]);

  if (isDesktop) {
    return (
      <div style={{ background: 'var(--background)' }}>
        <div className="max-w-2xl mx-auto px-8 py-10">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-9"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-medium mb-1 tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  {getGreeting()}, {firstName}
                </p>
                <h1 className="text-[22px] font-semibold tracking-tight leading-snug" style={{ color: 'var(--foreground)' }}>
                  Find your study space
                </h1>
                <p className="text-[13px] mt-1.5 flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                  <SunMedium className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} strokeWidth={1.8} />
                  <span>{spaces.length} spaces tracked · Real-time occupancy</span>
                </p>
              </div>
              <button
                type="button"
                onClick={toggleDark}
                className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors shrink-0"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
                title={preferences.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {preferences.darkMode
                  ? <Sun className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
                  : <Moon className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
                }
              </button>
            </div>
          </motion.header>

          <SpaceFinderPanel
            values={finderValues}
            onChange={setFinderValues}
            onRun={handleRunFinder}
            loading={finderLoading}
          />

          <div className="mt-8 space-y-8">
            <AIRecommendation space={recommended} insight={insight} loading={finderLoading} />

            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Layers className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
                    Nearby spaces
                  </h2>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Sorted by distance · availability
                  </p>
                </div>
                <button type="button" className="text-[12px] font-semibold flex items-center gap-1 hover:underline underline-offset-2" style={{ color: 'var(--primary)' }}>
                  View all <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                </button>
              </div>
              <div className="grid gap-3">
                {spaces.map((space, index) => (
                  <motion.div
                    key={space.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.06 }}
                  >
                    <SpaceCard space={space} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6" style={{ background: 'var(--background)' }}>
      <div className="text-white px-5 pt-10 pb-16 texture-bg relative overflow-hidden" style={{ background: 'var(--hero)' }}>
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/5" />
        <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full border border-white/5" />
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="flex items-start justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {getGreeting()}
            </p>
            <button
              type="button"
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
              title={preferences.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {preferences.darkMode
                ? <Sun className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.80)' }} strokeWidth={1.8} />
                : <Moon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.80)' }} strokeWidth={1.8} />
              }
            </button>
          </div>
          <h1 className="text-[22px] font-semibold leading-snug tracking-tight">
            Hey {firstName},<br />
            <span style={{ color: 'rgba(255,255,255,0.70)' }}>where are you studying?</span>
          </h1>
        </motion.div>
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-lg mx-auto">
        <SpaceFinderPanel values={finderValues} onChange={setFinderValues} onRun={handleRunFinder} loading={finderLoading} compact />
        <div className="rounded-2xl border p-4 shadow-sm overflow-x-auto no-scrollbar" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <LiveStats compact />
        </div>
      </div>

      <div className="px-4 mt-5 space-y-6 max-w-lg mx-auto">
        <AIRecommendation space={recommended} insight={insight} loading={finderLoading} />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold tracking-tight flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Layers className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
              Near you
            </h2>
            <Link to="/student/map" className="text-[12px] font-semibold flex items-center gap-1 hover:underline underline-offset-2" style={{ color: 'var(--primary)' }}>
              View map <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {spaces.map((space, index) => (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + index * 0.06 }}
              >
                <SpaceCard space={space} compact />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
