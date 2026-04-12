import { useState } from 'react';
import { useHeatmap } from './useHeatmap';
import { useSites } from '../../shared/hooks/useSites';
import FloorPlanMap, { LEVELS } from './FloorPlanMap';
import type { Building } from './FloorPlanMap';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { formatEpochFull } from '../../shared/utils/formatters';

export default function HeatmapPage() {
  const [siteId, setSiteId] = useState('');
  const [building, setBuilding] = useState<Building>('HE');
  const [level, setLevel] = useState<string>(LEVELS['HE'][0]);

  const { sites } = useSites();
  const { aps, totalWireless, totalWired, loading, error, lastUpdated } = useHeatmap(siteId || undefined);

  const selectedSite = sites.find((s) => s.id === siteId);
  const JAC_PATTERN = /jac|herzberg|library|john\s*abbott/i;
  const isJac = siteId !== '' && JAC_PATTERN.test(selectedSite?.name ?? '');
  const siteHasFloorPlan = siteId === '' || isJac;

  function handleBuildingChange(b: Building) {
    setBuilding(b);
    setLevel(b !== '' ? LEVELS[b as 'HE' | 'LI'][0] : '');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Live Heatmap</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Real-time occupancy on the floor plan
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && aps.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FloorPlanMap
          liveAPs={siteHasFloorPlan ? aps : []}
          siteHasFloorPlan={siteHasFloorPlan}
          building={building}
          level={level}
          sites={sites}
          siteId={siteId}
          onSiteChange={setSiteId}
          onBuildingChange={handleBuildingChange}
          onLevelChange={setLevel}
          totalWireless={totalWireless}
          totalWired={totalWired}
          timelineMode={false}
          onTimelineModeChange={() => {}}
          timelineEpochs={[]}
          timelineScrubIndex={0}
          onTimelineScrubChange={() => {}}
          timelineLoading={false}
          timeFrom={0}
          timeTo={0}
          onTimeFromChange={() => {}}
          onTimeToChange={() => {}}
        />
      )}

      {lastUpdated && (
        <p className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>
          Last updated: {formatEpochFull(lastUpdated)}
        </p>
      )}
    </div>
  );
}
