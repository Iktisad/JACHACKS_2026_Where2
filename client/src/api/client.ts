// Stub — implemented in Phase 6
export async function apiFetch<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = params
    ? `/api${path}?${new URLSearchParams(params)}`
    : `/api${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
