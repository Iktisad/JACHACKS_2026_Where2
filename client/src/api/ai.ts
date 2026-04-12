import type { SpaceFinderCriteria, SpaceFinderResult } from '../student/services/spaceFinder.js';

export async function suggestSpace(criteria: SpaceFinderCriteria): Promise<SpaceFinderResult> {
  const res = await fetch('/api/ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(criteria),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<SpaceFinderResult>;
}
