import { BrainCircuit, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const BUILDINGS = [
  { value: 'all', label: 'Any building' },
  { value: 'Casgrain Hall', label: 'Casgrain Hall' },
  { value: 'Main Library', label: 'Main Library' },
  { value: 'Hochelaga Wing', label: 'Hochelaga Wing' },
] as const;

const ENVIRONMENTS = [
  { value: 'silent', label: 'Silent — exams, deep focus' },
  { value: 'quiet', label: 'Quiet — reading, notes' },
  { value: 'collaborative', label: 'Collaborative — groups' },
] as const;

const DURATIONS = [
  { value: 'short', label: 'Under 1 hour' },
  { value: 'medium', label: '1–2 hours' },
  { value: 'long', label: '2+ hours' },
] as const;

export type SpaceFinderFormState = {
  building: (typeof BUILDINGS)[number]['value'];
  environment: (typeof ENVIRONMENTS)[number]['value'];
  duration: (typeof DURATIONS)[number]['value'];
};

type SpaceFinderPanelProps = {
  values: SpaceFinderFormState;
  onChange: (next: SpaceFinderFormState) => void;
  onRun: () => void;
  loading: boolean;
  compact?: boolean;
};

const selectClass =
  'w-full appearance-none rounded-xl border px-3 py-2.5 pr-9 text-[13px] focus:outline-none transition-colors cursor-pointer';

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <div className="relative">
        <select
          className={selectClass}
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
      </div>
    </label>
  );
}

export function SpaceFinderPanel({
  values,
  onChange,
  onRun,
  loading,
  compact = false,
}: SpaceFinderPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className={`rounded-2xl border shadow-sm ${compact ? 'p-4' : 'p-5'}`}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
          <BrainCircuit className="w-4 h-4" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
            AI space finder
          </h2>
          <p className="text-[11px] mt-0.5 sm:mt-0" style={{ color: 'var(--muted-foreground)' }}>
            Tell us how you study — we'll pick the best spot.
          </p>
        </div>
      </div>

      <div className={compact ? 'space-y-2.5' : 'grid sm:grid-cols-4 gap-3 items-end'}>
        <SelectField
          label="Building"
          value={values.building}
          onChange={(v) => onChange({ ...values, building: v as SpaceFinderFormState['building'] })}
          options={BUILDINGS}
        />
        <SelectField
          label="Environment"
          value={values.environment}
          onChange={(v) => onChange({ ...values, environment: v as SpaceFinderFormState['environment'] })}
          options={ENVIRONMENTS}
        />
        <SelectField
          label="Session length"
          value={values.duration}
          onChange={(v) => onChange({ ...values, duration: v as SpaceFinderFormState['duration'] })}
          options={DURATIONS}
        />
        <button
          type="button"
          onClick={onRun}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold px-3 py-2 shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none w-full"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Finding…
            </>
          ) : (
            <>
              <BrainCircuit className="w-3.5 h-3.5" strokeWidth={1.8} />
              Find my space
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
