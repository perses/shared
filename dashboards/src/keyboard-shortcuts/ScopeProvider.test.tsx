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

import { render, screen, act, renderHook } from '@testing-library/react';
import { ReactElement, useState } from 'react';
import {
  ScopeProvider,
  useShortcutScope,
  useActiveScopes,
  useFocusedPanel,
  usePanelFocusHandlers,
} from './ScopeProvider';

/**
 * Test component that renders scope information as text for assertion.
 */
function ScopeDisplay(): ReactElement {
  const scopes = useActiveScopes();
  return <div data-testid="scopes">{Array.from(scopes).sort().join(',')}</div>;
}

/**
 * Test component that activates a scope when mounted.
 */
function ScopeActivator({
  scope,
  show = true,
}: {
  scope: 'global' | 'dashboard' | 'panel';
  show?: boolean;
}): ReactElement | null {
  useShortcutScope(scope);
  return show ? <div data-testid={`activator-${scope}`}>active</div> : null;
}

/**
 * Test component that conditionally mounts/unmounts a ScopeActivator.
 */
function ToggleableScope({ scope }: { scope: 'global' | 'dashboard' | 'panel' }): ReactElement {
  const [mounted, setMounted] = useState(true);
  return (
    <>
      {mounted && <ScopeActivator scope={scope} />}
      <button data-testid={`toggle-${scope}`} onClick={() => setMounted((v) => !v)}>
        toggle
      </button>
    </>
  );
}

/**
 * Test component for panel focus handlers.
 */
function PanelFocusTest({ panelKey }: { panelKey: string }): ReactElement {
  const { onMouseEnter, onMouseLeave } = usePanelFocusHandlers(panelKey);
  const focused = useFocusedPanel();
  const scopes = useActiveScopes();
  return (
    <div>
      <div data-testid="panel-target" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        panel
      </div>
      <div data-testid="focused-panel">{focused ?? 'none'}</div>
      <div data-testid="panel-scopes">{Array.from(scopes).sort().join(',')}</div>
      <button data-testid="enter-btn" onClick={onMouseEnter}>
        enter
      </button>
      <button data-testid="leave-btn" onClick={onMouseLeave}>
        leave
      </button>
    </div>
  );
}

describe('ScopeProvider', () => {
  describe('useActiveScopes', () => {
    it('should have global scope active by default', () => {
      render(
        <ScopeProvider>
          <ScopeDisplay />
        </ScopeProvider>
      );
      expect(screen.getByTestId('scopes').textContent).toBe('global');
    });
  });

  describe('useShortcutScope', () => {
    it('should activate scope on mount and deactivate on unmount', () => {
      render(
        <ScopeProvider>
          <ScopeDisplay />
          <ToggleableScope scope="dashboard" />
        </ScopeProvider>
      );

      // Dashboard scope should be active
      expect(screen.getByTestId('scopes').textContent).toBe('dashboard,global');

      // Unmount the dashboard scope activator
      act(() => {
        screen.getByTestId('toggle-dashboard').click();
      });

      expect(screen.getByTestId('scopes').textContent).toBe('global');
    });

    it('should handle multiple scopes simultaneously', () => {
      function MultiScope(): ReactElement {
        const [showDashboard, setShowDashboard] = useState(true);
        const [showPanel, setShowPanel] = useState(true);
        return (
          <ScopeProvider>
            <ScopeDisplay />
            {showDashboard && <ScopeActivator scope="dashboard" />}
            {showPanel && <ScopeActivator scope="panel" />}
            <button data-testid="remove-dashboard" onClick={() => setShowDashboard(false)}>
              remove dashboard
            </button>
            <button data-testid="remove-panel" onClick={() => setShowPanel(false)}>
              remove panel
            </button>
          </ScopeProvider>
        );
      }

      render(<MultiScope />);

      expect(screen.getByTestId('scopes').textContent).toBe('dashboard,global,panel');

      act(() => {
        screen.getByTestId('remove-dashboard').click();
      });

      expect(screen.getByTestId('scopes').textContent).toBe('global,panel');

      act(() => {
        screen.getByTestId('remove-panel').click();
      });

      expect(screen.getByTestId('scopes').textContent).toBe('global');
    });
  });

  describe('useFocusedPanel', () => {
    it('should return null when no panel is focused', () => {
      render(
        <ScopeProvider>
          <PanelFocusTest panelKey="panel-1" />
        </ScopeProvider>
      );
      expect(screen.getByTestId('focused-panel').textContent).toBe('none');
    });
  });

  describe('usePanelFocusHandlers', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should activate panel scope and set focused panel on mouse enter after debounce', () => {
      render(
        <ScopeProvider>
          <PanelFocusTest panelKey="panel-1" />
        </ScopeProvider>
      );

      act(() => {
        screen.getByTestId('enter-btn').click();
      });

      // Before debounce fires, panel scope should not be active
      expect(screen.getByTestId('panel-scopes').textContent).toBe('global');

      // After debounce (50ms)
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(screen.getByTestId('panel-scopes').textContent).toBe('global,panel');
      expect(screen.getByTestId('focused-panel').textContent).toBe('panel-1');
    });

    it('should deactivate panel scope and clear focused panel on mouse leave', () => {
      render(
        <ScopeProvider>
          <PanelFocusTest panelKey="panel-1" />
        </ScopeProvider>
      );

      // First activate
      act(() => {
        screen.getByTestId('enter-btn').click();
        jest.advanceTimersByTime(50);
      });

      expect(screen.getByTestId('panel-scopes').textContent).toBe('global,panel');

      // Then deactivate
      act(() => {
        screen.getByTestId('leave-btn').click();
      });

      expect(screen.getByTestId('panel-scopes').textContent).toBe('global');
      expect(screen.getByTestId('focused-panel').textContent).toBe('none');
    });

    it('should cancel pending enter when mouse leaves before debounce fires', () => {
      render(
        <ScopeProvider>
          <PanelFocusTest panelKey="panel-1" />
        </ScopeProvider>
      );

      act(() => {
        screen.getByTestId('enter-btn').click();
      });

      // Leave before the 50ms debounce fires
      act(() => {
        jest.advanceTimersByTime(30);
        screen.getByTestId('leave-btn').click();
      });

      // Advance past the debounce time
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Panel scope should never have been activated
      expect(screen.getByTestId('panel-scopes').textContent).toBe('global');
    });
  });

  describe('error handling', () => {
    it('should throw when hooks are used outside ScopeProvider', () => {
      // Suppress console.error during expected error
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useActiveScopes());
      }).toThrow('Keyboard shortcut scope hooks must be used within a ScopeProvider');

      spy.mockRestore();
    });
  });
});
