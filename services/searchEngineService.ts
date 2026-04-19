import { DEFAULT_SEARCH_ENGINE, SEARCH_ENGINES, type SearchEngine } from '../constants';

/**
 * Shared localStorage key for the user's preferred search engine.
 * Used by both the desktop AIChat composer (PC) and the MobileHome search bar
 * so switching engines on one surface persists to the other.
 */
export const SEARCH_ENGINE_KEY = 'forsion_desktop_search_engine';

/** Read the saved engine id, falling back to DEFAULT_SEARCH_ENGINE ('bing'). */
export function getPreferredEngineId(): string {
  try {
    const saved = localStorage.getItem(SEARCH_ENGINE_KEY);
    if (saved && SEARCH_ENGINES.some(e => e.id === saved)) return saved;
  } catch {}
  return DEFAULT_SEARCH_ENGINE;
}

/** Persist the preferred engine id and notify other tabs/surfaces. */
export function setPreferredEngineId(engineId: string): void {
  try {
    localStorage.setItem(SEARCH_ENGINE_KEY, engineId);
    window.dispatchEvent(new CustomEvent('search-engine-changed', { detail: { engineId } }));
  } catch {}
}

/** Resolve an engine id to its full SearchEngine object (or undefined). */
export function findEngine(engineId: string): SearchEngine | undefined {
  return SEARCH_ENGINES.find(e => e.id === engineId);
}

/**
 * Perform a web search by opening the engine's search URL in a new tab.
 * Returns true if a search was triggered, false if the engine has no URL
 * (e.g. the 'ai' engine which should route to chat instead).
 */
export function openSearchInNewTab(engineId: string, query: string): boolean {
  const engine = findEngine(engineId);
  if (!engine || !engine.searchUrl) return false;
  const q = query.trim();
  if (!q) return false;
  const url = engine.searchUrl.replace('{query}', encodeURIComponent(q));
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
