import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePexels } from '@/hooks/usePexels';

type NominatimResult = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
};

export default function CitySearch({
  onSelect,
}: {
  onSelect: (city: { name: string; country?: string; lat: number; lon: number }) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { images } = usePexels(query, 6);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(
        query
      )}`,
      { signal: controller.signal, headers: { 'User-Agent': 'travia/1.0' } }
    )
      .then((res) => res.json())
      .then((data) => setResults(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  return (
    <div>
      <div className="relative max-w-xl mx-auto mb-6">
        <Input
          placeholder="Search a city (e.g. Paris, India)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-4"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Searching cities...</p>}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {results.map((r) => {
            const nameParts = r.display_name.split(',').map((s) => s.trim());
            const name = nameParts[0];
            const country = nameParts[nameParts.length - 1];
            return (
              <div key={r.place_id} className="bg-card rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-muted-foreground">{country}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onSelect({ name, country, lat: Number(r.lat), lon: Number(r.lon) })
                    }
                  >
                    Select
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {images.length > 0 && (
        <div>
          <h4 className="font-display text-lg font-bold mb-2">Photos</h4>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <img key={img.id} src={img.src} alt={img.photographer} className="w-full h-24 object-cover rounded-md" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
