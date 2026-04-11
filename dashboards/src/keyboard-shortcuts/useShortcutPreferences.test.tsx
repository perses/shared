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

import { render, screen, act } from '@testing-library/react';
import { ReactElement } from 'react';
import { useShortcutPreferences } from './useShortcutPreferences';

const STORAGE_KEY = 'PERSES_KEYBOARD_SHORTCUTS';

/**
 * Test component that exposes useShortcutPreferences through the DOM.
 */
function PreferencesDisplay(): ReactElement {
  const { overrides, setOverride, removeOverride, resetAll } = useShortcutPreferences();
  return (
    <div>
      <div data-testid="overrides">{JSON.stringify(overrides)}</div>
      <button data-testid="set-go-home" onClick={() => setOverride('go-home', 'Mod+H')}>
        Set go-home
      </button>
      <button data-testid="set-save" onClick={() => setOverride('save-dashboard', 'Mod+Shift+S')}>
        Set save
      </button>
      <button data-testid="disable-go-home" onClick={() => setOverride('go-home', null)}>
        Disable go-home
      </button>
      <button data-testid="remove-go-home" onClick={() => removeOverride('go-home')}>
        Remove go-home
      </button>
      <button data-testid="remove-nonexistent" onClick={() => removeOverride('non-existent')}>
        Remove non-existent
      </button>
      <button data-testid="reset-all" onClick={() => resetAll()}>
        Reset all
      </button>
    </div>
  );
}

describe('useShortcutPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default overrides when localStorage is empty', () => {
    render(<PreferencesDisplay />);
    const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
    expect(overrides).toEqual({ version: 1, overrides: {} });
  });

  it('should read existing overrides from localStorage', () => {
    const stored = { version: 1, overrides: { 'go-home': 'Mod+H' } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    render(<PreferencesDisplay />);
    const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
    expect(overrides).toEqual(stored);
  });

  it('should return defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json');

    render(<PreferencesDisplay />);
    const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
    expect(overrides).toEqual({ version: 1, overrides: {} });
  });

  it('should return defaults when localStorage contains malformed data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));

    render(<PreferencesDisplay />);
    const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
    expect(overrides).toEqual({ version: 1, overrides: {} });
  });

  describe('setOverride', () => {
    it('should set a key override for a shortcut', () => {
      render(<PreferencesDisplay />);

      act(() => {
        screen.getByTestId('set-save').click();
      });

      const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
      expect(overrides.overrides['save-dashboard']).toBe('Mod+Shift+S');

      // Verify it persisted to localStorage
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.overrides['save-dashboard']).toBe('Mod+Shift+S');
    });

    it('should set null to disable a shortcut', () => {
      render(<PreferencesDisplay />);

      act(() => {
        screen.getByTestId('disable-go-home').click();
      });

      const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
      expect(overrides.overrides['go-home']).toBeNull();
    });

    it('should preserve existing overrides when adding new ones', () => {
      render(<PreferencesDisplay />);

      act(() => {
        screen.getByTestId('set-go-home').click();
      });

      act(() => {
        screen.getByTestId('set-save').click();
      });

      const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
      expect(overrides.overrides['go-home']).toBe('Mod+H');
      expect(overrides.overrides['save-dashboard']).toBe('Mod+Shift+S');
    });
  });

  describe('removeOverride', () => {
    it('should remove a specific override', () => {
      render(<PreferencesDisplay />);

      act(() => {
        screen.getByTestId('set-go-home').click();
      });
      act(() => {
        screen.getByTestId('set-save').click();
      });

      act(() => {
        screen.getByTestId('remove-go-home').click();
      });

      const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
      expect(overrides.overrides['go-home']).toBeUndefined();
      expect(overrides.overrides['save-dashboard']).toBe('Mod+Shift+S');
    });

    it('should be a no-op when removing a non-existent override', () => {
      render(<PreferencesDisplay />);

      act(() => {
        screen.getByTestId('remove-nonexistent').click();
      });

      const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
      expect(overrides).toEqual({ version: 1, overrides: {} });
    });
  });

  describe('resetAll', () => {
    it('should clear all overrides', () => {
      render(<PreferencesDisplay />);

      act(() => {
        screen.getByTestId('set-go-home').click();
      });
      act(() => {
        screen.getByTestId('disable-go-home').click();
      });

      act(() => {
        screen.getByTestId('reset-all').click();
      });

      const overrides = JSON.parse(screen.getByTestId('overrides').textContent!);
      expect(overrides).toEqual({ version: 1, overrides: {} });

      // Verify localStorage is also reset
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.overrides).toEqual({});
    });
  });
});
