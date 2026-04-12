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

export default function HistoryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm py-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
        No data for selected range.
      </p>
    );
  }

  const chartData = useMemo<ChartPoint[]>(
    () =>
      data.map((d) => ({
        epoch: d.epoch,
        wireless: d.client_count,
        wired: d.wired_client_count ?? 0,
        total: d.client_count + (d.wired_client_count ?? 0),
      })),
    [data],
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
          domain={[0, 'dataMax']}
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
