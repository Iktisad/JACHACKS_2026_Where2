// One-off script — generates client/src/data/room-coordinates.json
// from the 10 SVG floor plan files.
//
// Run from the repo root:
//   node scripts/generate-room-coords.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FLOOR_PLAN_DIR = join(ROOT, 'client/src/assets/floor_plans');
const OUT_DIR = join(ROOT, 'client/src/data');
const OUT_FILE = join(OUT_DIR, 'room-coordinates.json');

const SVG_FILES = [
  { file: 'HE-0-AR001-8.5_x_11.svg',  building: 'HE', level: '0' },
  { file: 'HE-1-AR001-8.5_X_11.svg',  building: 'HE', level: '1' },
  { file: 'HE-2-AR001-8.5_X_11.svg',  building: 'HE', level: '2' },
  { file: 'HE-3-AR001-11_x_8.5.svg',  building: 'HE', level: '3' },
  { file: 'HE-4-AR001-8.5x11.svg',    building: 'HE', level: '4' },
  { file: 'LI-AR-M-11x8-5.svg',       building: 'LI', level: 'M' },
  { file: 'LI-AR-0-11x8-5.svg',       building: 'LI', level: '0' },
  { file: 'LI-AR-1-11x8-5.svg',       building: 'LI', level: '1' },
  { file: 'LI-AR-2-11x8-5.svg',       building: 'LI', level: '2' },
  { file: 'LI-AR-3-11x8-5.svg',       building: 'LI', level: '3' },
];

// Matches a <text> element whose opening tag contains transform="matrix(a,b,c,d,e,f)"
// and whose first <tspan> contains a 3-4 digit room number.
// Anchored to <text so path/rect/g transforms are never matched.
const TEXT_RE = /<text\b[^>]*transform="matrix\(([^)]+)\)"[^>]*>[\s\S]*?<tspan[^>]*>(\d{3,4})<\/tspan>/g;

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Returns true if a room number belongs to the given level.
 * Heuristic: the first digit of the room number matches the level digit.
 * Mezzanine (M) has no digit — keep all 3-digit room numbers.
 */
function matchesLevel(room, level) {
  if (level === 'M') return true;
  return room.startsWith(level);
}

const results = [];
const seen = new Set();

for (const { file, building, level } of SVG_FILES) {
  const svgPath = join(FLOOR_PLAN_DIR, file);
  let content;
  try {
    content = readFileSync(svgPath, 'utf-8');
  } catch {
    console.warn(`⚠️  Could not read ${file} — skipping`);
    continue;
  }

  let match;
  TEXT_RE.lastIndex = 0; // reset global regex between files
  let fileCount = 0;

  while ((match = TEXT_RE.exec(content)) !== null) {
    const matrixParts = match[1].split(',');
    if (matrixParts.length < 6) continue;

    const x = parseFloat(matrixParts[4]);
    const y = parseFloat(matrixParts[5]);
    const room = match[2];

    if (!matchesLevel(room, level)) continue;
    if (isNaN(x) || isNaN(y)) continue;
    // Must be within the 1056×816 SVG canvas
    if (x < 0 || x > 1056 || y < 0 || y > 816) continue;

    const dedupKey = `${building}-${level}-${room}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    results.push({
      id: `${building.toLowerCase()}${room}`,
      room,
      building,
      level,
      x: round2(x),
      y: round2(y),
    });
    fileCount++;
  }

  console.log(`  ${file}: ${fileCount} rooms`);
}

results.sort((a, b) => {
  if (a.building !== b.building) return a.building.localeCompare(b.building);
  if (a.level !== b.level) return a.level.localeCompare(b.level);
  return a.room.localeCompare(b.room);
});

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
console.log(`\n✅ Generated ${results.length} room coordinates → ${OUT_FILE}`);
