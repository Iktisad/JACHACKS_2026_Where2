import { useState } from 'react';
import { useHistory } from './useHistory';
import { useSites } from '../../shared/hooks/useSites';
import HistoryChart from './HistoryChart';
import HistoryTable from './HistoryTable';
import StatCard from '../../shared/components/StatCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
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

export default function HistoryPage() {
  const now = Math.floor(Date.now() / 1000);
  const [from, setFrom] = useState(now - 86400);
  const [to, setTo] = useState(now);
  const [siteId, setSiteId] = useState('');
  const { sites } = useSites();

  const params: HistoryParams = { from, to, site_id: siteId || undefined };
  const { data, loading, error } = useHistory(params);

  const latestWireless = data.at(-1)?.client_count ?? 0;
  const latestWired = data.at(-1)?.wired_client_count ?? 0;
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Client History</h1>
        <div className="flex gap-3">
          <StatCard label="Wireless Clients" value={latestWireless} />
          <StatCard label="Wired Clients" value={latestWired} />
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-end gap-4 rounded-xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Site
          <select
            className="rounded-lg px-2 py-1.5 text-sm min-w-45"
            style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
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
            style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
            value={toDatetimeLocal(from)}
            onChange={(e) => setFrom(fromDatetimeLocal(e.target.value))}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          To
          <input
            type="datetime-local"
            className="rounded-lg px-2 py-1.5 text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
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
      )}
    </div>
  );
}
