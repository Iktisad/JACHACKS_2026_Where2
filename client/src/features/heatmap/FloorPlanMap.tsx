import { useState, useMemo } from "react";
import type { Site } from '../../api/sites';
import TimelineScrubber from './TimelineScrubber';

// ─── Floor plan SVG assets ────────────────────────────────────────────────────
import heFloor0 from "../../assets/floor_plans/HE-0-AR001-8.5_x_11.svg";
import heFloor1 from "../../assets/floor_plans/HE-1-AR001-8.5_X_11.svg";
import heFloor2 from "../../assets/floor_plans/HE-2-AR001-8.5_X_11.svg";
import heFloor3 from "../../assets/floor_plans/HE-3-AR001-11_x_8.5.svg";
import heFloor4 from "../../assets/floor_plans/HE-4-AR001-8.5x11.svg";
import liFloorM from "../../assets/floor_plans/LI-AR-M-11x8-5.svg";
import liFloor0 from "../../assets/floor_plans/LI-AR-0-11x8-5.svg";
import liFloor1 from "../../assets/floor_plans/LI-AR-1-11x8-5.svg";
import liFloor2 from "../../assets/floor_plans/LI-AR-2-11x8-5.svg";
import liFloor3 from "../../assets/floor_plans/LI-AR-3-11x8-5.svg";

import roomCoordsRaw from "../../data/room-coordinates.json";
import type { ApRecord } from './types';

// ─── Exported constants for use in HeatmapPage ───────────────────────────────

export type Building = "HE" | "LI" | "";

export const LEVELS: Record<"HE" | "LI", string[]> = {
  HE: ["0", "1", "2", "3", "4"],
  LI: ["M", "0", "1", "2", "3"],
};

// ─── Module-private constants ─────────────────────────────────────────────────

const SVG_WIDTH = 1056;
const SVG_HEIGHT = 816;

const FLOOR_PLAN_SVG: Record<string, string> = {
  "HE-0": heFloor0,
  "HE-1": heFloor1,
  "HE-2": heFloor2,
  "HE-3": heFloor3,
  "HE-4": heFloor4,
  "LI-M": liFloorM,
  "LI-0": liFloor0,
  "LI-1": liFloor1,
  "LI-2": liFloor2,
  "LI-3": liFloor3,
};

interface RoomCoord {
  id: string;
  room: string;
  building: string;
  level: string;
  x: number;
  y: number;
}

const ALL_ROOM_COORDS = roomCoordsRaw as RoomCoord[];

// ─── Multi-AP positioning logic ───────────────────────────────────────────────

/** Horizontal gap (SVG px) between dots when N APs share the same room. */
const AP_SPACING = 45;

interface RenderedAP extends ApRecord {
  renderX: number;
  renderY: number;
}

