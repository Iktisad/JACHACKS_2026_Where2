import { useState, useMemo } from 'react';
import { useHeatmap } from './useHeatmap';
import { useHeatmapTimeline } from './useHeatmapTimeline';
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

  // Timeline scrubber state
  const [timelineMode, setTimelineMode] = useState(false);
  const now = Math.floor(Date.now() / 1000);
  const [timeFrom, setTimeFrom] = useState(now - 3 * 3600);
  const [timeTo, setTimeTo] = useState(now);
  const [scrubIndex, setScrubIndex] = useState(0);

  const { sites } = useSites();
  const { aps, totalWireless, totalWired, loading, error, lastUpdated } = useHeatmap(siteId || undefined);

  const { epochs, apsByEpoch, loading: timelineLoading, error: timelineError } = useHeatmapTimeline(
    timelineMode ? timeFrom : 0,
    timelineMode ? timeTo : 0,
    siteId || undefined,
  );

  const selectedSite = sites.find((s) => s.id === siteId);
  const JAC_PATTERN = /jac|herzberg|library|john\s*abbott/i;
  const isJac = siteId !== '' && JAC_PATTERN.test(selectedSite?.name ?? '');
  const siteHasFloorPlan = siteId === '' || isJac;

  function handleBuildingChange(b: Building) {
    setBuilding(b);
    setLevel(b !== '' ? LEVELS[b as 'HE' | 'LI'][0] : '');
  }

  const displayAps = useMemo(() => {
    if (!timelineMode || epochs.length === 0) return aps;
    const epoch = epochs[Math.min(scrubIndex, epochs.length - 1)];
    return apsByEpoch.get(epoch) ?? [];
  }, [timelineMode, epochs, scrubIndex, apsByEpoch, aps]);

  const displayWireless = timelineMode
    ? displayAps.reduce((s, ap) => s + ap.clientCount, 0)
    : totalWireless;
  const displayWired = timelineMode
    ? displayAps.reduce((s, ap) => s + ap.wiredCount, 0)
    : totalWired;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Occupancy Heatmap</h1>

      {error && <ErrorBanner message={error} />}
      {timelineError && <ErrorBanner message={timelineError} />}

      {loading && aps.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FloorPlanMap
          liveAPs={siteHasFloorPlan ? displayAps : []}
          siteHasFloorPlan={siteHasFloorPlan}
          building={building}
          level={level}
          sites={sites}
          siteId={siteId}
          onSiteChange={setSiteId}
          onBuildingChange={handleBuildingChange}
          onLevelChange={setLevel}
          totalWireless={displayWireless}
          totalWired={displayWired}
          timelineMode={timelineMode}
          onTimelineModeChange={(v) => { setTimelineMode(v); setScrubIndex(0); }}
          timelineEpochs={epochs}
          timelineScrubIndex={scrubIndex}
          onTimelineScrubChange={setScrubIndex}
          timelineLoading={timelineLoading}
          timeFrom={timeFrom}
          timeTo={timeTo}
          onTimeFromChange={setTimeFrom}
          onTimeToChange={setTimeTo}
        />
      )}

      {!timelineMode && lastUpdated && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {formatEpochFull(lastUpdated)}
        </p>
      )}
    </div>
  );
}
