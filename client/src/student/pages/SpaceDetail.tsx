import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Share2, Wifi, Zap, Volume2, Sun, BrainCircuit,
  Coins, PencilRuler, Play, Square, Building2, Layers, AudioLines
} from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { ImageWithFallback } from '../components/ImageWithFallback';

const spaces = [
  {
    id: 1,
    name: 'Casgrain 202',
    building: 'Casgrain',
    floor: '2nd Floor',
    occupancy: 3,
    capacity: 20,
    noiseLevel: 'Quiet',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop',
    amenities: ['Wi-Fi Strong', 'Power Outlets', 'Whiteboard', 'Natural Light', 'Quiet Zone'],
  },
];

const occupancyData = [
  { time: '7am',  value: 5  },
  { time: '9am',  value: 12 },
  { time: '11am', value: 18 },
  { time: '1pm',  value: 15 },
  { time: '3pm',  value: 8  },
  { time: '5pm',  value: 3  },
];

const amenityIcon = (a: string) => {
  if (a.includes('Wi-Fi'))      return <Wifi className="w-4 h-4" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />;
  if (a.includes('Power'))      return <Zap className="w-4 h-4" style={{ color: 'var(--warning)' }} strokeWidth={1.8} />;
  if (a.includes('Whiteboard')) return <PencilRuler className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />;
  if (a.includes('Natural'))    return <Sun className="w-4 h-4" style={{ color: 'var(--warning)' }} strokeWidth={1.8} />;
  if (a.includes('Quiet'))      return <AudioLines className="w-4 h-4" style={{ color: 'var(--accent)' }} strokeWidth={1.8} />;
  return null;
};

export function SpaceDetail() {
  const { id } = useParams();
  const space = spaces.find((s) => s.id === Number(id)) ?? spaces[0];
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

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
  const R = 44; // percentage-based: works with viewBox 100x100
  const circ = 2 * Math.PI * R;

  return (
    <div className="pb-6" style={{ background: 'var(--background)' }}>
      <div className="px-4 py-3 flex items-center justify-between border-b sticky top-0 z-10" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Link to="/student" className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors" style={{ color: 'var(--foreground)' }}>
          <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>{space.name}</h1>
        <button type="button" className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
          <Share2 className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
        </button>
      </div>

      <div className="pb-10 max-w-2xl mx-auto">
        <div className="relative h-40 sm:h-52 md:h-64 overflow-hidden" style={{ background: 'var(--muted)' }}>
          <ImageWithFallback src={space.imageUrl} alt={space.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm" style={{ background: 'rgba(var(--card), 0.95)' }}>
              <div className="w-2 h-2 rounded-full bg-[var(--status-low)]" />
              <span className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                {space.occupancy}/{space.capacity} occupied
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Building2, label: 'Building', value: space.building },
              { icon: Layers,    label: 'Floor',    value: space.floor },
              { icon: Volume2,   label: 'Noise',    value: space.noiseLevel },
              { icon: null,      label: 'Capacity', value: `${space.capacity} seats` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3.5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <p className="text-[11px] mb-1" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
                <p className="font-semibold text-[14px]" style={{ color: 'var(--foreground)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-[13px] font-semibold mb-2.5" style={{ color: 'var(--foreground)' }}>Amenities</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {space.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 px-3 py-2 border rounded-xl whitespace-nowrap" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  {amenityIcon(a)}
                  <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Occupancy trend</h3>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={occupancyData} barCategoryGap="35%">
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={32}>
                  {occupancyData.map((entry, i) => (
                    <Cell key={i} fill={entry.value >= 16 ? 'var(--accent)' : 'var(--primary)'} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-4 border" style={{ background: 'color-mix(in srgb, var(--primary) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                <BrainCircuit className="w-4 h-4" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--foreground)' }}>AI Insight</h4>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  Historically quietest 10am–12pm on Fridays. Best for deep-focus work.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold mb-5 text-center uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>
              Study Session
            </h3>
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-6">
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
                <div className="text-[22px] sm:text-[28px] font-semibold tabular-nums tracking-tight" style={{ color: 'var(--foreground)' }}>
                  {formatTime(sessionTime)}
                </div>
                <div className="text-[11px] sm:text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {sessionActive ? 'In session' : 'Not started'}
                </div>
              </div>
            </div>
            {!sessionActive ? (
              <button
                onClick={() => setSessionActive(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] shadow-sm transition-colors"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Play className="w-4 h-4" strokeWidth={2} />
                Start Session
              </button>
            ) : (
              <button
                onClick={() => { setSessionActive(false); setSessionTime(0); }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 rounded-xl font-semibold text-[14px] transition-colors"
                style={{ background: 'var(--card)', color: 'var(--destructive)', borderColor: 'var(--destructive)' }}
              >
                <Square className="w-4 h-4" strokeWidth={2} />
                End Session
              </button>
            )}
          </div>

          <div className="rounded-2xl p-4 border flex items-center gap-3" style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--warning) 20%, transparent)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--warning) 15%, transparent)' }}>
              <Coins className="w-4 h-4" style={{ color: 'var(--warning)' }} strokeWidth={1.8} />
            </div>
            <p className="text-[13px]" style={{ color: 'var(--foreground)' }}>
              Check in earns <strong className="font-semibold" style={{ color: 'var(--warning)' }}>5 SOL tokens</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
