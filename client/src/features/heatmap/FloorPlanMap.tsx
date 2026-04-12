import { useState, useMemo, useEffect } from "react";

// ─── Floor plan SVG assets ────────────────────────────────────────────────────
// All 10 floor plans imported eagerly so Vite bundles them correctly.
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

// ─── Room coordinate data ─────────────────────────────────────────────────────
// Generated from the floor plan SVGs by extracting text-element transform matrices.
// Each entry is the anchor centre of a room label on the SVG canvas.
import roomCoordsRaw from "../../data/room-coordinates.json";
import type { ApRecord } from './types';

/** All SVGs share the same canvas size */
const SVG_WIDTH = 1056;
const SVG_HEIGHT = 816;

// ─── Building / level config ──────────────────────────────────────────────────

/** "" = no building selected (placeholder state) */
type Building = "HE" | "LI" | "";

const LEVELS: Record<"HE" | "LI", string[]> = {
  HE: ["0", "1", "2", "3", "4"],
  LI: ["M", "0", "1", "2", "3"],
};

/**
 * Maps "BUILDING-LEVEL" → the imported SVG URL.
 * Update this map if floor plan filenames change.
 */
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

// ─── Room coordinate types ────────────────────────────────────────────────────

interface RoomCoord {
  id: string;       // e.g. "he041"
  room: string;     // e.g. "041"
  building: string; // e.g. "HE"
  level: string;    // e.g. "0"
  x: number;        // SVG x — anchor centre of the room label
  y: number;        // SVG y — anchor centre of the room label
}

const ALL_ROOM_COORDS = roomCoordsRaw as RoomCoord[];

// ─── Multi-AP positioning logic ───────────────────────────────────────────────

/** Horizontal gap (SVG px) between dots when N APs share the same room. */
const AP_SPACING = 45;

interface RenderedAP extends ApRecord {
  renderX: number; // final SVG x with multi-AP horizontal offset applied
  renderY: number; // final SVG y (same as room anchor y)
}

/**
 * Given raw AP records and a room-coordinate lookup, computes (renderX, renderY)
 * for every AP, spreading them horizontally around the shared room anchor.
 *
 *   N=1 → AP sits exactly on the anchor (no offset)
 *   N=2 → APs at  anchor.x − 10  and  anchor.x + 10
 *   N=3 → APs at  anchor.x − 20,       anchor.x,      anchor.x + 20
 *   ...
 */
