export function formatEpoch(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString();
}

export function formatEpochFull(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString();
}

export function getBuilding(apName: string): 'library' | 'herzberg' | null {
  const n = apName.toLowerCase();
  if (n.startsWith('li')) return 'library';
  if (n.startsWith('he')) return 'herzberg';
  return null;
}