function computeRenderedAPs(
  aps: ApRecord[],
  coordsByRoomKey: Map<string, { x: number; y: number }>,
): RenderedAP[] {
  const groups = new Map<string, ApRecord[]>();
  for (const ap of aps) {
    const key = `${ap.building}-${ap.room}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ap);
  }

  const result: RenderedAP[] = [];
  for (const [roomKey, roomAps] of groups) {
    const coord = coordsByRoomKey.get(roomKey);
    if (!coord) continue;
    const count = roomAps.length;
    roomAps.forEach((ap, idx) => {
      const offset = (idx - (count - 1) / 2) * AP_SPACING;
      result.push({ ...ap, renderX: coord.x + offset, renderY: coord.y });
    });
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalClients(ap: ApRecord): number {
  return ap.clientCount + ap.wiredCount;
}

function getApColor(ap: ApRecord): string {
  const t = totalClients(ap);
  if (t === 0) return "#22c55e";
  if (t < 10) return "#84cc16";
  if (t < 20) return "#eab308";
  if (t < 30) return "#f97316";
  return "#ef4444";
}

function getHeatRadius(count: number): number {
  if (count === 0) return 60;
  if (count < 10) return 90;
  if (count < 20) return 120;
  if (count < 30) return 160;
  return 200;
}

function getHeatOpacity(count: number): number {
  if (count === 0) return 0.20;
  if (count < 10) return 0.35;
  if (count < 20) return 0.50;
  if (count < 30) return 0.60;
  return 0.70;
}

const NO_APS: ApRecord[] = [];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  liveAPs?: ApRecord[];
  siteHasFloorPlan?: boolean;
  building: Building;
  level: string;
  sites: Site[];
  siteId: string;
  onSiteChange: (id: string) => void;
  onBuildingChange: (b: Building) => void;
  onLevelChange: (l: string) => void;
  totalWireless: number;
  totalWired: number;
  // Timeline scrubber
  timelineMode: boolean;
  onTimelineModeChange: (v: boolean) => void;
  timelineEpochs: number[];
  timelineScrubIndex: number;
  onTimelineScrubChange: (i: number) => void;
  timelineLoading: boolean;
  timeFrom: number;
  timeTo: number;
  onTimeFromChange: (v: number) => void;
  onTimeToChange: (v: number) => void;
}

function toDatetimeLocal(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function fromDatetimeLocal(s: string): number {
  return Math.floor(new Date(s).getTime() / 1000);
}

export default function FloorPlanMap({
  liveAPs = NO_APS,
  siteHasFloorPlan = true,
  building,
  level,
  sites,
  siteId,
  onSiteChange,
  onBuildingChange,
  onLevelChange,
  totalWireless,
  totalWired,
  timelineMode,
  onTimelineModeChange,
  timelineEpochs,
  timelineScrubIndex,
  onTimelineScrubChange,
  timelineLoading,
  timeFrom,
  timeTo,
  onTimeFromChange,
  onTimeToChange,
}: Props) {
  const [hoveredApKey, setHoveredApKey] = useState<string | null>(null);

  const floorRooms = useMemo(
    () => ALL_ROOM_COORDS.filter((r) => r.building === building && r.level === level),
    [building, level],
  );

  const coordsByRoomKey = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const r of floorRooms) map.set(`${r.building}-${r.room}`, { x: r.x, y: r.y });
    return map;
  }, [floorRooms]);

  const renderedAPs = useMemo(
    () => computeRenderedAPs(liveAPs, coordsByRoomKey),
    [liveAPs, coordsByRoomKey],
  );

  const hoveredAp = hoveredApKey
    ? renderedAPs.find((ap) => `${ap.building}-${ap.room}-${ap.apId}` === hoveredApKey) ?? null
    : null;

  const floorSvg = building !== '' ? FLOOR_PLAN_SVG[`${building}-${level}`] : undefined;

  return (
    <div className="w-full overflow-auto rounded-xl p-3 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* ── Filters row ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Site
          <select
            className="rounded-lg px-2 py-1.5 text-sm min-w-40"
            style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
            value={siteId}
            onChange={(e) => onSiteChange(e.target.value)}
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Building
          <select
            className="rounded-lg px-2 py-1.5 text-sm min-w-40"
            style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
            value={building}
            onChange={(e) => onBuildingChange(e.target.value as Building)}
          >
            <option value="">— Select —</option>
            <option value="HE">HE — Herzberg</option>
            <option value="LI">LI — Library</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Level
          <select
            className="rounded-lg px-2 py-1.5 text-sm min-w-36"
            style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
            value={level}
            disabled={building === ''}
            onChange={(e) => onLevelChange(e.target.value)}
          >
            {building !== '' && LEVELS[building as 'HE' | 'LI'].map((l) => (
              <option key={l} value={l}>
                {l === 'M' ? 'Mezzanine' : `Floor ${l}`}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-end gap-4 pb-0.5">
          <button
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors self-end cursor-pointer"
            style={{
              background: timelineMode ? 'var(--primary)' : 'var(--card)',
              color: timelineMode ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: timelineMode ? '1px solid var(--primary)' : '1px solid var(--border)',
            }}
            onClick={() => onTimelineModeChange(!timelineMode)}
          >
            {timelineMode ? 'Live' : 'History'}
          </button>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Wireless</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{totalWireless}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Wired</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{totalWired}</p>
          </div>
          <div className="text-right pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>APs on floor</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{renderedAPs.length}</p>
          </div>
        </div>
      </div>

      {/* ── Timeline scrubber — shown below filters when history mode is active ── */}
      {timelineMode && (
        <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="datetime-local"
              className="rounded-lg px-2 py-1 text-xs"
              style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
              value={toDatetimeLocal(timeFrom)}
              onChange={(e) => { onTimeFromChange(fromDatetimeLocal(e.target.value)); onTimelineScrubChange(0); }}
            />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>→</span>
            <input
              type="datetime-local"
              className="rounded-lg px-2 py-1 text-xs"
              style={{ border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}
              value={toDatetimeLocal(timeTo)}
              onChange={(e) => { onTimeToChange(fromDatetimeLocal(e.target.value)); onTimelineScrubChange(0); }}
            />
          </div>
          <TimelineScrubber
            epochs={timelineEpochs}
            scrubIndex={timelineScrubIndex}
            onChange={onTimelineScrubChange}
            loading={timelineLoading}
          />
        </div>
      )}

      {/* ── Floor plan + SVG overlay ────────────────────────────────────────── */}
      <div className="relative w-full aspect-1056/816">
        {building === '' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl" style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
            <svg className="w-10 h-10" style={{ color: 'var(--secondary-light)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m16.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Select a building to view the floor plan</p>
          </div>
        )}

        {building !== '' && floorSvg && (
          <img
            src={floorSvg}
            alt={`${building} level ${level} floor plan`}
            className={`absolute inset-0 w-full h-full${siteHasFloorPlan ? '' : ' opacity-25 grayscale'}`}
          />
        )}

        {building !== '' && !siteHasFloorPlan && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <svg className="w-10 h-10" style={{ color: 'var(--muted-foreground)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Floor plan not available for this site</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Coming soon</p>
          </div>
        )}

        {building !== '' && (
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              {renderedAPs.map((ap) => (
                <radialGradient
                  key={`grad-${ap.building}-${ap.room}-${ap.apId}`}
                  id={`grad-${ap.building}-${ap.room}-${ap.apId}`}
                  gradientUnits="userSpaceOnUse"
                  cx={ap.renderX}
                  cy={ap.renderY}
                  r={getHeatRadius(totalClients(ap))}
                >
                  <stop offset="0%" stopColor={getApColor(ap)} stopOpacity={getHeatOpacity(totalClients(ap))} />
                  <stop offset="100%" stopColor={getApColor(ap)} stopOpacity={0} />
                </radialGradient>
              ))}
            </defs>

            {renderedAPs.map((ap) => (
              <circle
                key={`blob-${ap.building}-${ap.room}-${ap.apId}`}
                cx={ap.renderX}
                cy={ap.renderY}
                r={getHeatRadius(totalClients(ap))}
                fill={`url(#grad-${ap.building}-${ap.room}-${ap.apId})`}
              />
            ))}

            {renderedAPs.map((ap) => {
              const apKey = `${ap.building}-${ap.room}-${ap.apId}`;
              const isHovered = hoveredApKey === apKey;
              return (
                <g
                  key={apKey}
                  className="pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setHoveredApKey(apKey)}
                  onMouseLeave={() => setHoveredApKey(null)}
                >
                  <circle cx={ap.renderX} cy={ap.renderY} r={10} fill={getApColor(ap)} opacity={0.25}>
                    <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle
                    cx={ap.renderX}
                    cy={ap.renderY}
                    r={8}
                    fill={getApColor(ap)}
                    stroke={isHovered ? "#164863" : "#fff"}
                    strokeWidth={isHovered ? 2.5 : 2}
                  />
                  <text
                    x={ap.renderX}
                    y={ap.renderY + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={7}
                    fontWeight="bold"
                    fill="#fff"
                    className="pointer-events-none"
                  >
                    {totalClients(ap)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* ── Hover tooltip ────────────────────────────────────────────────── */}
        {hoveredAp && (
          <div
            className="absolute z-10 rounded-xl shadow-lg px-3 py-2 text-sm pointer-events-none -translate-y-full -translate-x-1/2 left-(--tx) top-(--ty)"
            style={{
              '--tx': `${(hoveredAp.renderX / SVG_WIDTH) * 100}%`,
              '--ty': `${(hoveredAp.renderY / SVG_HEIGHT) * 100}%`,
              background: 'var(--card)',
              border: '1px solid var(--border)',
            } as React.CSSProperties}
          >
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Room {hoveredAp.room} · AP {hoveredAp.apId}</p>
            <p className="font-medium" style={{ color: 'var(--foreground)' }}>{totalClients(hoveredAp)} clients</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{hoveredAp.clientCount} wireless · {hoveredAp.wiredCount} wired</p>
          </div>
        )}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <span className="font-medium">AP clients:</span>
        {[
          { color: "#22c55e", label: "0" },
          { color: "#84cc16", label: "1-9" },
          { color: "#eab308", label: "10-19" },
          { color: "#f97316", label: "20-29" },
          { color: "#ef4444", label: "30+" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full bg-(--legend-color)"
              style={{ '--legend-color': item.color } as React.CSSProperties}
            />
            {item.label}
          </span>
        ))}
        <span className="ml-4 italic" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>Heat radius scales with client count</span>
      </div>
    </div>
  );
}
