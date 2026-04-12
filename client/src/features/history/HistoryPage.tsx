import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useHistory } from './useHistory';
import { useHeatmapTimeline } from '../heatmap/useHeatmapTimeline';
import { useSites } from '../../shared/hooks/useSites';
import HistoryChart from './HistoryChart';
import HistoryTable from './HistoryTable';
import FloorPlanMap, { LEVELS } from '../heatmap/FloorPlanMap';
import type { Building } from '../heatmap/FloorPlanMap';
import StatCard from '../../shared/components/StatCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { formatEpochFull } from '../../shared/utils/formatters';
import type { HistoryParams } from './types';

/** Convert epoch seconds to the value expected by <input type="datetime-local"> */
function toDatetimeLocal(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Parse a datetime-local string back to epoch seconds */
function fromDatetimeLocal(s: string): number {
  return Math.floor(new Date(s).getTime() / 1000);
}

type ViewMode = 'chart' | 'heatmap';

/**
 * Filter epochs to only those where at least one AP has clients.
 * This keeps the scrubber dense with real activity — no dead frames.
 */
function filterActiveEpochs(
  rawEpochs: number[],
  apsByEpoch: Map<number, import('../heatmap/types').ApRecord[]>,
): number[] {
  return rawEpochs.filter((epoch) => {
    const aps = apsByEpoch.get(epoch);
    if (!aps || aps.length === 0) return false;
    return aps.some((ap) => ap.clientCount + ap.wiredCount > 0);
  });
}

export default function HistoryPage() {
  const now = Math.floor(Date.now() / 1000);
  const [from, setFrom] = useState(now - 86400);
  const [to, setTo] = useState(now);
  const [siteId, setSiteId] = useState('');
  const { sites } = useSites();

  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [tableOpen, setTableOpen] = useState(false);

  // ── Heatmap-specific state ──
  const [building, setBuilding] = useState<Building>('HE');
  const [level, setLevel] = useState<string>(LEVELS['HE'][0]);
  const [scrubIndex, setScrubIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data hooks ──
  const params: HistoryParams = { from, to, site_id: siteId || undefined };
  const { data, loading, error } = useHistory(params);

  const { epochs: rawEpochs, apsByEpoch, loading: timelineLoading, error: timelineError } =
    useHeatmapTimeline(
      viewMode === 'heatmap' ? from : 0,
      viewMode === 'heatmap' ? to : 0,
      siteId || undefined,
    );

  // ── Only epochs with actual client activity ──
  const activeEpochs = useMemo(
    () => filterActiveEpochs(rawEpochs, apsByEpoch),
    [rawEpochs, apsByEpoch],
  );

  const clampedIndex = Math.min(scrubIndex, Math.max(0, activeEpochs.length - 1));
  const currentEpoch = activeEpochs[clampedIndex] ?? from;

  const displayAps = useMemo(
    () => apsByEpoch.get(currentEpoch) ?? [],
    [currentEpoch, apsByEpoch],
  );

  const displayWireless = displayAps.reduce((s, ap) => s + ap.clientCount, 0);
  const displayWired = displayAps.reduce((s, ap) => s + ap.wiredCount, 0);

  // ── Chart stats ──
  const latestWireless = data.at(-1)?.client_count ?? 0;
  const latestWired = data.at(-1)?.wired_client_count ?? 0;

  // ── Site detection for floor plan ──
  const selectedSite = sites.find((s) => s.id === siteId);
  const JAC_PATTERN = /jac|herzberg|library|john\s*abbott/i;
  const isJac = siteId !== '' && JAC_PATTERN.test(selectedSite?.name ?? '');
  const siteHasFloorPlan = siteId === '' || isJac;

  function handleBuildingChange(b: Building) {
    setBuilding(b);
    setLevel(b !== '' ? LEVELS[b as 'HE' | 'LI'][0] : '');
  }

  // ── Playback ──
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playRef.current) { clearInterval(playRef.current); playRef.current = null; }
  }, []);

  const startPlayback = useCallback(() => {
    stopPlayback();
    setIsPlaying(true);
    playRef.current = setInterval(() => {
      setScrubIndex((prev) => {
        const next = prev + 1;
        if (next >= activeEpochs.length) {
          stopPlayback();
          return prev;
        }
        return next;
      });
    }, 200);
  }, [activeEpochs.length, stopPlayback]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  }, [isPlaying, startPlayback, stopPlayback]);

  // Stop playback on unmount or view switch
  useEffect(() => () => { if (playRef.current) clearInterval(playRef.current); }, []);
  useEffect(() => { stopPlayback(); setScrubIndex(0); }, [viewMode, from, to, siteId, stopPlayback]);

  // ── Scrubber pointer handling ──
  const trackRef = useRef<HTMLDivElement>(null);
  const indexFromX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track || activeEpochs.length === 0) return 0;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return Math.round(ratio * (activeEpochs.length - 1));
  }, [activeEpochs]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    stopPlayback();
    setScrubIndex(indexFromX(e.clientX));
  }, [indexFromX, stopPlayback]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    setScrubIndex(indexFromX(e.clientX));
  }, [indexFromX]);

  const progress = activeEpochs.length > 1 ? clampedIndex / (activeEpochs.length - 1) : 0;

  // Input style helper
  const inputStyle = { border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' };

  return (
    <div className="space-y-6">

      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            Client History
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {viewMode === 'chart' ? 'Connection trends over time' : 'Occupancy playback on floor plan'}
          </p>
        </div>

        {/* View mode toggle */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {(['chart', 'heatmap'] as const).map((mode) => (
            <button
              key={mode}
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer"
              style={{
                background: viewMode === mode ? 'var(--primary)' : 'transparent',
                color: viewMode === mode ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'chart' ? 'Chart' : 'Heatmap'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Wireless Clients"
          value={viewMode === 'chart' ? latestWireless : displayWireless}
        />
        <StatCard
          label="Wired Clients"
          value={viewMode === 'chart' ? latestWired : displayWired}
        />
        <StatCard
          label="Total Clients"
          value={viewMode === 'chart' ? latestWireless + latestWired : displayWireless + displayWired}
        />
        <StatCard
          label="Data Points"
          value={viewMode === 'chart' ? data.length : activeEpochs.length}
        />
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-end gap-4 rounded-xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Site
          <select
            className="rounded-lg px-2 py-1.5 text-sm min-w-45"
            style={inputStyle}
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          From
          <input
            type="datetime-local"
            className="rounded-lg px-2 py-1.5 text-sm"
            style={inputStyle}
            value={toDatetimeLocal(from)}
            onChange={(e) => setFrom(fromDatetimeLocal(e.target.value))}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          To
          <input
            type="datetime-local"
            className="rounded-lg px-2 py-1.5 text-sm"
            style={inputStyle}
            value={toDatetimeLocal(to)}
            onChange={(e) => setTo(fromDatetimeLocal(e.target.value))}
          />
        </label>

        {/* Building / Level — only for heatmap view */}
        {viewMode === 'heatmap' && (
          <>
            <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Building
              <select
                className="rounded-lg px-2 py-1.5 text-sm min-w-40"
                style={inputStyle}
                value={building}
                onChange={(e) => handleBuildingChange(e.target.value as Building)}
              >
                <option value="">— Select —</option>
                <option value="HE">HE — Herzberg</option>
                <option value="LI">LI — Library</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Level
              <select
                className="rounded-lg px-2 py-1.5 text-sm min-w-36"
                style={inputStyle}
                value={level}
                disabled={building === ''}
                onChange={(e) => setLevel(e.target.value)}
              >
                {building !== '' && LEVELS[building as 'HE' | 'LI'].map((l) => (
                  <option key={l} value={l}>
                    {l === 'M' ? 'Mezzanine' : `Floor ${l}`}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {/* ── Errors ─────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} />}
      {timelineError && <ErrorBanner message={timelineError} />}

      {/* ── Chart view ─────────────────────────────────────────────── */}
      {viewMode === 'chart' && (
        loading && data.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <HistoryChart data={data} />
            </div>

            {/* Collapsible data table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
                style={{ color: 'var(--foreground)' }}
                onClick={() => setTableOpen((v) => !v)}
              >
                <span>Data Table ({data.length} points)</span>
                <svg
                  className={`w-4 h-4 transition-transform${tableOpen ? ' rotate-180' : ''}`}
                  style={{ color: 'var(--muted-foreground)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {tableOpen && <HistoryTable data={data} />}
            </div>
          </div>
        )
      )}

      {/* ── Heatmap view ───────────────────────────────────────────── */}
      {viewMode === 'heatmap' && (
        <div className="space-y-4">
          {/* Timeline scrubber */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {/* Scrubber header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play / Pause */}
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  onClick={togglePlayback}
                  disabled={activeEpochs.length === 0}
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
                    </svg>
                  )}
                </button>
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Scrub through occupancy — only active snapshots
                </span>
              </div>
              {activeEpochs.length > 0 && (
                <span
                  className="font-medium text-sm px-3 py-1 rounded-full"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--primary)' }}
                >
                  {formatEpochFull(currentEpoch)}
                </span>
              )}
            </div>

            {/* Scrubber track */}
            {timelineLoading && activeEpochs.length === 0 ? (
              <div className="flex items-center justify-center h-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Loading snapshots...
              </div>
            ) : activeEpochs.length === 0 ? (
              <div className="flex items-center justify-center h-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No snapshots in this range
              </div>
            ) : (
              <div className="select-none">
                <div
                  ref={trackRef}
                  className="relative h-10 cursor-pointer"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                >
                  {/* Base track */}
                  <div className="absolute top-4 left-0 right-0 h-2 rounded-full" style={{ background: 'var(--border)' }} />
                  {/* Filled portion */}
                  <div
                    className="absolute top-4 left-0 h-2 rounded-full pointer-events-none transition-[width] duration-150"
                    style={{ width: `${progress * 100}%`, background: 'var(--primary-light)' }}
                  />
                  {/* Handle */}
                  <div
                    className="absolute top-2 w-6 h-6 rounded-full shadow-md pointer-events-none transition-[left] duration-150"
                    style={{
                      left: `${progress * 100}%`,
                      transform: 'translateX(-50%)',
                      background: 'var(--card)',
                      border: '2.5px solid var(--primary)',
                    }}
                  />
                </div>
                {/* Labels */}
                <div className="flex items-center justify-between text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  <span>{formatEpochFull(activeEpochs[0])}</span>
                  <span>{clampedIndex + 1} / {activeEpochs.length} snapshots</span>
                  <span>{formatEpochFull(activeEpochs[activeEpochs.length - 1])}</span>
                </div>
              </div>
            )}
          </div>

          {/* Floor plan */}
          <FloorPlanMap
            liveAPs={siteHasFloorPlan ? displayAps : []}
            siteHasFloorPlan={siteHasFloorPlan}
            building={building}
            level={level}
            sites={sites}
            siteId={siteId}
            onSiteChange={setSiteId}
            onBuildingChange={handleBuildingChange}
            onLevelChange={setLevel}
            totalWireless={displayWireless}
            totalWired={displayWired}
            timelineMode={true}
            onTimelineModeChange={() => {}}
            timelineEpochs={[]}
            timelineScrubIndex={0}
            onTimelineScrubChange={() => {}}
            timelineLoading={false}
            timeFrom={from}
            timeTo={to}
            onTimeFromChange={() => {}}
            onTimeToChange={() => {}}
            hideFilters
            hideTimeline
          />
        </div>
      )}
    </div>
  );
}
