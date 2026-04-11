import { formatEpochFull } from '../../shared/utils/formatters';
import type { HistoryPoint } from './types';

interface Props {
  data: HistoryPoint[];
}

export default function HistoryTable({ data }: Props) {
  // Show the most recent 50 rows, newest first
  const rows = data.slice(-50).reverse();

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-y-auto max-h-70">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Timestamp</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Clients</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.epoch}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 text-gray-700">
                    {formatEpochFull(row.epoch)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
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
