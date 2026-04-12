import { useState, useCallback } from 'react';
import { fetchHeatmap } from '../../api/heatmap';
import { usePolling } from '../../shared/hooks/usePolling';
import type { FinderSpace } from '../services/spaceFinder';

const CAPACITY = 30;

function occupancyStatus(occupancy: number): FinderSpace['status'] {
  const pct = occupancy / CAPACITY;
  if (pct >= 0.7) return 'high';
  if (pct >= 0.4) return 'moderate';
  return 'low';
}

/** Derives live study spaces from /api/heatmap/current, polled every 30s. */
export function useStudentSpaces(): { spaces: FinderSpace[]; loading: boolean } {
  const [spaces, setSpaces] = useState<FinderSpace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const aps = await fetchHeatmap();

      let libraryClients = 0;
      let herzbergClients = 0;

      for (const ap of aps) {
        const name = ap.name.toLowerCase();
        const count = Number(ap.client_count) + Number(ap.wired_client_count);
        if (name.startsWith('li')) {
          libraryClients += count;
        } else if (name.startsWith('he')) {
          herzbergClients += count;
        }
      }

      // Cap at capacity
      const libOccupancy = Math.min(libraryClients, CAPACITY);
      const heOccupancy = Math.min(herzbergClients, CAPACITY);

      setSpaces([
        {
          id: 2,
          name: 'Library 3F',
          building: 'Main Library',
          floor: '3rd Floor',
          distance: '120m',
          noiseLevel: 'Quiet',
          amenities: ['wifi', 'outlets', 'quiet', 'natural-light'],
          occupancy: libOccupancy,
          capacity: CAPACITY,
          status: occupancyStatus(libOccupancy),
        },
        {
          id: 3,
          name: 'Herzberg 204',
          building: 'Herzberg Building',
          floor: '2nd Floor',
          distance: '180m',
          noiseLevel: 'Moderate',
          amenities: ['wifi', 'whiteboard', 'projector'],
          occupancy: heOccupancy,
          capacity: CAPACITY,
          status: occupancyStatus(heOccupancy),
        },
      ]);
    } catch {
      // Keep stale data on error; don't wipe the list
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetch, 30_000);

  return { spaces, loading };
}
