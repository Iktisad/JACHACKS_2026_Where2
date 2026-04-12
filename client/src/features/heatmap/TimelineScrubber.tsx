import { useRef, useCallback } from 'react';
import { formatEpoch, formatEpochFull } from '../../shared/utils/formatters';

interface Props {
  epochs: number[];
  scrubIndex: number;
  onChange: (index: number) => void;
  loading?: boolean;
}

/** Max tick marks to render on the track — evenly sampled if more epochs exist. */
const MAX_TICKS = 48;

export default function TimelineScrubber({ epochs, scrubIndex, onChange, loading = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const clampedIndex = Math.min(scrubIndex, epochs.length - 1);
  const currentEpoch = epochs[clampedIndex];
  const progress = epochs.length > 1 ? clampedIndex / (epochs.length - 1) : 0;

  // Convert pointer X position on the track → nearest epoch index
  const indexFromX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track || epochs.length === 0) return 0;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return Math.round(ratio * (epochs.length - 1));
  }, [epochs]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(indexFromX(e.clientX));
  }, [onChange, indexFromX]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    onChange(indexFromX(e.clientX));
  }, [onChange, indexFromX]);

  // Evenly sample tick positions to avoid overcrowding
  const tickIndices: number[] = [];
  if (epochs.length > 0) {
    const step = epochs.length <= MAX_TICKS ? 1 : Math.ceil(epochs.length / MAX_TICKS);
    for (let i = 0; i < epochs.length; i += step) tickIndices.push(i);
    if (tickIndices[tickIndices.length - 1] !== epochs.length - 1) {
      tickIndices.push(epochs.length - 1);
    }
  }

  // Pick label epochs: show ~6 evenly spaced timestamps below the track
  const labelCount = 6;
  const labelIndices: number[] = [];
  if (epochs.length > 0) {
    for (let i = 0; i < labelCount; i++) {
      labelIndices.push(Math.round((i / (labelCount - 1)) * (epochs.length - 1)));
    }
  }

  if (epochs.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-gray-400">
        {loading ? 'Loading snapshots…' : 'No snapshots in this range'}
      </div>
    );
  }

  return (
    <div className="select-none space-y-1">
      {/* Current timestamp badge */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-500">Scrub to explore historical occupancy</span>
        <span className="bg-blue-50 border border-blue-200 text-blue-800 font-medium px-2.5 py-1 rounded-full">
          {formatEpochFull(currentEpoch)}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-12 cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* Base track line */}
        <div className="absolute top-5 left-0 right-0 h-1.5 bg-gray-200 rounded-full" />

        {/* Filled portion */}
        <div
          className="absolute top-5 left-0 h-1.5 bg-blue-400 rounded-full pointer-events-none"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Tick marks */}
        {tickIndices.map((idx) => {
          const pct = epochs.length > 1 ? (idx / (epochs.length - 1)) * 100 : 0;
          const isActive = idx <= clampedIndex;
          const isCurrent = idx === clampedIndex;
          return (
            <div
              key={idx}
              className="absolute pointer-events-none"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-0.5 rounded-full transition-colors ${
                  isCurrent ? 'bg-blue-600 h-4 top-3.5' :
                  isActive  ? 'bg-blue-400 h-2.5 top-4.5' :
                              'bg-gray-300 h-2.5 top-4.5'
                } absolute`}
                style={{ top: isCurrent ? '10px' : '14px' }}
              />
            </div>
          );
        })}

        {/* Draggable handle */}
        <div
          className="absolute top-3.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md pointer-events-none transition-[left] duration-75"
          style={{ left: `${progress * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Date labels below track */}
      <div className="relative h-5">
        {labelIndices.map((idx, i) => {
          const pct = epochs.length > 1 ? (idx / (epochs.length - 1)) * 100 : 0;
          const anchor = i === 0 ? 'left' : i === labelIndices.length - 1 ? 'right' : 'center';
          return (
            <span
              key={idx}
              className="absolute text-xs text-gray-400 whitespace-nowrap"
              style={{
                left: `${pct}%`,
                transform: anchor === 'center' ? 'translateX(-50%)' :
                           anchor === 'right'  ? 'translateX(-100%)' : 'none',
              }}
            >
              {formatEpoch(epochs[idx])}
            </span>
          );
        })}
      </div>

      {/* Snapshot count */}
      <p className="text-xs text-gray-400 text-right pt-0.5">
        {clampedIndex + 1} / {epochs.length} snapshots
      </p>
    </div>
  );
}
