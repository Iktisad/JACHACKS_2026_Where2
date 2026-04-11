import { useState, useMemo } from "react";

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

type Building = "HE" | "LI";

const LEVELS: Record<Building, string[]> = {
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
const AP_SPACING = 20;

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
  if (ap.status === "offline") return "#9ca3af";
  if (ap.clientCount === 0) return "#22c55e";
  if (ap.clientCount < 10) return "#84cc16";
  if (ap.clientCount < 20) return "#eab308";
  if (ap.clientCount < 30) return "#f97316";
  return "#ef4444";
}

// Stable empty array — avoids spurious useMemo re-runs before real data arrives
const NO_APS: ApRecord[] = [];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Live AP records from useHeatmap(). Omit to show room anchors only. */
  liveAPs?: ApRecord[];
}

export default function FloorPlanMap({ liveAPs = NO_APS }: Props) {
  const [building, setBuilding] = useState<Building>("HE");
  const [level, setLevel] = useState<string>("0");
  // selectedRoom holds the "BUILDING-ROOM" key of the clicked room (e.g. "HE-052")
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  function handleBuildingChange(b: Building) {
    setBuilding(b);
    setLevel(LEVELS[b][0]); // reset to first floor of new building
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
  const floorSvg = FLOOR_PLAN_SVG[`${building}-${level}`];

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
            <option value="HE">HE — Herzberg</option>
            <option value="LI">LI — Library</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Level
          <select
            className="ml-1 border border-gray-300 rounded px-2 py-1 text-sm"
            value={level}
            onChange={(e) => { setLevel(e.target.value); setSelectedRoom(null); }}
          >
            {LEVELS[building].map((l) => (
              <option key={l} value={l}>
                {l === "M" ? "Mezzanine" : `Floor ${l}`}
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto text-xs text-gray-400">
          {floorRooms.length} rooms · {renderedAPs.length} APs loaded
        </span>
      </div>

      {/* ── Floor plan + SVG overlay ────────────────────────────────────────── */}
      <div
        className="relative w-full aspect-1056/816"
      >
        {/* Floor plan background */}
        <img
          src={floorSvg}
          alt={`${building} level ${level} floor plan`}
          className="absolute inset-0 w-full h-full"
        />

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/*
           * ── ROOM ANCHORS ─────────────────────────────────────────────────────
           * A small blue crosshair (+) is rendered at the centre of every room
           * on this floor. Coordinates come from room-coordinates.json.
           *
           * These anchors serve two purposes:
           *   1. Visual reference while no live AP data is loaded.
           *   2. The base position used by computeRenderedAPs() — when real AP
           *      data arrives, AP dots are placed here (offset horizontally when
           *      multiple APs share the same room).
           * ─────────────────────────────────────────────────────────────────────
           */}
          {floorRooms.map((room) => (
            <g key={room.id}>
              {/* Crosshair arm — horizontal */}
              <line
                x1={room.x - 5} y1={room.y}
                x2={room.x + 5} y2={room.y}
                stroke="#93c5fd" strokeWidth={1.5}
              />
              {/* Crosshair arm — vertical */}
              <line
                x1={room.x} y1={room.y - 5}
                x2={room.x} y2={room.y + 5}
                stroke="#93c5fd" strokeWidth={1.5}
              />
              {/* Room number label */}
              <text
                x={room.x + 7}
                y={room.y - 4}
                fontSize={7}
                fill="#60a5fa"
                className="pointer-events-none font-mono"
              >
                {room.room}
              </text>
            </g>
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
          {renderedAPs.map((ap) => {
            const roomKey = `${ap.building}-${ap.room}`;
            const isSelected = selectedRoom === roomKey;
            return (
              <g
                key={`${roomKey}-${ap.apId}`}
                className="pointer-events-auto cursor-pointer"
                onClick={() => setSelectedRoom(isSelected ? null : roomKey)}
              >
                {/* Pulse ring — online APs only */}
                {ap.status === "online" && (
                  <circle cx={ap.renderX} cy={ap.renderY} r={10} fill={getApColor(ap)} opacity={0.25}>
                    <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
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
                    AP {ap.apId} ·{" "}
                    <span className={ap.status === "online" ? "text-green-600" : "text-gray-400"}>
                      {ap.status}
                    </span>
                    {ap.status === "online" && ` · ${ap.clientCount} clients`}
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
      <div className="flex items-center gap-4 px-1 text-xs text-gray-600">
        <span className="font-medium">Clients:</span>
        {[
          { color: "#22c55e", label: "0" },
          { color: "#84cc16", label: "1-9" },
          { color: "#eab308", label: "10-19" },
          { color: "#f97316", label: "20-29" },
          { color: "#ef4444", label: "30+" },
          { color: "#9ca3af", label: "Offline" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full bg-(--legend-color)"
              style={{ '--legend-color': item.color } as React.CSSProperties}
            />
            {item.label}
          </span>
        ))}
        <span className="ml-auto text-xs text-blue-400 font-mono">+ room anchor</span>
      </div>
    </div>
  );
}
