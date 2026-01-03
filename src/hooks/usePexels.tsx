import { useEffect, useState } from 'react';
import type { PexelsImage } from '@/integrations/pexels/client';
import { searchPexelsImages } from '@/integrations/pexels/client';

export function usePexels(query?: string, perPage = 6) {
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setImages([]);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    searchPexelsImages(query, perPage)
      .then((res) => {
        if (mounted) setImages(res || []);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [query, perPage]);

  return { images, loading, error } as const;
}
