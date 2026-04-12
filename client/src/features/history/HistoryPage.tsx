import { useState, useEffect } from 'react';
import { fetchDevices } from '../../api/devices';
import { useHistory } from './useHistory';
import { useSites } from '../../shared/hooks/useSites';
import HistoryChart from './HistoryChart';
import HistoryTable from './HistoryTable';
import StatCard from '../../shared/components/StatCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import type { Device, HistoryParams } from './types';

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

export default function HistoryPage() {
  const now = Math.floor(Date.now() / 1000);
  const [from, setFrom] = useState(now - 86400);
  const [to, setTo] = useState(now);
  const [siteId, setSiteId] = useState('');
  const [apId, setApId] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const { sites } = useSites();

  useEffect(() => {
    setApId(''); // reset AP when site changes
    fetchDevices(siteId || undefined).then(setDevices).catch(() => {});
  }, [siteId]);

  const params: HistoryParams = { from, to, ap_id: apId || undefined, site_id: siteId || undefined };
  const { data, loading, error } = useHistory(params);

  const latestWireless = data.at(-1)?.client_count ?? 0;
  const latestWired = data.at(-1)?.wired_client_count ?? 0;
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Client History</h1>
        <div className="flex gap-3">
          <StatCard label="Wireless Clients" value={latestWireless} />
          <StatCard label="Wired Clients" value={latestWired} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 bg-white border rounded-lg p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Site
          <select
            className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-45"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Access Point
          <select
            className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[200px]"
            value={apId}
            onChange={(e) => setApId(e.target.value)}
          >
            <option value="">All (Site-wide)</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          From
          <input
            type="datetime-local"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            value={toDatetimeLocal(from)}
            onChange={(e) => setFrom(fromDatetimeLocal(e.target.value))}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          To
          <input
            type="datetime-local"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            value={toDatetimeLocal(to)}
            onChange={(e) => setTo(fromDatetimeLocal(e.target.value))}
          />
        </label>
      </div>

      {/* Content */}
      {error && <ErrorBanner message={error} />}
      {loading && data.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <HistoryChart data={data} />
          </div>

          {/* Collapsible data table */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setTableOpen((v) => !v)}
            >
              <span>Data Table ({data.length} points)</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform${tableOpen ? ' rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {tableOpen && <HistoryTable data={data} />}
          </div>
        </div>
      )}
    </div>
  );
}
