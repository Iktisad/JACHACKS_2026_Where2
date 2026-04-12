import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Wifi,
  Cable,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  AlertTriangle,
  Zap,
  Eye,
  Clock,
} from 'lucide-react';
import { useHeatmap } from '../heatmap/useHeatmap';
import { useHistory } from '../history/useHistory';
import { formatEpoch, formatEpochFull } from '../../shared/utils/formatters';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import type { ApRecord } from '../heatmap/types';

/* ── Constants ────────────────────────────────────────────────── */

const BUILDING_NAMES: Record<string, string> = {
  HE: 'Herzberg',
  LI: 'Library',
};

const PIE_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--chart-4)', 'var(--accent-light)'];

type SortField = 'room' | 'building' | 'clientCount' | 'wiredCount' | 'total' | 'status';
type SortDir = 'asc' | 'desc';
type APViewMode = 'grid' | 'table';
type TimeRange = '1h' | '6h' | '24h' | '7d';

const TIME_RANGES: { key: TimeRange; label: string; seconds: number }[] = [
  { key: '1h', label: '1 Hour', seconds: 3600 },
  { key: '6h', label: '6 Hours', seconds: 21600 },
  { key: '24h', label: '24 Hours', seconds: 86400 },
  { key: '7d', label: '7 Days', seconds: 604800 },
];

/* ── Helpers ──────────────────────────────────────────────────── */

function getOccupancyStatus(count: number): 'low' | 'moderate' | 'high' {
  if (count <= 5) return 'low';
  if (count <= 15) return 'moderate';
  return 'high';
}

function statusColor(status: 'low' | 'moderate' | 'high') {
  return {
    low: { color: 'var(--status-low)', bg: 'var(--status-low-bg)', border: 'var(--status-low-border)', label: 'Low' },
    moderate: { color: 'var(--status-moderate)', bg: 'var(--status-moderate-bg)', border: 'var(--status-moderate-border)', label: 'Moderate' },
    high: { color: 'var(--status-high)', bg: 'var(--status-high-bg)', border: 'var(--status-high-border)', label: 'High' },
  }[status];
}