function computeRenderedAPs(
  aps: ApRecord[],
  coordsByRoomKey: Map<string, { x: number; y: number }>,
): RenderedAP[] {
  // Group APs by room key
  const groups = new Map<string, ApRecord[]>();
  for (const ap of aps) {
    const key = `${ap.building}-${ap.room}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ap);
  }

  const result: RenderedAP[] = [];
  for (const [roomKey, roomAps] of groups) {
    const coord = coordsByRoomKey.get(roomKey);
    if (!coord) continue; // AP's room has no coordinates — skip

    const count = roomAps.length;
    roomAps.forEach((ap, idx) => {
      // Centre the spread so all dots are symmetric around the anchor
      const offset = (idx - (count - 1) / 2) * AP_SPACING;
      result.push({ ...ap, renderX: coord.x + offset, renderY: coord.y });
    });
  }
  return result;
}

// ─── Colour helper ────────────────────────────────────────────────────────────

function getApColor(ap: ApRecord): string {
  if (ap.clientCount === 0) return "#22c55e";
  if (ap.clientCount < 10) return "#84cc16";
  if (ap.clientCount < 20) return "#eab308";
  if (ap.clientCount < 30) return "#f97316";
  return "#ef4444";
}

// ─── Heatmap blob helpers ─────────────────────────────────────────────────────
// Blobs use the same green→yellow→red palette as the AP dots.

/** SVG-space radius of the radial gradient blob (60–200 px). */
function getHeatRadius(clientCount: number): number {
  if (clientCount === 0) return 60;
  if (clientCount < 10) return 90;
  if (clientCount < 20) return 120;
  if (clientCount < 30) return 160;
  return 200;
}

/** Peak opacity of the heat blob (0.20–0.70). */
function getHeatOpacity(clientCount: number): number {
  if (clientCount === 0) return 0.20;
  if (clientCount < 10) return 0.35;
  if (clientCount < 20) return 0.50;
  if (clientCount < 30) return 0.60;
  return 0.70;
}

// Stable empty array — avoids spurious useMemo re-runs before real data arrives
const NO_APS: ApRecord[] = [];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Live AP records from useHeatmap(). */
  liveAPs?: ApRecord[];
  /**
   * Whether the selected site has a floor plan available.
   * Defaults to true. Pass false to show the "coming soon" overlay.
   */
  siteHasFloorPlan?: boolean;
  /**
   * Controls which building options appear in the dropdown.
   * '' = blank/placeholder option; 'HE' | 'LI' = real buildings.
   * Defaults to ['HE', 'LI'].
   */
  availableBuildings?: Array<Building>;
}

export default function FloorPlanMap({
  liveAPs = NO_APS,
  siteHasFloorPlan = true,
  availableBuildings = ['HE', 'LI'],
}: Props) {
  const [building, setBuilding] = useState<Building>(availableBuildings[0] ?? 'HE');
  const [level, setLevel] = useState<string>(
    availableBuildings[0] && availableBuildings[0] !== '' ? LEVELS[availableBuildings[0] as 'HE' | 'LI'][0] : ''
  );
  // selectedRoom holds the "BUILDING-ROOM" key of the clicked room (e.g. "HE-052")
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // When the parent changes which buildings are available (e.g. site selection changes),
  // reset to the first available building automatically.
  useEffect(() => {
    const first = availableBuildings[0] ?? '';
    setBuilding(first);
    setLevel(first !== '' ? LEVELS[first as 'HE' | 'LI'][0] : '');
    setSelectedRoom(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableBuildings.join(',')]);

  function handleBuildingChange(b: Building) {
    setBuilding(b);
    setLevel(b !== '' ? LEVELS[b as 'HE' | 'LI'][0] : '');
    setSelectedRoom(null);
  }

  // Room anchors for the currently visible floor
  const floorRooms = useMemo(
    () => ALL_ROOM_COORDS.filter((r) => r.building === building && r.level === level),
    [building, level],
  );

  // Fast lookup: "BUILDING-ROOM" → { x, y }
  const coordsByRoomKey = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const r of floorRooms) map.set(`${r.building}-${r.room}`, { x: r.x, y: r.y });
    return map;
  }, [floorRooms]);

  // computeRenderedAPs handles multi-AP rooms: N APs → N horizontally spread dots
  const renderedAPs = useMemo(
    () => computeRenderedAPs(liveAPs, coordsByRoomKey),
    [liveAPs, coordsByRoomKey],
  );

  // All APs belonging to the selected room (for the detail card)
  const selectedRoomAPs = selectedRoom
    ? renderedAPs.filter((ap) => `${ap.building}-${ap.room}` === selectedRoom)
    : [];

  const selectedAnchor = selectedRoom ? coordsByRoomKey.get(selectedRoom) : null;
  const floorSvg = building !== '' ? FLOOR_PLAN_SVG[`${building}-${level}`] : undefined;

  return (
    <div className="w-full overflow-auto border rounded-lg bg-white p-3 space-y-3">

      {/* ── Building / level selectors ─────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Building
          <select
            className="ml-1 border border-gray-300 rounded px-2 py-1 text-sm"
            value={building}
            onChange={(e) => handleBuildingChange(e.target.value as Building)}
          >
            {availableBuildings.includes('') && (
              <option value="">— Select building —</option>
            )}
            {availableBuildings.includes('HE') && (
              <option value="HE">HE — Herzberg</option>
            )}
            {availableBuildings.includes('LI') && (
              <option value="LI">LI — Library</option>
            )}
          </select>
        </label>

        {building !== '' && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Level
            <select
              className="ml-1 border border-gray-300 rounded px-2 py-1 text-sm"
              value={level}
              onChange={(e) => { setLevel(e.target.value); setSelectedRoom(null); }}
            >
              {LEVELS[building as 'HE' | 'LI'].map((l) => (
                <option key={l} value={l}>
                  {l === "M" ? "Mezzanine" : `Floor ${l}`}
                </option>
              ))}
            </select>
          </label>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {renderedAPs.length} APs active
        </span>
      </div>

      {/* ── Floor plan + SVG overlay ────────────────────────────────────────── */}
      <div
        className="relative w-full aspect-1056/816"
      >
        {/* ── No building selected: placeholder panel ──────────────────────── */}
        {building === '' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded border border-dashed border-gray-300">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m16.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <p className="text-sm text-gray-500">Select a building to view the floor plan</p>
          </div>
        )}

        {/* Floor plan background — only when a building is selected */}
        {building !== '' && floorSvg && (
          <img
            src={floorSvg}
            alt={`${building} level ${level} floor plan`}
            className={`absolute inset-0 w-full h-full${siteHasFloorPlan ? '' : ' opacity-25 grayscale'}`}
          />
        )}

        {/* ── Coming-soon overlay for sites without floor plans ─────────────── */}
        {building !== '' && !siteHasFloorPlan && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 rounded">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Floor plan not available for this site</p>
            <p className="text-xs text-gray-400">Coming soon</p>
          </div>
        )}

        {building !== '' && (
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* ── GRADIENT DEFINITIONS (one per rendered AP) ───────────────── */}
          <defs>
            {renderedAPs.map((ap) => (
              <radialGradient
                key={`grad-${ap.building}-${ap.room}-${ap.apId}`}
                id={`grad-${ap.building}-${ap.room}-${ap.apId}`}
                gradientUnits="userSpaceOnUse"
                cx={ap.renderX}
                cy={ap.renderY}
                r={getHeatRadius(ap.clientCount)}
              >
                <stop offset="0%" stopColor={getApColor(ap)} stopOpacity={getHeatOpacity(ap.clientCount)} />
                <stop offset="100%" stopColor={getApColor(ap)} stopOpacity={0} />
              </radialGradient>
            ))}
          </defs>

          {/* ── HEATMAP BLOBS (rendered before dots so dots appear on top) ── */}
          {renderedAPs.map((ap) => (
            <circle
              key={`blob-${ap.building}-${ap.room}-${ap.apId}`}
              cx={ap.renderX}
              cy={ap.renderY}
              r={getHeatRadius(ap.clientCount)}
              fill={`url(#grad-${ap.building}-${ap.room}-${ap.apId})`}
            />
          ))}

          {/*
           * ── LIVE AP DOTS ─────────────────────────────────────────────────────
           * Rendered once liveAPs (from useHeatmap) is non-empty.
           *
           * Each dot's position is pre-computed by computeRenderedAPs():
           *   • 1 AP in a room  → dot sits exactly on the room anchor
           *   • N APs in a room → dots are spread AP_SPACING (20px) apart,
           *                       centred on the room anchor
           *
           * Clicking any dot selects the whole room — the detail card shows
           * all APs in that room together.
           * ─────────────────────────────────────────────────────────────────────
           */}
          {building !== '' && renderedAPs.map((ap) => {
            const roomKey = `${ap.building}-${ap.room}`;
            const isSelected = selectedRoom === roomKey;
            return (
              <g
                key={`${roomKey}-${ap.apId}`}
                className="pointer-events-auto cursor-pointer"
                onClick={() => setSelectedRoom(isSelected ? null : roomKey)}
              >
                {/* Pulse ring */}
                <circle cx={ap.renderX} cy={ap.renderY} r={10} fill={getApColor(ap)} opacity={0.25}>
                  <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
                {/* Main dot */}
                <circle
                  cx={ap.renderX}
                  cy={ap.renderY}
                  r={8}
                  fill={getApColor(ap)}
                  stroke={isSelected ? "#1d4ed8" : "#fff"}
                  strokeWidth={isSelected ? 2.5 : 2}
                />
                {/* Client count inside dot */}
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
                  {ap.clientCount}
                </text>
              </g>
            );
          })}
        </svg>
        )}

        {/*
         * ── ROOM DETAIL CARD ──────────────────────────────────────────────────
         * Appears when a room anchor or AP dot is clicked.
         * Lists every AP installed in that room (one row per AP).
         * ─────────────────────────────────────────────────────────────────────
         */}
        {selectedRoom && selectedAnchor && (
          <div
            className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm min-w-45 translate-x-3 -translate-y-1/2 left-(--tx) top-(--ty)"
            style={{
              '--tx': `${(selectedAnchor.x / SVG_WIDTH) * 100}%`,
              '--ty': `${(selectedAnchor.y / SVG_HEIGHT) * 100}%`,
            } as React.CSSProperties}
          >
            <div className="font-semibold text-gray-900 mb-1">
              Room {selectedRoom.split("-")[1]}
            </div>
            {selectedRoomAPs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No APs loaded yet</p>
            ) : (
              selectedRoomAPs.map((ap) => (
                <div key={ap.apId} className="flex items-center gap-2 py-0.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0 bg-(--ap-color)"
                    style={{ '--ap-color': getApColor(ap) } as React.CSSProperties}
                  />
                  <span className="text-xs text-gray-600">
                    AP {ap.apId} · {ap.clientCount} wireless · {ap.wiredCount} wired
                  </span>
                </div>
              ))
            )}
            <button className="mt-2 text-xs text-blue-600 hover:underline" onClick={() => setSelectedRoom(null)}>
              Close
            </button>
          </div>
        )}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-gray-600">
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
        <span className="ml-4 text-gray-400 italic">Heat radius scales with client count</span>
      </div>
    </div>
  );
}
