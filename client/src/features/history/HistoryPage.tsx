import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useHistory } from './useHistory';
import { useHeatmapTimeline } from '../heatmap/useHeatmapTimeline';
import { useSites } from '../../shared/hooks/useSites';
import { Calendar, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HistoryChart from './HistoryChart';
import HistoryTable from './HistoryTable';
import FloorPlanMap, { LEVELS } from '../heatmap/FloorPlanMap';
import type { Building } from '../heatmap/FloorPlanMap';
import StatCard from '../../shared/components/StatCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { formatEpochFull } from '../../shared/utils/formatters';
import type { HistoryParams } from './types';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Convert epoch seconds to date string YYYY-MM-DD */
function toDateStr(epoch: number): string {
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Convert epoch to 12h time parts */
function toTimeParts(epoch: number): { h: number; m: number; ampm: 'AM' | 'PM' } {
  const d = new Date(epoch * 1000);
  const hours24 = d.getHours();
  return {
    h: hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24,
    m: d.getMinutes(),
    ampm: hours24 >= 12 ? 'PM' : 'AM',
  };
}

/** Combine date string + 12h time parts into epoch seconds */
function fromParts(dateStr: string, h: number, m: number, ampm: 'AM' | 'PM'): number {
  let h24 = h % 12;
  if (ampm === 'PM') h24 += 12;
  return Math.floor(new Date(`${dateStr}T${pad2(h24)}:${pad2(m)}`).getTime() / 1000);
}

const JAC_PATTERN = /jac|herzberg|library|john\s*abbott/i;

type TimePreset = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

const TIME_PRESETS: { key: TimePreset; label: string; seconds: number }[] = [
  { key: '1h', label: '1 Hour', seconds: 3600 },
  { key: '6h', label: '6 Hours', seconds: 21600 },
  { key: '24h', label: '24 Hours', seconds: 86400 },
  { key: '7d', label: '7 Days', seconds: 604800 },
  { key: '30d', label: '30 Days', seconds: 2592000 },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);   // 1–12
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

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

  /* Applied (active) filter state */
  const [from, setFrom] = useState(now - 86400);
  const [to, setTo] = useState(now);
  const [siteId, setSiteId] = useState('');
  const { sites } = useSites();

  /* Staged (draft) filter state — only applied on button click or preset */
  const initFrom = toTimeParts(now - 86400);
  const initTo = toTimeParts(now);
  const [stagedFromDate, setStagedFromDate] = useState(toDateStr(now - 86400));
  const [stagedFromH, setStagedFromH] = useState(initFrom.h);
  const [stagedFromM, setStagedFromM] = useState(initFrom.m);
  const [stagedFromAP, setStagedFromAP] = useState<'AM' | 'PM'>(initFrom.ampm);
  const [stagedToDate, setStagedToDate] = useState(toDateStr(now));
  const [stagedToH, setStagedToH] = useState(initTo.h);
  const [stagedToM, setStagedToM] = useState(initTo.m);
  const [stagedToAP, setStagedToAP] = useState<'AM' | 'PM'>(initTo.ampm);
  const [activePreset, setActivePreset] = useState<TimePreset>('24h');
  const [justApplied, setJustApplied] = useState(false);

  /* Default to JAC Campus site when sites load */
  const [siteDefaulted, setSiteDefaulted] = useState(false);
  useEffect(() => {
    if (!siteDefaulted && sites.length > 0) {
      const jacSite = sites.find((s) => JAC_PATTERN.test(s.name));
      if (jacSite) setSiteId(jacSite.id);
      setSiteDefaulted(true);
    }
  }, [sites, siteDefaulted]);

  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [tableOpen, setTableOpen] = useState(false);

  // ── Heatmap-specific state ──
  const [building, setBuilding] = useState<Building>('HE');
  const [level, setLevel] = useState<string>(LEVELS['HE'][0]);
  const [scrubIndex, setScrubIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data hooks ──
  const rangeSeconds = to - from;
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
  const isJac = siteId !== '' && JAC_PATTERN.test(selectedSite?.name ?? '');
  const siteHasFloorPlan = siteId === '' || isJac;

  /** Check if staged values differ from applied values */
  const stagedFromEpoch = fromParts(stagedFromDate, stagedFromH, stagedFromM, stagedFromAP);
  const stagedToEpoch = fromParts(stagedToDate, stagedToH, stagedToM, stagedToAP);
  const isDirty = activePreset === 'custom' && (stagedFromEpoch !== from || stagedToEpoch !== to);

  /** Apply a time preset */
  function applyPreset(preset: TimePreset) {
    const n = Math.floor(Date.now() / 1000);
    const range = TIME_PRESETS.find((p) => p.key === preset);
    if (!range) return;
    const newFrom = n - range.seconds;
    const newTo = n;
    const fp = toTimeParts(newFrom);
    const tp = toTimeParts(newTo);
    setActivePreset(preset);
    setStagedFromDate(toDateStr(newFrom));
    setStagedFromH(fp.h); setStagedFromM(fp.m); setStagedFromAP(fp.ampm);
    setStagedToDate(toDateStr(newTo));
    setStagedToH(tp.h); setStagedToM(tp.m); setStagedToAP(tp.ampm);
    setFrom(newFrom);
    setTo(newTo);
    flashApplied();
  }

  /** Apply staged date/time to active filters */
  function applyDateRange() {
    setFrom(stagedFromEpoch);
    setTo(stagedToEpoch);
    setActivePreset('custom');
    flashApplied();
  }

  function flashApplied() {
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 1800);
  }

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
          setScrubIndex(0);
          return 0;
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
        className="rounded-xl p-4 sm:p-5 space-y-4 sm:space-y-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Row 1: Site selector + Quick presets */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
            Site
            <select
              className="rounded-xl px-3 py-2 text-sm font-normal normal-case w-full sm:min-w-48"
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

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>Quick Range</span>
            <div className="flex rounded-xl p-1 gap-1 overflow-x-auto" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.key}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0"
                  style={{
                    background: activePreset === p.key ? 'var(--primary)' : 'transparent',
                    color: activePreset === p.key ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    boxShadow: activePreset === p.key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                  }}
                  onClick={() => applyPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Custom date range */}
        <div
          className="rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {/* ── From ── */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
              <Calendar className="size-3" /> From
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer min-w-0 flex-1 sm:flex-none"
                style={inputStyle}
                value={stagedFromDate}
                onChange={(e) => { setStagedFromDate(e.target.value); setActivePreset('custom'); }}
              />
              <select
                className="rounded-xl px-1 py-2 text-sm font-medium text-center w-13"
                style={inputStyle}
                value={stagedFromH}
                onChange={(e) => { setStagedFromH(Number(e.target.value)); setActivePreset('custom'); }}
              >
                {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>:</span>
              <select
                className="rounded-xl px-1 py-2 text-sm font-medium text-center w-14"
                style={inputStyle}
                value={stagedFromM}
                onChange={(e) => { setStagedFromM(Number(e.target.value)); setActivePreset('custom'); }}
              >
                {MINUTES.map((m) => <option key={m} value={m}>{pad2(m)}</option>)}
              </select>
              <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
                {(['AM', 'PM'] as const).map((v) => (
                  <button
                    key={v}
                    className="px-2 py-2 text-xs font-bold cursor-pointer transition-colors"
                    style={{
                      background: stagedFromAP === v ? 'var(--primary)' : 'var(--input-background)',
                      color: stagedFromAP === v ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      border: 'none',
                    }}
                    onClick={() => { setStagedFromAP(v); setActivePreset('custom'); }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Arrow separator — horizontal on desktop, vertical on mobile */}
          <div className="hidden sm:flex flex-col items-center gap-1.5 mx-3">
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>to</span>
            <ArrowRight className="size-5" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div className="flex sm:hidden items-center justify-center gap-2 py-1" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs font-medium tracking-wide uppercase">to</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* ── To ── */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
              <Calendar className="size-3" /> End
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer min-w-0 flex-1 sm:flex-none"
                style={inputStyle}
                value={stagedToDate}
                onChange={(e) => { setStagedToDate(e.target.value); setActivePreset('custom'); }}
              />
              <select
                className="rounded-xl px-1 py-2 text-sm font-medium text-center w-13"
                style={inputStyle}
                value={stagedToH}
                onChange={(e) => { setStagedToH(Number(e.target.value)); setActivePreset('custom'); }}
              >
                {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>:</span>
              <select
                className="rounded-xl px-1 py-2 text-sm font-medium text-center w-14"
                style={inputStyle}
                value={stagedToM}
                onChange={(e) => { setStagedToM(Number(e.target.value)); setActivePreset('custom'); }}
              >
                {MINUTES.map((m) => <option key={m} value={m}>{pad2(m)}</option>)}
              </select>
              <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
                {(['AM', 'PM'] as const).map((v) => (
                  <button
                    key={v}
                    className="px-2 py-2 text-xs font-bold cursor-pointer transition-colors"
                    style={{
                      background: stagedToAP === v ? 'var(--primary)' : 'var(--input-background)',
                      color: stagedToAP === v ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      border: 'none',
                    }}
                    onClick={() => { setStagedToAP(v); setActivePreset('custom'); }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Apply button + inline unsaved indicator */}
          <div className="flex items-center gap-2 sm:self-end sm:pb-0.5 pt-1 sm:pt-0">
            <motion.button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold cursor-pointer relative overflow-hidden"
              style={{
                background: justApplied ? 'var(--status-low)' : 'var(--primary)',
                color: justApplied ? '#fff' : 'var(--primary-foreground)',
                border: 'none',
                boxShadow: isDirty ? '0 0 0 2px var(--primary), 0 2px 8px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.1)',
              }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={applyDateRange}
            >
              <AnimatePresence mode="wait">
                {justApplied ? (
                  <motion.span
                    key="applied"
                    className="flex items-center gap-1.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="size-4" />
                    Applied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="apply"
                    className="flex items-center gap-1.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="size-4" />
                    Apply
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <AnimatePresence>
              {isDirty && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: 'var(--primary)' }}
                >
                  Unsaved changes
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Building / Level — only for heatmap view */}
        {viewMode === 'heatmap' && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="flex flex-col gap-1.5 text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Building
              <select
                className="rounded-xl px-3 py-2 text-sm font-normal normal-case w-full sm:min-w-40"
                style={inputStyle}
                value={building}
                onChange={(e) => handleBuildingChange(e.target.value as Building)}
              >
                <option value="">-- Select --</option>
                <option value="HE">HE -- Herzberg</option>
                <option value="LI">LI -- Library</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Level
              <select
                className="rounded-xl px-3 py-2 text-sm font-normal normal-case w-full sm:min-w-36"
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
          </div>
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
            <div className="rounded-xl p-2 sm:p-4 min-w-0" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <HistoryChart data={data} rangeSeconds={rangeSeconds} />
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
