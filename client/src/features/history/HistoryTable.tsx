import { formatEpochFull } from '../../shared/utils/formatters';
import type { HistoryPoint } from './types';

interface Props {
  data: HistoryPoint[];
}

export default function HistoryTable({ data }: Props) {
  // Show the most recent 50 rows, newest first
  const rows = data.slice(-50).reverse();

  return (
    <div className="overflow-hidden">
      <div className="overflow-y-auto max-h-70">
        <table className="w-full text-sm">
          <thead className="sticky top-0" style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Timestamp</th>
              <th className="px-4 py-2 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}>Clients</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.epoch}
                  className="transition-colors"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td className="px-4 py-2" style={{ color: 'var(--muted-foreground)' }}>
                    {formatEpochFull(row.epoch)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium" style={{ color: 'var(--foreground)' }}>
                    {row.client_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
