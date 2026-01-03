const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

export type PexelsImage = {
  id: number;
  src: string;
  photographer?: string;
  url?: string;
};

export async function searchPexelsImages(query: string, per_page = 6): Promise<PexelsImage[]> {
  if (!PEXELS_API_KEY) throw new Error('Missing VITE_PEXELS_API_KEY in environment');
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Pexels API error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return (data.photos || []).map((p: any) => ({
    id: p.id,
    src: p.src?.large || p.src?.original || p.src?.medium,
    photographer: p.photographer,
    url: p.url,
  }));
}
