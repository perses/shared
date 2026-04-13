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

import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ShortcutScope } from './types';

interface ScopeContextValue {
  activeScopes: Set<ShortcutScope>;
  activateScope: (scope: ShortcutScope) => void;
  deactivateScope: (scope: ShortcutScope) => void;
  focusedPanelKey: string | null;
  setFocusedPanel: (panelKey: string) => void;
  clearFocusedPanel: () => void;
}

const ScopeContext = createContext<ScopeContextValue | undefined>(undefined);

function useScopeContext(): ScopeContextValue {
  const ctx = useContext(ScopeContext);
  if (ctx === undefined) {
    throw new Error('Keyboard shortcut scope hooks must be used within a ScopeProvider');
  }
  return ctx;
}

export function ScopeProvider({ children }: { children: ReactNode }): ReactElement {
  // Keep scope activation reference counts so multiple hook instances can safely share a scope.
  const scopeRefCountRef = useRef<Record<ShortcutScope, number>>({
    global: 1,
    dashboard: 0,
    panel: 0,
  });
  const [activeScopes, setActiveScopes] = useState<Set<ShortcutScope>>(new Set(['global']));
  const [focusedPanelKey, setFocusedPanelKeyState] = useState<string | null>(null);

  const activateScope = useCallback((scope: ShortcutScope) => {
    const currentCount = scopeRefCountRef.current[scope] ?? 0;
    const nextCount = currentCount + 1;
    scopeRefCountRef.current[scope] = nextCount;

    if (currentCount === 0) {
      setActiveScopes((prev) => {
        const next = new Set(prev);
        next.add(scope);
        return next;
      });
    }
  }, []);

  const deactivateScope = useCallback((scope: ShortcutScope) => {
    const currentCount = scopeRefCountRef.current[scope] ?? 0;
    const baseline = scope === 'global' ? 1 : 0;
    if (currentCount <= baseline) {
      return;
    }

    const nextCount = currentCount - 1;
    scopeRefCountRef.current[scope] = nextCount;

    if (nextCount === 0) {
      setActiveScopes((prev) => {
        if (!prev.has(scope)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(scope);
        return next;
      });
    }
  }, []);

  const setFocusedPanel = useCallback((panelKey: string) => {
    setFocusedPanelKeyState(panelKey);
  }, []);

  const clearFocusedPanel = useCallback(() => {
    setFocusedPanelKeyState(null);
  }, []);

  const value = useMemo(
    (): ScopeContextValue => ({
      activeScopes,
      activateScope,
      deactivateScope,
      focusedPanelKey,
      setFocusedPanel,
      clearFocusedPanel,
    }),
    [activeScopes, activateScope, deactivateScope, focusedPanelKey, setFocusedPanel, clearFocusedPanel]
  );

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

/**
 * Activate a scope on mount, deactivate on unmount.
 */
export function useShortcutScope(scope: ShortcutScope): void {
  const { activateScope, deactivateScope } = useScopeContext();
  useEffect(() => {
    activateScope(scope);
    return (): void => {
      deactivateScope(scope);
    };
  }, [scope, activateScope, deactivateScope]);
}

/**
 * Returns the current set of active scopes.
 */
export function useActiveScopes(): Set<ShortcutScope> {
  return useScopeContext().activeScopes;
}

/**
 * Returns the currently focused panel key, or null.
 */
export function useFocusedPanel(): string | null {
  return useScopeContext().focusedPanelKey;
}

const PANEL_FOCUS_DEBOUNCE_MS = 50;

/**
 * Returns debounced onMouseEnter/onMouseLeave handlers for panel focus tracking.
 * Activates the 'panel' scope when the mouse enters and sets the focused panel key.
 * Deactivates the 'panel' scope immediately when the mouse leaves.
 */
export function usePanelFocusHandlers(panelKey: string): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  const { activateScope, deactivateScope, setFocusedPanel, clearFocusedPanel } = useScopeContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      activateScope('panel');
      setFocusedPanel(panelKey);
      timerRef.current = null;
    }, PANEL_FOCUS_DEBOUNCE_MS);
  }, [panelKey, activateScope, setFocusedPanel]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    deactivateScope('panel');
    clearFocusedPanel();
  }, [deactivateScope, clearFocusedPanel]);

  // Clean up timer on unmount
  useEffect(() => {
    return (): void => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useMemo(() => ({ onMouseEnter, onMouseLeave }), [onMouseEnter, onMouseLeave]);
}
