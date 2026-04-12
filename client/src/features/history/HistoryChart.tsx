import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatEpoch, formatEpochFull } from '../../shared/utils/formatters';
import type { HistoryPoint } from './types';

interface ChartPoint {
  epoch: number;
  total: number;
  wireless: number;
  wired: number;
}

interface Props {
  data: HistoryPoint[];
}

const MAX_POINTS = 36;

/** Return a Y-axis ceiling that gives the data visual breathing room. */
function getYCeiling(maxVal: number): number {
  if (maxVal <= 50) return Math.ceil(maxVal * 1.6 / 10) * 10;
  if (maxVal <= 200) return Math.ceil(maxVal * 1.5 / 50) * 50;
  if (maxVal <= 500) return Math.ceil(maxVal * 1.4 / 100) * 100;
  if (maxVal <= 1000) return Math.ceil(maxVal * 1.35 / 100) * 100;
  if (maxVal <= 1500) return Math.ceil(maxVal * 1.3 / 100) * 100;
  if (maxVal <= 1800) return Math.ceil(maxVal * 1.2 / 100) * 100;
  return Math.ceil(maxVal * 1.15 / 100) * 100;
}

/** Downsample by averaging points into evenly-spaced time buckets. */
function downsample(points: ChartPoint[]): ChartPoint[] {
  if (points.length <= MAX_POINTS) return points;

  const bucketCount = MAX_POINTS;
  const minT = points[0].epoch;
  const maxT = points[points.length - 1].epoch;
  const bucketSize = (maxT - minT) / bucketCount;

  const buckets: ChartPoint[][] = Array.from({ length: bucketCount }, () => []);
  for (const p of points) {
    const idx = Math.min(Math.floor((p.epoch - minT) / bucketSize), bucketCount - 1);
    buckets[idx].push(p);
  }

  return buckets
    .filter((b) => b.length > 0)
    .map((b) => ({
      epoch: Math.round(b.reduce((s, p) => s + p.epoch, 0) / b.length),
      total: Math.round(b.reduce((s, p) => s + p.total, 0) / b.length),
      wireless: Math.round(b.reduce((s, p) => s + p.wireless, 0) / b.length),
      wired: Math.round(b.reduce((s, p) => s + p.wired, 0) / b.length),
    }));
}

export default function HistoryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm py-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
        No data for selected range.
      </p>
    );
  }

  const chartData = useMemo<ChartPoint[]>(() => {
    const mapped = data.map((d) => ({
      epoch: d.epoch,
      wireless: d.client_count,
      wired: d.wired_client_count ?? 0,
      total: d.client_count + (d.wired_client_count ?? 0),
    }));
    return downsample(mapped);
  }, [data]);

  const yMax = useMemo(
    () => getYCeiling(Math.max(...chartData.map((d) => d.total), 0)),
    [chartData],
  );

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
        <XAxis
          dataKey="epoch"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatEpoch}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, yMax]}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          labelFormatter={(label) => formatEpochFull(Number(label))}
          content={({ payload, label }) => {
            if (!payload || payload.length === 0) return null;
            const d = payload[0].payload as ChartPoint;
            return (
              <div
                className="rounded-xl shadow-sm px-3 py-2 text-sm"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{formatEpochFull(Number(label))}</p>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{d.total} clients</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{d.wireless} wireless · {d.wired} wired</p>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="total"
          name="Clients"
          stroke="var(--primary)"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