/* ── Component ────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const now = Math.floor(Date.now() / 1000);

  /* Live data */
  const { aps, totalWireless, totalWired, loading: heatmapLoading, error: heatmapError, lastUpdated } = useHeatmap();

  /* History data (for trend chart) */
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const rangeSeconds = TIME_RANGES.find((t) => t.key === timeRange)!.seconds;
  const { data: historyData, loading: historyLoading, error: historyError } = useHistory({
    from: now - rangeSeconds,
    to: now,
  });

  /* AP table state */
  const [apView, setApView] = useState<APViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('clientCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* ── Derived data ───────────────────────────────────────────── */

  const totalClients = totalWireless + totalWired;
  const totalAPs = aps.length;
  const avgPerAP = totalAPs > 0 ? (totalClients / totalAPs).toFixed(1) : '0';

  /* Building breakdown */
  const buildingStats = useMemo(() => {
    const map = new Map<string, { wireless: number; wired: number; apCount: number }>();
    for (const ap of aps) {
      const entry = map.get(ap.building) ?? { wireless: 0, wired: 0, apCount: 0 };
      entry.wireless += ap.clientCount;
      entry.wired += ap.wiredCount;
      entry.apCount += 1;
      map.set(ap.building, entry);
    }
    return Array.from(map.entries())
      .map(([building, stats]) => ({
        building,
        name: BUILDING_NAMES[building] ?? building,
        ...stats,
        total: stats.wireless + stats.wired,
      }))
      .sort((a, b) => b.total - a.total);
  }, [aps]);

  /* Pie chart data */
  const pieData = useMemo(
    () => buildingStats.map((b) => ({ name: b.name, value: b.total })),
    [buildingStats],
  );

  /* Busiest rooms */
  const busiestRooms = useMemo(
    () => [...aps].sort((a, b) => (b.clientCount + b.wiredCount) - (a.clientCount + a.wiredCount)).slice(0, 5),
    [aps],
  );

  /* Alert: rooms over threshold */
  const highOccupancyRooms = useMemo(
    () => aps.filter((ap) => getOccupancyStatus(ap.clientCount + ap.wiredCount) === 'high'),
    [aps],
  );

  /* History chart data */
  const chartData = useMemo(
    () =>
      historyData.map((d) => ({
        epoch: d.epoch,
        wireless: d.client_count,
        wired: d.wired_client_count ?? 0,
        total: d.client_count + (d.wired_client_count ?? 0),
      })),
    [historyData],
  );

  /* Trend: compare first half vs second half */
  const trend = useMemo(() => {
    if (chartData.length < 4) return { direction: 'flat' as const, pct: 0 };
    const mid = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, mid);
    const secondHalf = chartData.slice(mid);
    const avgFirst = firstHalf.reduce((s, d) => s + d.total, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, d) => s + d.total, 0) / secondHalf.length;
    if (avgFirst === 0) return { direction: 'up' as const, pct: 100 };
    const pct = Math.round(((avgSecond - avgFirst) / avgFirst) * 100);
    return { direction: pct >= 0 ? ('up' as const) : ('down' as const), pct: Math.abs(pct) };
  }, [chartData]);

  /* Peak from history */
  const peak = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, d) => (d.total > max.total ? d : max), chartData[0]);
  }, [chartData]);

  /* Filtered & sorted APs */
  const filteredAPs = useMemo(() => {
    let list = [...aps];
    if (buildingFilter !== 'all') list = list.filter((ap) => ap.building === buildingFilter);
    if (statusFilter !== 'all') list = list.filter((ap) => getOccupancyStatus(ap.clientCount + ap.wiredCount) === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ap) =>
          ap.room.includes(q) ||
          ap.building.toLowerCase().includes(q) ||
          ap.id.includes(q) ||
          (BUILDING_NAMES[ap.building] ?? '').toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'room': cmp = a.room.localeCompare(b.room); break;
        case 'building': cmp = a.building.localeCompare(b.building); break;
        case 'clientCount': cmp = a.clientCount - b.clientCount; break;
        case 'wiredCount': cmp = a.wiredCount - b.wiredCount; break;
        case 'total': cmp = (a.clientCount + a.wiredCount) - (b.clientCount + b.wiredCount); break;
        case 'status': cmp = (a.clientCount + a.wiredCount) - (b.clientCount + b.wiredCount); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [aps, buildingFilter, statusFilter, searchQuery, sortField, sortDir]);

  /* Unique buildings for filter dropdown */
  const buildings = useMemo(() => [...new Set(aps.map((ap) => ap.building))].sort(), [aps]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className="inline-block size-3 ml-1"
      style={{ color: sortField === field ? 'var(--primary)' : 'var(--muted-foreground)', opacity: sortField === field ? 1 : 0.4 }}
    />
  );

  /* ── Style helpers ──────────────────────────────────────────── */
  const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)' };
  const inputStyle = { border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' };

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Campus-wide occupancy overview
          {lastUpdated && (
            <span className="ml-2">
              &middot; Updated {formatEpochFull(lastUpdated)}
            </span>
          )}
        </p>
      </div>

      {(heatmapError || historyError) && <ErrorBanner message={heatmapError ?? historyError ?? ''} />}

      {heatmapLoading && aps.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* ── KPI Cards ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard icon={Users} label="Total Clients" value={totalClients} accent="var(--primary)" />
            <KPICard icon={Wifi} label="Wireless" value={totalWireless} accent="var(--secondary)" />
            <KPICard icon={Cable} label="Wired" value={totalWired} accent="var(--chart-4)" />
            <KPICard icon={Activity} label="Active APs" value={totalAPs} accent="var(--accent)" />
          </div>

          {/* ── Second row: Avg + Trend + Peak + Alerts ──────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat icon={Zap} label="Avg / AP" value={avgPerAP} />
            <MiniStat
              icon={trend.direction === 'up' ? TrendingUp : TrendingDown}
              label={`Trend (${timeRange})`}
              value={`${trend.direction === 'up' ? '+' : '-'}${trend.pct}%`}
              valueColor={trend.direction === 'up' ? 'var(--status-high)' : 'var(--status-low)'}
            />
            <MiniStat
              icon={Clock}
              label="Peak"
              value={peak ? `${peak.total}` : '--'}
              sub={peak ? formatEpoch(peak.epoch) : undefined}
            />
            <MiniStat
              icon={AlertTriangle}
              label="High Occupancy"
              value={highOccupancyRooms.length}
              valueColor={highOccupancyRooms.length > 0 ? 'var(--status-high)' : 'var(--status-low)'}
            />
          </div>

          {/* ── Building breakdown + Pie ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Building cards */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                <Building2 className="inline-block size-4 mr-1.5 -mt-0.5" />
                Building Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {buildingStats.map((b) => {
                  const status = getOccupancyStatus(b.total);
                  const sc = statusColor(status);
                  return (
                    <div key={b.building} className="rounded-xl p-4" style={cardStyle}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                          {b.name}
                        </span>
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{b.total}</div>
                          <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Total</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold" style={{ color: 'var(--secondary)' }}>{b.wireless}</div>
                          <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Wireless</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold" style={{ color: 'var(--chart-4)' }}>{b.wired}</div>
                          <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Wired</div>
                        </div>
                      </div>
                      <div className="mt-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {b.apCount} access points
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pie chart */}
            <div className="rounded-xl p-4" style={cardStyle}>
              <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Distribution
              </h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || payload.length === 0) return null;
                        const d = payload[0];
                        return (
                          <div className="rounded-lg shadow-sm px-3 py-2 text-sm" style={cardStyle}>
                            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                              {d.name}: {d.value} clients
                            </span>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  No data
                </div>
              )}
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--foreground)' }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Trend Chart ──────────────────────────────────── */}
          <div className="rounded-xl p-4" style={cardStyle}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                <TrendingUp className="inline-block size-4 mr-1.5 -mt-0.5" />
                Occupancy Trend
              </h2>
              {/* Time range picker */}
              <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                {TIME_RANGES.map((t) => (
                  <button
                    key={t.key}
                    className="px-3 py-1 text-[12px] font-medium rounded-md transition-all cursor-pointer"
                    style={{
                      background: timeRange === t.key ? 'var(--primary)' : 'transparent',
                      color: timeRange === t.key ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    }}
                    onClick={() => setTimeRange(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {historyLoading && chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px]"><LoadingSpinner /></div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No data for selected range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="epoch" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={formatEpoch} tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} domain={[0, 'dataMax']} tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload || payload.length === 0) return null;
                      const d = payload[0].payload as { epoch: number; total: number; wireless: number; wired: number };
                      return (
                        <div className="rounded-xl shadow-sm px-3 py-2 text-sm" style={cardStyle}>
                          <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{formatEpochFull(Number(label))}</p>
                          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{d.total} clients</p>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{d.wireless} wireless &middot; {d.wired} wired</p>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--primary)" fill="url(#gradTotal)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Busiest Rooms ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart */}
            <div className="rounded-xl p-4" style={cardStyle}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                <Eye className="inline-block size-4 mr-1.5 -mt-0.5" />
                Top 5 Busiest Rooms
              </h2>
              {busiestRooms.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={busiestRooms.map((ap) => ({ name: `${BUILDING_NAMES[ap.building] ?? ap.building} ${ap.room}`, wireless: ap.clientCount, wired: ap.wiredCount }))} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || payload.length === 0) return null;
                        const d = payload[0].payload as { name: string; wireless: number; wired: number };
                        return (
                          <div className="rounded-lg shadow-sm px-3 py-2 text-sm" style={cardStyle}>
                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>{d.name}</p>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{d.wireless} wireless &middot; {d.wired} wired</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="wireless" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="wired" stackId="a" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  No data
                </div>
              )}
            </div>

            {/* Alerts panel */}
            <div className="rounded-xl p-4" style={cardStyle}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                <AlertTriangle className="inline-block size-4 mr-1.5 -mt-0.5" style={{ color: 'var(--status-high)' }} />
                High Occupancy Alerts
              </h2>
              {highOccupancyRooms.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-[180px] text-sm rounded-xl"
                  style={{ color: 'var(--status-low)', background: 'var(--status-low-bg)', border: `1px solid var(--status-low-border)` }}
                >
                  <span className="text-2xl mb-1">All Clear</span>
                  <span className="text-xs">No rooms above high-occupancy threshold</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {highOccupancyRooms
                    .sort((a, b) => (b.clientCount + b.wiredCount) - (a.clientCount + a.wiredCount))
                    .map((ap) => {
                      const total = ap.clientCount + ap.wiredCount;
                      return (
                        <div
                          key={`${ap.id}-${ap.apId}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: 'var(--status-high-bg)', border: `1px solid var(--status-high-border)` }}
                        >
                          <div>
                            <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                              {BUILDING_NAMES[ap.building] ?? ap.building} — Room {ap.room}
                            </span>
                            <span className="text-xs ml-2" style={{ color: 'var(--muted-foreground)' }}>
                              AP {ap.apId}
                            </span>
                          </div>
                          <span className="font-bold text-sm" style={{ color: 'var(--status-high)' }}>
                            {total}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* ── AP Directory (full table/grid) ───────────────── */}
          <div className="rounded-xl" style={cardStyle}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-3">
              <h2 className="text-sm font-semibold mr-auto" style={{ color: 'var(--foreground)' }}>
                Access Point Directory
                <span className="ml-2 font-normal text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {filteredAPs.length} of {aps.length}
                </span>
              </h2>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  className="pl-8 pr-3 py-1.5 text-[12px] rounded-lg w-44"
                  style={inputStyle}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Filter toggle */}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors cursor-pointer"
                style={{
                  ...inputStyle,
                  color: filtersOpen ? 'var(--primary)' : 'var(--foreground)',
                }}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <SlidersHorizontal className="size-3.5" />
                Filters
                {filtersOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {/* View toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {(['grid', 'table'] as const).map((v) => (
                  <button
                    key={v}
                    className="px-2.5 py-1.5 cursor-pointer transition-colors"
                    style={{
                      background: apView === v ? 'var(--primary)' : 'transparent',
                      color: apView === v ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    }}
                    onClick={() => setApView(v)}
                  >
                    {v === 'grid' ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible filters */}
            {filtersOpen && (
              <div className="flex flex-wrap items-center gap-3 px-4 pb-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <label className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                  Building
                  <select
                    className="rounded-lg px-2 py-1 text-[12px]"
                    style={inputStyle}
                    value={buildingFilter}
                    onChange={(e) => setBuildingFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    {buildings.map((b) => (
                      <option key={b} value={b}>{BUILDING_NAMES[b] ?? b}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                  Status
                  <select
                    className="rounded-lg px-2 py-1 text-[12px]"
                    style={inputStyle}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </label>
                {(buildingFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                  <button
                    className="text-[11px] underline cursor-pointer"
                    style={{ color: 'var(--muted-foreground)' }}
                    onClick={() => { setBuildingFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Grid view */}
            {apView === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 pt-1">
                {filteredAPs.map((ap) => (
                  <APGridCard key={`${ap.id}-${ap.apId}`} ap={ap} />
                ))}
                {filteredAPs.length === 0 && (
                  <div className="col-span-full text-center py-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No access points match your filters
                  </div>
                )}
              </div>
            )}

            {/* Table view */}
            {apView === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[
                        { field: 'building' as SortField, label: 'Building' },
                        { field: 'room' as SortField, label: 'Room' },
                        { field: 'clientCount' as SortField, label: 'Wireless' },
                        { field: 'wiredCount' as SortField, label: 'Wired' },
                        { field: 'total' as SortField, label: 'Total' },
                        { field: 'status' as SortField, label: 'Status' },
                      ].map((col) => (
                        <th
                          key={col.field}
                          className="px-4 py-2.5 text-left font-medium cursor-pointer select-none whitespace-nowrap"
                          style={{ color: 'var(--muted-foreground)' }}
                          onClick={() => toggleSort(col.field)}
                        >
                          {col.label}
                          <SortIcon field={col.field} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAPs.map((ap) => {
                      const total = ap.clientCount + ap.wiredCount;
                      const status = getOccupancyStatus(total);
                      const sc = statusColor(status);
                      return (
                        <tr
                          key={`${ap.id}-${ap.apId}`}
                          className="transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--muted) 40%, transparent)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                          <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--foreground)' }}>
                            {BUILDING_NAMES[ap.building] ?? ap.building}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>
                            {ap.room}
                            <span className="text-[11px] ml-1.5" style={{ color: 'var(--muted-foreground)' }}>AP {ap.apId}</span>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--secondary)' }}>{ap.clientCount}</td>
                          <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--chart-4)' }}>{ap.wiredCount}</td>
                          <td className="px-4 py-2.5 font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{total}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                            >
                              {sc.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAPs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          No access points match your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function KPICard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number; accent: string }) {
  return (
    <div
      className="rounded-xl p-4 shadow-sm"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)` }}
        >
          <Icon className="size-5" style={{ color: accent }} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          <p className="text-2xl font-bold tabular-nums leading-tight" style={{ color: 'var(--foreground)' }}>{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  valueColor,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-sm"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-3.5" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
        <span className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      </div>
      <div className="font-bold text-lg tabular-nums leading-tight" style={{ color: valueColor ?? 'var(--foreground)' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>}
    </div>
  );
}

function APGridCard({ ap }: { ap: ApRecord }) {
  const total = ap.clientCount + ap.wiredCount;
  const status = getOccupancyStatus(total);
  const sc = statusColor(status);

  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--card)', border: `1px solid ${sc.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {BUILDING_NAMES[ap.building] ?? ap.building}
          </span>
          <span className="text-xs ml-1.5" style={{ color: 'var(--muted-foreground)' }}>
            Room {ap.room}
          </span>
        </div>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
        >
          {sc.label}
        </span>
      </div>
      {/* Mini bar */}
      <div className="flex items-end gap-2 mb-1.5">
        <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--foreground)' }}>{total}</span>
        <span className="text-[11px] pb-0.5" style={{ color: 'var(--muted-foreground)' }}>clients</span>
      </div>
      <div className="flex gap-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
        <span><Wifi className="inline size-3 mr-0.5 -mt-0.5" />{ap.clientCount}</span>
        <span><Cable className="inline size-3 mr-0.5 -mt-0.5" />{ap.wiredCount}</span>
        <span className="ml-auto text-[10px]">AP {ap.apId}</span>
      </div>
    </div>
  );
}
