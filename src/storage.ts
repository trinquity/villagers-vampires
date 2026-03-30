import type { GameState } from './game';
import type { Locale } from './i18n';

export const STORAGE_KEY = 'vampire-villagers/game-state/v2';
export const LOCALE_STORAGE_KEY = 'vampire-villagers/locale/v1';

export function loadGameState(): GameState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || parsed.version !== 2) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveGameState(gameState: GameState | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!gameState) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

export function loadLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'tr';
  }

  const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return value === 'en' ? 'en' : 'tr';
}

export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
