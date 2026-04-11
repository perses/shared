// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useCallback, useSyncExternalStore } from 'react';
import { ShortcutOverrides } from './types';

const STORAGE_KEY = 'PERSES_KEYBOARD_SHORTCUTS';
const DEFAULT_OVERRIDES: ShortcutOverrides = { version: 1, overrides: {} };

/**
 * Simple pub/sub for cross-component reactivity when localStorage changes.
 */
const listeners = new Set<() => void>();
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
}
function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readOverrides(): ShortcutOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ShortcutOverrides;
      if (parsed && typeof parsed.version === 'number' && parsed.overrides) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_OVERRIDES;
}

/**
 * Cached snapshot for useSyncExternalStore. Must return the same reference
 * when the underlying data has not changed, otherwise React will re-render
 * infinitely.
 */
let cachedSnapshot: ShortcutOverrides = readOverrides();
let cachedRaw: string | null = localStorage.getItem(STORAGE_KEY);

function writeOverrides(overrides: ShortcutOverrides): void {
  const json = JSON.stringify(overrides);
  localStorage.setItem(STORAGE_KEY, json);
  cachedRaw = json;
  cachedSnapshot = overrides;
  emitChange();
}

function getSnapshot(): ShortcutOverrides {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = readOverrides();
  }
  return cachedSnapshot;
}

/**
 * Hook for reading and writing user keyboard shortcut override preferences.
 * Uses useSyncExternalStore for cross-component reactivity.
 */
export function useShortcutPreferences(): {
  overrides: ShortcutOverrides;
  setOverride: (id: string, keys: string | null) => void;
  removeOverride: (id: string) => void;
  resetAll: () => void;
} {
  const overrides = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setOverride = useCallback((id: string, keys: string | null) => {
    const current = readOverrides();
    writeOverrides({
      ...current,
      overrides: { ...current.overrides, [id]: keys },
    });
  }, []);

  const removeOverride = useCallback((id: string) => {
    const current = readOverrides();
    const { [id]: _, ...rest } = current.overrides;
    writeOverrides({ ...current, overrides: rest });
  }, []);

  const resetAll = useCallback(() => {
    writeOverrides(DEFAULT_OVERRIDES);
  }, []);

  return { overrides, setOverride, removeOverride, resetAll };
}
