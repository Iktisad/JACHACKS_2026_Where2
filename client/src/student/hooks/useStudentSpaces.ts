import { useState, useCallback } from 'react';
import { fetchHeatmap } from '../../api/heatmap';
import { usePolling } from '../../shared/hooks/usePolling';
import type { FinderSpace } from '../services/spaceFinder';

const AP_REGEX = /^(he|li)(\d{3,4}[a-z]?)-ap-\d{3}$/i;
const CAPACITY_PER_AP = 30;

function floorName(n: number): string {
  if (n === 0) return 'Ground Floor';
  if (n === 1) return '1st Floor';
  if (n === 2) return '2nd Floor';
  if (n === 3) return '3rd Floor';
  return `${n}th Floor`;
}

function occupancyStatus(occupancy: number, capacity: number): FinderSpace['status'] {
  const pct = capacity > 0 ? occupancy / capacity : 0;
  if (pct >= 0.7) return 'high';
  if (pct >= 0.4) return 'moderate';
  return 'low';
}

/** Derives live study spaces from /api/heatmap/current, grouped by building+floor, polled every 30s. */
export function useStudentSpaces(): { spaces: FinderSpace[]; loading: boolean } {
  const [spaces, setSpaces] = useState<FinderSpace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const aps = await fetchHeatmap();

      const floorMap = new Map<
        string,
        { buildingPrefix: string; floorNum: number; apCount: number; totalClients: number }
      >();

      for (const ap of aps) {
        const m = AP_REGEX.exec(ap.name?.toLowerCase() ?? '');
        if (!m) continue;
        const prefix = m[1]!;
        const roomStr = m[2]!;
        const roomNum = parseInt(roomStr.replace(/[a-z]/gi, ''), 10);
        const floor = Math.floor(roomNum / 100);
        const key = `${prefix}${floor}`;
        const count = Number(ap.client_count) + Number(ap.wired_client_count);
        const entry = floorMap.get(key) ?? { buildingPrefix: prefix, floorNum: floor, apCount: 0, totalClients: 0 };
        entry.apCount += 1;
        entry.totalClients += count;
        floorMap.set(key, entry);
      }

      const result: FinderSpace[] = [];
      for (const [, data] of floorMap) {
        const isLib = data.buildingPrefix === 'li';
        const capacity = data.apCount * CAPACITY_PER_AP;
        const occupancy = Math.min(data.totalClients, capacity);
        result.push({
          id: isLib ? 100 + data.floorNum : 200 + data.floorNum,
          name: isLib
            ? `Library \u2013 ${floorName(data.floorNum)}`
            : `Herzberg \u2013 ${floorName(data.floorNum)}`,
          building: isLib ? 'Main Library' : 'Herzberg Building',
          floor: floorName(data.floorNum),
          distance: isLib ? '120m' : '180m',
          noiseLevel: isLib ? 'Quiet' : 'Moderate',
          amenities: isLib
            ? ['wifi', 'outlets', 'quiet', 'natural-light']
            : ['wifi', 'whiteboard', 'projector'],
          occupancy,
          capacity,
          status: occupancyStatus(occupancy, capacity),
        });
      }

      // Sort by lowest occupancy ratio (most available first)
      result.sort((a, b) => a.occupancy / a.capacity - b.occupancy / b.capacity);

      setSpaces(result);
    } catch {
      // Keep stale data on error; don't wipe the list
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetch, 30_000);

  return { spaces, loading };
}
