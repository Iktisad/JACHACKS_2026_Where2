/**
 * Space matching via Gemini AI (server-side Vertex AI).
 * Falls back to local scoring if the API call fails.
 */

import { suggestSpace as apiSuggestSpace } from '../../api/ai.js';

export type FinderSpace = {
  id: number;
  name: string;
  building: string;
  occupancy: number;
  capacity: number;
  status: "low" | "moderate" | "high";
  floor: string;
  distance: string;
  noiseLevel: string;
  amenities: string[];
};

export type SpaceFinderCriteria = {
  building: string;
  environment: string;
  duration: string;
};

export type SpaceFinderResult = {
  space: FinderSpace;
  insight: string;
};

function scoreSpace(space: FinderSpace, criteria: SpaceFinderCriteria): number {
  let score = 0;
  if (criteria.building !== "all" && space.building === criteria.building) {
    score += 40;
  }

  const env = criteria.environment;
  if (env === "silent") {
    if (space.noiseLevel === "Silent") score += 35;
    if (space.amenities.includes("quiet")) score += 15;
    if (space.status === "low") score += 10;
  } else if (env === "quiet") {
    if (space.noiseLevel === "Silent" || space.noiseLevel === "Quiet") score += 30;
    if (space.status !== "high") score += 10;
  } else if (env === "collaborative") {
    if (space.amenities.includes("whiteboard") || space.amenities.includes("projector")) score += 25;
    if (space.noiseLevel === "Moderate") score += 15;
    if (space.status !== "high") score += 10;
  }

  const dur = criteria.duration;
  if (dur === "long") {
    if (space.amenities.includes("outlets")) score += 15;
    if (space.status === "low") score += 10;
  } else if (dur === "medium") {
    score += 5;
  }

  const free = space.capacity - space.occupancy;
  score += Math.min(20, free);

  return score;
}

export async function runSpaceFinder(
  criteria: SpaceFinderCriteria,
  spaces: FinderSpace[]
): Promise<SpaceFinderResult> {
  try {
    const result = await apiSuggestSpace(criteria);
    return result;
  } catch (err) {
    console.warn('[spaceFinder] AI API unavailable, falling back to local scoring:', err);
    return localFallback(criteria, spaces);
  }
}

function localFallback(
  criteria: SpaceFinderCriteria,
  spaces: FinderSpace[]
): SpaceFinderResult {
  let best = spaces[0]!;
  let bestScore = -1;
  for (const space of spaces) {
    const s = scoreSpace(space, criteria);
    if (s > bestScore) {
      bestScore = s;
      best = space;
    }
  }

  const envLabel =
    criteria.environment === 'silent'
      ? 'a silent focus block'
      : criteria.environment === 'quiet'
        ? 'quiet reading or light work'
        : 'collaborative work';

  const buildingNote =
    criteria.building === 'all' ? 'across campus' : `in ${criteria.building}`;

  const insight = `Matched for ${envLabel} ${buildingNote}. We prioritized availability, noise level, and amenities for your ${criteria.duration === 'long' ? 'longer' : criteria.duration === 'short' ? 'short' : 'mid-length'} session.`;

  return { space: best, insight };
}
