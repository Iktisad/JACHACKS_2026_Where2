import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Wifi, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import FloorPlanMap, { LEVELS, type Building } from '../../features/heatmap/FloorPlanMap';
import { useHeatmap } from '../../features/heatmap/useHeatmap';
import { useIsDesktop } from '../hooks/useMediaQuery';

const BUILDING_NAMES: Record<string, string> = {
  HE: 'Herzberg',
  LI: 'Library',
};

export function BuildingHeatmap() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const building = (code?.toUpperCase() ?? '') as Building;
  const levels = building && building in LEVELS ? LEVELS[building as 'HE' | 'LI'] : [];
  const [level, setLevel] = useState(levels[0] ?? '0');

  const { aps, loading, lastUpdated } = useHeatmap();

  // Filter APs to this building
  const buildingAPs = useMemo(
    () => aps.filter((ap) => ap.building === building),
    [aps, building],
  );

  // APs on the selected floor
  const floorAPs = useMemo(
    () => buildingAPs.filter((ap) => {
      // Match room number to floor level
      // HE rooms: level is first digit (e.g. room "041" → level "0", room "301" → level "3")
      // LI rooms: level "M" is mezzanine, otherwise first digit
      const roomLevel = ap.room.charAt(0).toLowerCase();
      if (level === 'M') return roomLevel === 'm';
      return roomLevel === level;
    }),
    [buildingAPs, level],
  );

  const totalWireless = floorAPs.reduce((sum, ap) => sum + ap.clientCount, 0);
  const totalWired = floorAPs.reduce((sum, ap) => sum + ap.wiredCount, 0);
  const buildingTotal = buildingAPs.reduce((sum, ap) => sum + ap.clientCount, 0);

  const buildingName = BUILDING_NAMES[building] ?? building;

  if (!building || !levels.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-[15px]" style={{ color: 'var(--muted-foreground)' }}>Building not found.</p>
        <button
          type="button"
          onClick={() => navigate('/student/map')}
          className="text-[13px] font-medium px-4 py-2 rounded-xl"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ background: 'var(--background)', minHeight: isDesktop ? '100vh' : 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/student/map')}
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
              {buildingName} Building
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
              Live occupancy heatmap
            </p>
          </div>
          {loading && (
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
            <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>Building total</span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{buildingTotal}</span>
          </div>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
            <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>This floor</span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{totalWireless}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.7} />
            <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>Wired</span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{totalWired}</span>
          </div>
          {lastUpdated && (
            <>
              <div className="ml-auto" />
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Updated {new Date(lastUpdated * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>

        {/* Floor tabs */}
        <div className="flex gap-1.5 mt-3">
          {levels.map((l) => {
            const isActive = level === l;
            const floorCount = buildingAPs
              .filter((ap) => {
                const roomLevel = ap.room.charAt(0).toLowerCase();
                return l === 'M' ? roomLevel === 'm' : roomLevel === l;
              })
              .reduce((sum, ap) => sum + ap.clientCount, 0);

            return (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className="relative flex-1 py-2 rounded-xl text-center transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="studentFloorTab"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'var(--primary)', boxShadow: '0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent)' }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span
                  className="relative text-[13px] font-semibold"
                  style={{ color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}
                >
                  {l === 'M' ? 'Mezz' : `F${l}`}
                </span>
                <span
                  className="relative block text-[10px] tabular-nums mt-0.5"
                  style={{ color: isActive ? 'color-mix(in srgb, var(--primary-foreground) 75%, transparent)' : 'var(--muted-foreground)', opacity: isActive ? 1 : 0.7 }}
                >
                  {floorCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floor plan */}
      <div className="flex-1 p-3 overflow-auto">
        <FloorPlanMap
          liveAPs={floorAPs}
          building={building}
          level={level}
          sites={[]}
          siteId=""
          onSiteChange={() => {}}
          onBuildingChange={() => {}}
          onLevelChange={() => {}}
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
          hideFilters
          hideTimeline
        />
      </div>
    </div>
  );
}
