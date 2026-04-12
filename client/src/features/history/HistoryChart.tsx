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
      <p className="text-gray-400 text-sm py-12 text-center">
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
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm">
                <p className="text-gray-500 text-xs mb-1">{formatEpochFull(Number(label))}</p>
                <p className="font-semibold text-gray-900">{d.total} clients</p>
                <p className="text-gray-500 text-xs">{d.wireless} wireless · {d.wired} wired</p>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="total"
          name="Clients"
          stroke="#2563eb"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
