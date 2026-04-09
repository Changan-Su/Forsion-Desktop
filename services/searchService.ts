const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let abortController: AbortController | null = null;
const cache = new Map<string, { suggestions: string[]; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute
const MAX_CACHE = 50;

export async function fetchSuggestions(query: string, engine: string): Promise<string[]> {
  if (!query.trim()) return [];

  const cacheKey = `${engine}:${query}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Move to end for LRU
    cache.delete(cacheKey);
    cache.set(cacheKey, cached);
    return cached.suggestions;
  }

  // Abort previous request
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  try {
    const url = `${API_BASE_URL}/api/search/suggest?q=${encodeURIComponent(query)}&engine=${encodeURIComponent(engine)}`;
    const response = await fetch(url, {
      signal: abortController.signal,
    });

    if (!response.ok) return [];

    const data = await response.json();
    const suggestions: string[] = data.suggestions || [];

    // Cache result
    if (cache.size >= MAX_CACHE) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(cacheKey, { suggestions, timestamp: Date.now() });

    return suggestions;
  } catch (error: any) {
    if (error.name === 'AbortError') return [];
    console.error('[SearchService] Suggestion fetch error:', error.message);
    return [];
  }
}
