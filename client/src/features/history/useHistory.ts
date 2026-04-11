import { useState, useEffect, useCallback } from 'react';
import { fetchHistory } from '../../api/history';
import { usePolling } from '../../shared/hooks/usePolling';
import type { HistoryPoint, HistoryParams } from './types';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useHistory(params: HistoryParams) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { from, to, ap_id } = params;

  // Stable load function — recreated only when filter params change
  const load = useCallback(() => {
    fetchHistory({ from, to, ap_id })
      .then((result) => { setData(result); setError(null); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [from, to, ap_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading indicator and re-fetch whenever params change (or on mount)
  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Background auto-refresh every 5 minutes (no loading flash)
  usePolling(load, FIVE_MINUTES, false);

  return { data, loading, error };
}

