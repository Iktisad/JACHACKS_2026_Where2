import { useHeatmap } from './useHeatmap';
import FloorPlanMap from './FloorPlanMap';
import StatCard from '../../shared/components/StatCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { formatEpochFull } from '../../shared/utils/formatters';

export default function HeatmapPage() {
  const { aps, totalClients, loading, error, lastUpdated } = useHeatmap();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Occupancy Heatmap</h1>
        <StatCard label="Total Wireless Clients" value={totalClients} />
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
