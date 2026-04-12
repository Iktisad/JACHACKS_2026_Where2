import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatEpoch, formatEpochFull } from '../../shared/utils/formatters';
import type { HistoryPoint } from './types';

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

  const hasWired = data.some((d) => d.wired_client_count !== undefined);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="epoch"
          tickFormatter={formatEpoch}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, 'auto']}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          labelFormatter={(label) => formatEpochFull(Number(label))}
          formatter={(value: number, name: string) => [
            value,
            name === 'client_count' ? 'Wireless' : 'Wired',
          ]}
        />
        {hasWired && <Legend formatter={(v) => v === 'client_count' ? 'Wireless' : 'Wired'} />}
        <Line
          type="monotone"
          dataKey="client_count"
          name="client_count"
          stroke="#2563eb"
          dot={false}
          strokeWidth={2}
        />
        {hasWired && (
          <Line
            type="monotone"
            dataKey="wired_client_count"
            name="wired_client_count"
            stroke="#7c3aed"
            dot={false}
            strokeWidth={2}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
