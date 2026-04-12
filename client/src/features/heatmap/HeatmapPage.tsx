import { useState } from 'react';
import { useHeatmap } from './useHeatmap';
import { useSites } from '../../shared/hooks/useSites';
import FloorPlanMap from './FloorPlanMap';
import StatCard from '../../shared/components/StatCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { formatEpochFull } from '../../shared/utils/formatters';

export default function HeatmapPage() {
  const [siteId, setSiteId] = useState('');
  const { sites } = useSites();
  const { aps, totalClients, loading, error, lastUpdated } = useHeatmap(siteId || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Occupancy Heatmap</h1>
        <StatCard label="Total Wireless Clients" value={totalClients} />
      </div>

      <div className="bg-white border rounded-lg p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && aps.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FloorPlanMap liveAPs={aps} />
      )}

      {lastUpdated && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {formatEpochFull(lastUpdated)}
        </p>
      )}
    </div>
  );
}
