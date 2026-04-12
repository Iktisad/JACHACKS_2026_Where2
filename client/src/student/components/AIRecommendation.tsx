import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MapPin, Users, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface Space {
  id: number;
  name: string;
  building: string;
  floor: string;
  occupancy: number;
  capacity: number;
  distance?: string;
}

interface AIRecommendationProps {
  space: Space;
  insight?: string;
  loading?: boolean;
}

export function AIRecommendation({ space, insight, loading }: AIRecommendationProps) {
  const defaultInsight =
    'Based on your past study patterns, this spot tends to be quiet right now and matches your preference for outlets and natural light.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-6"
    >
      <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: 'var(--card)', borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)' }}>
        <div className="flex items-center gap-2.5 px-5 py-3 border-b" style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)', borderColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'color-mix(in srgb, var(--primary) 70%, transparent)' }}>
            AI Recommendation
          </p>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-5 rounded-lg w-1/2" style={{ background: 'var(--muted)' }} />
              <div className="h-3.5 rounded w-full" style={{ background: 'var(--muted)' }} />
              <div className="h-3.5 rounded w-4/5" style={{ background: 'var(--muted)' }} />
              <div className="h-9 rounded-xl w-36 mt-2" style={{ background: 'var(--muted)' }} />
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold tracking-tight mb-2 leading-snug" style={{ color: 'var(--foreground)' }}>
                {space.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                  {space.building}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                  {space.capacity - space.occupancy} seats free
                </span>
                {space.distance && (
                  <span>{space.distance} away</span>
                )}
              </div>

              <div className="flex gap-2.5 rounded-xl px-3.5 py-3 mb-5 border" style={{ background: 'color-mix(in srgb, var(--muted) 50%, transparent)', borderColor: 'var(--border)' }}>
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {insight ?? defaultInsight}
                </p>
              </div>

              <Link to={`/student/space/${space.id}`}>
                <motion.span
                  whileHover={{ x: 2 }}
                  className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold px-5 py-2.5 shadow-sm transition-colors"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  Start session here
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </motion.span>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
