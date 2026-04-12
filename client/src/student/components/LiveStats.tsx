import { motion } from 'motion/react';
import { TrendingDown, TrendingUp, Users, Clock } from 'lucide-react';

const SPACES = [
  { status: 'low',      occupancy: 3,  capacity: 20 },
  { status: 'moderate', occupancy: 28, capacity: 35 },
  { status: 'low',      occupancy: 8,  capacity: 25 },
  { status: 'high',     occupancy: 22, capacity: 25 },
  { status: 'low',      occupancy: 10, capacity: 30 },
  { status: 'moderate', occupancy: 15, capacity: 30 },
];

const totalOccupancy  = SPACES.reduce((s, r) => s + r.occupancy, 0);
const totalCapacity   = SPACES.reduce((s, r) => s + r.capacity, 0);
const availableSpaces = SPACES.filter((s) => s.status !== 'high').length;
const capacityPct     = Math.round((totalOccupancy / totalCapacity) * 100);

function CapacityBar({ pct }: { pct: number }) {
  const color = pct < 60 ? 'bg-[var(--status-low)]' : pct < 80 ? 'bg-[var(--status-moderate)]' : 'bg-[var(--status-high)]';
  return (
    <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: 'var(--border)' }}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

export function LiveStats({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
          Live stats
        </p>
        <div className="flex gap-2.5 min-w-max">
          <div className="flex-1 min-w-[88px] p-3 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: 'var(--foreground)' }}>
                {availableSpaces}
              </span>
              <TrendingUp className="w-3 h-3 mb-0.5" style={{ color: 'var(--status-low)' }} strokeWidth={2} />
            </div>
            <p className="text-[11px] mt-1 leading-none" style={{ color: 'var(--muted-foreground)' }}>Available</p>
          </div>

          <div className="flex-1 min-w-[88px] p-3 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: 'var(--foreground)' }}>
                {capacityPct}%
              </span>
              {capacityPct >= 75
                ? <TrendingUp className="w-3 h-3 mb-0.5" style={{ color: 'var(--status-moderate)' }} strokeWidth={2} />
                : <TrendingDown className="w-3 h-3 mb-0.5" style={{ color: 'var(--status-low)' }} strokeWidth={2} />
              }
            </div>
            <CapacityBar pct={capacityPct} />
            <p className="text-[11px] mt-1.5 leading-none" style={{ color: 'var(--muted-foreground)' }}>Capacity</p>
          </div>

          <div className="flex-1 min-w-[88px] p-3 rounded-xl border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
            <div className="text-[18px] font-semibold leading-none" style={{ color: 'var(--foreground)' }}>2–4 pm</div>
            <p className="text-[11px] mt-1.5 leading-none" style={{ color: 'var(--muted-foreground)' }}>Peak hours</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
        Live stats
      </p>
      <div className="space-y-2">
        <div className="p-3.5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: 'var(--foreground)' }}>
              {availableSpaces}
            </div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
            </div>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>Spaces available now</p>
        </div>

        <div className="p-3.5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: 'var(--foreground)' }}>
              {capacityPct}%
            </div>
            {capacityPct >= 75
              ? <TrendingUp className="w-4 h-4" style={{ color: 'var(--status-moderate)' }} strokeWidth={2} />
              : <TrendingDown className="w-4 h-4" style={{ color: 'var(--status-low)' }} strokeWidth={2} />
            }
          </div>
          <CapacityBar pct={capacityPct} />
          <p className="text-[12px] mt-2" style={{ color: 'var(--muted-foreground)' }}>Campus capacity</p>
        </div>

        <div className="p-3.5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[18px] font-semibold" style={{ color: 'var(--foreground)' }}>2–4 pm</div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
            </div>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>Peak hours today</p>
        </div>
      </div>
    </div>
  );
}
