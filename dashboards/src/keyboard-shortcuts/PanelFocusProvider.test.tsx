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

import { render, screen, act, renderHook, fireEvent } from '@testing-library/react';
import { ReactElement } from 'react';
import { PanelFocusProvider, useFocusedPanel, usePanelFocusHandlers } from './PanelFocusProvider';

/**
 * Test component for panel focus handlers.
 */
function PanelFocusTest({ panelKey }: { panelKey: string }): ReactElement {
  const { onMouseEnter, onMouseLeave } = usePanelFocusHandlers(panelKey);
  const focused = useFocusedPanel();
  return (
    <div>
      <div
        data-testid="panel-target"
        tabIndex={-1}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ outline: 'none' }}
      >
        panel
      </div>
      <div data-testid="focused-panel">{focused ?? 'none'}</div>
    </div>
  );
}

describe('PanelFocusProvider', () => {
  describe('useFocusedPanel', () => {
    it('should return null when no panel is focused', () => {
      render(
        <PanelFocusProvider>
          <PanelFocusTest panelKey="panel-1" />
        </PanelFocusProvider>
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

    it('should set focused panel on mouse enter after debounce', () => {
      render(
        <PanelFocusProvider>
          <PanelFocusTest panelKey="panel-1" />
        </PanelFocusProvider>
      );

      act(() => {
        fireEvent.mouseEnter(screen.getByTestId('panel-target'));
      });

      // Before debounce fires, panel should not be focused
      expect(screen.getByTestId('focused-panel').textContent).toBe('none');

      // After debounce (50ms)
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(screen.getByTestId('focused-panel').textContent).toBe('panel-1');
    });

    it('should focus the element on mouse enter after debounce', () => {
      render(
        <PanelFocusProvider>
          <PanelFocusTest panelKey="panel-1" />
        </PanelFocusProvider>
      );

      const panelTarget = screen.getByTestId('panel-target');
      const focusSpy = jest.spyOn(panelTarget, 'focus');

      act(() => {
        fireEvent.mouseEnter(panelTarget);
      });

      expect(focusSpy).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      focusSpy.mockRestore();
    });

    it('should clear focused panel on mouse leave', () => {
      render(
        <PanelFocusProvider>
          <PanelFocusTest panelKey="panel-1" />
        </PanelFocusProvider>
      );

      // First activate
      act(() => {
        fireEvent.mouseEnter(screen.getByTestId('panel-target'));
        jest.advanceTimersByTime(50);
      });

      expect(screen.getByTestId('focused-panel').textContent).toBe('panel-1');

      // Then deactivate
      act(() => {
        fireEvent.mouseLeave(screen.getByTestId('panel-target'));
      });

      expect(screen.getByTestId('focused-panel').textContent).toBe('none');
    });

    it('should cancel pending enter when mouse leaves before debounce fires', () => {
      render(
        <PanelFocusProvider>
          <PanelFocusTest panelKey="panel-1" />
        </PanelFocusProvider>
      );

      act(() => {
        fireEvent.mouseEnter(screen.getByTestId('panel-target'));
      });

      // Leave before the 50ms debounce fires
      act(() => {
        jest.advanceTimersByTime(30);
        fireEvent.mouseLeave(screen.getByTestId('panel-target'));
      });

      // Advance past the debounce time
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Panel should never have been focused
      expect(screen.getByTestId('focused-panel').textContent).toBe('none');
    });
  });

  describe('error handling', () => {
    it('should throw when hooks are used outside PanelFocusProvider', () => {
      // Suppress console.error during expected error
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFocusedPanel());
      }).toThrow('Panel focus hooks must be used within a PanelFocusProvider');

      spy.mockRestore();
    });
  });
});
