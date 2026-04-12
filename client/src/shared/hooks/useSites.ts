import { useState, useEffect } from 'react';
import { fetchSites, type Site } from '../../api/sites';

interface UseSitesResult {
  sites: Site[];
  loading: boolean;
  error: string | null;
}

export function useSites(): UseSitesResult {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites()
      .then((data) => { setSites(data); setError(null); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { sites, loading, error };
}
