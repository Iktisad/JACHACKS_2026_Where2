import { Link } from 'react-router-dom';
import { Wifi, Zap, Volume2, Sun, ChevronRight, Navigation2, type LucideProps } from 'lucide-react';
import { motion } from 'motion/react';

interface Space {
  id: number;
  name: string;
  building: string;
  occupancy: number;
  capacity: number;
  status: 'low' | 'moderate' | 'high';
  floor: string;
  distance: string;
  noiseLevel: string;
  amenities: string[];
}

interface SpaceCardProps {
  space: Space;
  compact?: boolean;
}

type LucideIcon = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

const amenityIcons: Record<string, LucideIcon> = {
  wifi: Wifi,
  outlets: Zap,
  quiet: Volume2,
  'natural-light': Sun,
};

const amenityLabel: Record<string, string> = {
  wifi: 'Wi-Fi',
  outlets: 'Outlets',
  quiet: 'Quiet',
  'natural-light': 'Natural light',
};

const statusConfig = {
  low: {
    dot: 'bg-[var(--status-low)]',
    bar: 'bg-[var(--status-low)]',
    badge: 'bg-[var(--status-low-bg)] text-[var(--status-low)] border-[var(--status-low-border)]',
    label: 'Available',
  },
  moderate: {
    dot: 'bg-[var(--status-moderate)]',
    bar: 'bg-[var(--status-moderate)]',
    badge: 'bg-[var(--status-moderate-bg)] text-[var(--status-moderate)] border-[var(--status-moderate-border)]',
    label: 'Moderate',
  },
  high: {
    dot: 'bg-[var(--status-high)]',
    bar: 'bg-[var(--status-high)]',
    badge: 'bg-[var(--status-high-bg)] text-[var(--status-high)] border-[var(--status-high-border)]',
    label: 'Busy',
  },
};

export function SpaceCard({ space, compact = false }: SpaceCardProps) {
  const s = statusConfig[space.status];
  const pct = (space.occupancy / space.capacity) * 100;

  if (compact) {
    return (
      <Link to={`/student/space/${space.id}`}>
        <motion.div
          whileTap={{ scale: 0.985 }}
          className="rounded-2xl border hover:border-muted-foreground/25 transition-colors p-4 shadow-sm"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[14px] leading-snug truncate" style={{ color: 'var(--foreground)' }}>
                    {space.name}
                  </h3>
                  <p className="text-[12px] mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    <Navigation2 className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    {space.distance}
                    <span style={{ color: 'var(--border)' }}>·</span>
                    {space.floor}
                  </p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${s.badge}`}>
                  {s.label}
                </span>
              </div>
              <div className="mt-2.5 mb-2">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className={`h-full rounded-full ${s.bar}`}
                  />
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {pct.toFixed(0)}% occupied
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {space.amenities.slice(0, 4).map((amenity) => {
                  const Icon = amenityIcons[amenity];
                  return Icon ? (
                    <div key={amenity} title={amenityLabel[amenity]} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                      <Icon className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
                    </div>
                  ) : null;
                })}
                {space.amenities.length > 4 && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-medium" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    +{space.amenities.length - 4}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 ml-1" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 60%, transparent)' }} strokeWidth={1.5} />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/student/space/${space.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="rounded-2xl border hover:shadow-md transition-all p-5 shadow-sm"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
              <h3 className="text-base font-semibold leading-snug truncate" style={{ color: 'var(--foreground)' }}>{space.name}</h3>
            </div>
            <p className="text-[13px] ml-4.5" style={{ color: 'var(--muted-foreground)' }}>
              {space.building} · {space.floor}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.badge}`}>
              {s.label}
            </span>
            <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
              <Navigation2 className="w-3 h-3" strokeWidth={1.5} />
              {space.distance}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span style={{ color: 'var(--muted-foreground)' }}>Occupancy</span>
            <span className="font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${s.bar}`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {space.amenities.slice(0, 5).map((amenity) => {
              const Icon = amenityIcons[amenity];
              return Icon ? (
                <div key={amenity} title={amenityLabel[amenity]} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
                </div>
              ) : null;
            })}
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
            <Volume2 className="w-3.5 h-3.5" strokeWidth={1.7} />
            {space.noiseLevel}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
