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

import React, {
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

interface PanelFocusContextValue {
  focusedPanelKey: string | null;
  setFocusedPanel: (panelKey: string) => void;
  clearFocusedPanel: () => void;
}

const PanelFocusContext = createContext<PanelFocusContextValue | undefined>(undefined);

function usePanelFocusContext(): PanelFocusContextValue {
  const ctx = useContext(PanelFocusContext);
  if (ctx === undefined) {
    throw new Error('Panel focus hooks must be used within a PanelFocusProvider');
  }
  return ctx;
}

/** Tracks which dashboard panel is currently focused (hovered) for panel-scoped shortcuts. */
export function PanelFocusProvider({ children }: { children: ReactNode }): ReactElement {
  const [focusedPanelKey, setFocusedPanelKeyState] = useState<string | null>(null);

  const setFocusedPanel = useCallback((panelKey: string) => {
    setFocusedPanelKeyState(panelKey);
  }, []);

  const clearFocusedPanel = useCallback(() => {
    setFocusedPanelKeyState(null);
  }, []);

  const value = useMemo(
    (): PanelFocusContextValue => ({
      focusedPanelKey,
      setFocusedPanel,
      clearFocusedPanel,
    }),
    [focusedPanelKey, setFocusedPanel, clearFocusedPanel]
  );

  return <PanelFocusContext.Provider value={value}>{children}</PanelFocusContext.Provider>;
}

export function useFocusedPanel(): string | null {
  return usePanelFocusContext().focusedPanelKey;
}

const PANEL_FOCUS_DEBOUNCE_MS = 50;

/** Debounced mouse enter/leave handlers for panel focus. Add `tabIndex={-1}` to the panel element. */
export function usePanelFocusHandlers(panelKey: string): {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
} {
  const { setFocusedPanel, clearFocusedPanel } = usePanelFocusContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const element = e.currentTarget;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setFocusedPanel(panelKey);
        element.focus({ preventScroll: true });
        timerRef.current = null;
      }, PANEL_FOCUS_DEBOUNCE_MS);
    },
    [panelKey, setFocusedPanel]
  );

  const onMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    clearFocusedPanel();
  }, [clearFocusedPanel]);

  useEffect(() => {
    return (): void => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useMemo(() => ({ onMouseEnter, onMouseLeave }), [onMouseEnter, onMouseLeave]);
}
