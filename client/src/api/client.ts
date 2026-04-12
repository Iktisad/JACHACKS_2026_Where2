export async function apiFetch<T>(
  path: string,
  params?: Record<string, string>,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  const url = params
    ? `/api${path}?${new URLSearchParams(params)}`
    : `/api${path}`;
  const res = await fetch(url, {
    method,
    signal: AbortSignal.timeout(10_000),
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(errBody.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
