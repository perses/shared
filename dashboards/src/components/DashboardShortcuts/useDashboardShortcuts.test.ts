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

import { act, renderHook, waitFor } from '@testing-library/react';
import { DashboardResource } from '../../model';
import { useDashboardShortcuts } from './useDashboardShortcuts';

const mockInfoSnackbar = jest.fn();
const mockWarningSnackbar = jest.fn();
const mockExceptionSnackbar = jest.fn();

const mockSetEditMode = jest.fn();
let mockIsEditMode = false;

const mockDashboardStoreActions = {
  openEditPanel: jest.fn(),
  duplicatePanel: jest.fn(),
  openDeletePanelDialog: jest.fn(),
  setViewPanel: jest.fn(),
  panelEditor: undefined,
};

const mockDashboard: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'test-dashboard',
    project: 'test-project',
    version: 1,
  },
  spec: {
    display: { name: 'Test Dashboard' },
    duration: '30m',
    refreshInterval: '0s',
    panels: {},
    layouts: [],
    variables: [],
  },
};

jest.mock('@perses-dev/components', () => ({
  useSnackbar: (): {
    infoSnackbar: typeof mockInfoSnackbar;
    warningSnackbar: typeof mockWarningSnackbar;
    exceptionSnackbar: typeof mockExceptionSnackbar;
  } => ({
    infoSnackbar: mockInfoSnackbar,
    warningSnackbar: mockWarningSnackbar,
    exceptionSnackbar: mockExceptionSnackbar,
  }),
}));

const mockSetTimeRange = jest.fn();
const mockRefresh = jest.fn();

jest.mock('@perses-dev/plugin-system', () => ({
  useTimeRange: (): {
    timeRange: { pastDuration: string };
    setTimeRange: jest.Mock;
    refresh: jest.Mock;
  } => ({
    timeRange: { pastDuration: '30m' },
    setTimeRange: mockSetTimeRange,
    refresh: mockRefresh,
  }),
}));

// Capture the latest callbacks passed to TanStack hooks so tests can invoke them directly.
let latestHotkeyConfigs: Array<{ hotkey: string; callback: () => void }> = [];
let latestSequenceConfigs: Array<{ sequence: string[]; callback: () => void }> = [];

jest.mock('@tanstack/react-hotkeys', () => ({
  useHotkeys: jest.fn((configs: Array<{ hotkey: string; callback: () => void }>) => {
    latestHotkeyConfigs = configs;
  }),
  useHotkeySequences: jest.fn((configs: Array<{ sequence: string[]; callback: () => void }>) => {
    latestSequenceConfigs = configs;
  }),
}));

jest.mock('../../context', () => ({
  useDashboard: (): { dashboard: DashboardResource; setDashboard: jest.Mock } => ({
    dashboard: mockDashboard,
    setDashboard: jest.fn(),
  }),
}));

jest.mock('../../context/DashboardProvider', () => ({
  useEditMode: (): { isEditMode: boolean; setEditMode: typeof mockSetEditMode } => ({
    isEditMode: mockIsEditMode,
    setEditMode: mockSetEditMode,
  }),
  useDashboardStore: (): typeof mockDashboardStoreActions => mockDashboardStoreActions,
  useViewPanelGroup: (): undefined => undefined,
  useSaveDashboard: (onSave?: (dashboard: DashboardResource) => Promise<void>): { saveDashboard: () => void } => ({
    saveDashboard: (): void => {
      if (onSave) {
        onSave(mockDashboard);
      }
      mockSetEditMode(false);
    },
  }),
}));

jest.mock('../../keyboard-shortcuts', () => ({
  useFocusedPanel: (): null => null,
  buildShortcutOptions: jest.fn(() => ({ enabled: true, meta: {} })),
  requireShortcutHotkey: (def: { hotkey?: string }): string => def.hotkey ?? 'missing-hotkey',
  requireShortcutSequence: (def: { sequence?: string[] }): string[] => def.sequence ?? ['missing-sequence'],

  SAVE_DASHBOARD_SHORTCUT: { hotkey: 'Mod+S', event: 'perses:save-dashboard' },
  REFRESH_DASHBOARD_SHORTCUT: { sequence: ['D', 'R'], event: 'perses:refresh-dashboard' },
  TOGGLE_EDIT_MODE_SHORTCUT: { sequence: ['D', 'M'], event: 'perses:toggle-edit-mode' },
  TIME_ZOOM_OUT_SHORTCUT: { sequence: ['T', 'O'], event: 'perses:time-zoom-out' },
  TIME_ZOOM_IN_SHORTCUT: { sequence: ['T', 'I'], event: 'perses:time-zoom-in' },
  TIME_SHIFT_BACK_SHORTCUT: { sequence: ['T', 'ArrowLeft'], event: 'perses:time-shift-back' },
  TIME_SHIFT_FORWARD_SHORTCUT: { sequence: ['T', 'ArrowRight'], event: 'perses:time-shift-forward' },
  TIME_MAKE_ABSOLUTE_SHORTCUT: { sequence: ['T', 'A'], event: 'perses:time-make-absolute' },
  TIME_COPY_SHORTCUT: { sequence: ['T', 'C'], event: 'perses:time-copy' },
  TIME_PASTE_SHORTCUT: { sequence: ['T', 'V'], event: 'perses:time-paste' },
  PANEL_EDIT_SHORTCUT: { hotkey: 'E', event: 'perses:panel-edit' },
  PANEL_FULLSCREEN_SHORTCUT: { hotkey: 'V', event: 'perses:panel-fullscreen' },
  PANEL_DUPLICATE_SHORTCUT: { sequence: ['P', 'D'], event: 'perses:panel-duplicate' },
  PANEL_DELETE_SHORTCUT: { sequence: ['P', 'R'], event: 'perses:panel-delete' },
}));

/**
 * Helper to find and invoke a captured hotkey callback by key string.
 */
function triggerHotkey(hotkey: string): void {
  const config = latestHotkeyConfigs.find((c) => c.hotkey === hotkey);
  if (!config) {
    throw new Error(`No registered hotkey found for "${hotkey}"`);
  }
  config.callback();
}

/**
 * Helper to find and invoke a captured sequence callback by sequence array.
 */
function triggerSequence(sequence: string[]): void {
  const key = JSON.stringify(sequence);
  const config = latestSequenceConfigs.find((c) => JSON.stringify(c.sequence) === key);
  if (!config) {
    throw new Error(`No registered sequence found for ${key}`);
  }
  config.callback();
}

describe('useDashboardShortcuts save behavior', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    latestHotkeyConfigs = [];
    latestSequenceConfigs = [];
    jest.clearAllMocks();
  });

  it('shows an info snackbar when save shortcut is used outside edit mode', async () => {
    const onSave = jest.fn(async () => undefined);
    renderHook(() => useDashboardShortcuts({ onSave, isReadonly: false }));

    act(() => {
      triggerHotkey('Mod+S');
    });

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
      expect(mockInfoSnackbar).toHaveBeenCalledWith('Enter edit mode to save this dashboard.');
    });
  });

  it('shows a warning snackbar when dashboard is read-only', async () => {
    const onSave = jest.fn(async () => undefined);
    mockIsEditMode = true;
    renderHook(() => useDashboardShortcuts({ onSave, isReadonly: true }));

    act(() => {
      triggerHotkey('Mod+S');
    });

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
      expect(mockWarningSnackbar).toHaveBeenCalledWith('This dashboard is read-only. Keyboard save is disabled.');
    });
  });

  it('calls save callback and exits edit mode when save shortcut is used in edit mode', async () => {
    const onSave = jest.fn(async () => undefined);
    mockIsEditMode = true;
    renderHook(() => useDashboardShortcuts({ onSave, isReadonly: false }));

    act(() => {
      triggerHotkey('Mod+S');
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockDashboard);
      expect(mockSetEditMode).toHaveBeenCalledWith(false);
    });
  });
});

describe('useDashboardShortcuts paste time range behavior', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    latestHotkeyConfigs = [];
    latestSequenceConfigs = [];
    jest.clearAllMocks();
  });

  it('sets time range when clipboard contains a valid time range', async () => {
    const start = '2026-04-13T10:00:00.000Z';
    const end = '2026-04-13T11:00:00.000Z';
    Object.assign(navigator, {
      clipboard: { readText: jest.fn().mockResolvedValue(`${start} - ${end}`) },
    });

    renderHook(() => useDashboardShortcuts({ isReadonly: false }));

    act(() => {
      triggerSequence(['T', 'V']);
    });

    await waitFor(() => {
      expect(mockSetTimeRange).toHaveBeenCalledWith({
        start: new Date(start),
        end: new Date(end),
      });
    });
  });

  it('shows a warning snackbar when clipboard text is not a valid time range', async () => {
    Object.assign(navigator, {
      clipboard: { readText: jest.fn().mockResolvedValue('not a time range') },
    });

    renderHook(() => useDashboardShortcuts({ isReadonly: false }));

    act(() => {
      triggerSequence(['T', 'V']);
    });

    await waitFor(() => {
      expect(mockSetTimeRange).not.toHaveBeenCalled();
      expect(mockWarningSnackbar).toHaveBeenCalledWith(
        'Clipboard does not contain a valid time range. Expected format: "<ISO date format> - <ISO date format>".'
      );
    });
  });

  it('shows a warning snackbar when start is not before end', async () => {
    const start = '2026-04-13T12:00:00.000Z';
    const end = '2026-04-13T10:00:00.000Z';
    Object.assign(navigator, {
      clipboard: { readText: jest.fn().mockResolvedValue(`${start} - ${end}`) },
    });

    renderHook(() => useDashboardShortcuts({ isReadonly: false }));

    act(() => {
      triggerSequence(['T', 'V']);
    });

    await waitFor(() => {
      expect(mockSetTimeRange).not.toHaveBeenCalled();
      expect(mockWarningSnackbar).toHaveBeenCalledWith('Invalid time range: start must be before end.');
    });
  });

  it('shows a warning snackbar when clipboard read fails', async () => {
    Object.assign(navigator, {
      clipboard: { readText: jest.fn().mockRejectedValue(new Error('Permission denied')) },
    });

    renderHook(() => useDashboardShortcuts({ isReadonly: false }));

    act(() => {
      triggerSequence(['T', 'V']);
    });

    await waitFor(() => {
      expect(mockSetTimeRange).not.toHaveBeenCalled();
      expect(mockWarningSnackbar).toHaveBeenCalledWith('Unable to read from clipboard. Check browser permissions.');
    });
  });
});

describe('useDashboardShortcuts toggle edit mode behavior', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    latestHotkeyConfigs = [];
    latestSequenceConfigs = [];
    jest.clearAllMocks();
  });

  it('calls onCancelButtonClick when toggling from edit to view mode', async () => {
    mockIsEditMode = true;
    const onCancelButtonClick = jest.fn();
    renderHook(() => useDashboardShortcuts({ isReadonly: false, onCancelButtonClick }));

    act(() => {
      triggerSequence(['D', 'M']);
    });

    await waitFor(() => {
      expect(onCancelButtonClick).toHaveBeenCalled();
      expect(mockSetEditMode).not.toHaveBeenCalled();
    });
  });

  it('calls onEditButtonClick when toggling from view to edit mode', async () => {
    mockIsEditMode = false;
    const onEditButtonClick = jest.fn();
    renderHook(() => useDashboardShortcuts({ isReadonly: false, onEditButtonClick }));

    act(() => {
      triggerSequence(['D', 'M']);
    });

    await waitFor(() => {
      expect(onEditButtonClick).toHaveBeenCalled();
      expect(mockSetEditMode).not.toHaveBeenCalled();
    });
  });

  it('falls back to setEditMode(false) when toggling from edit to view without onCancelButtonClick', async () => {
    mockIsEditMode = true;
    renderHook(() => useDashboardShortcuts({ isReadonly: false }));

    act(() => {
      triggerSequence(['D', 'M']);
    });

    await waitFor(() => {
      expect(mockSetEditMode).toHaveBeenCalledWith(false);
    });
  });

  it('falls back to setEditMode(true) when toggling from view to edit without onEditButtonClick', async () => {
    mockIsEditMode = false;
    renderHook(() => useDashboardShortcuts({ isReadonly: false }));

    act(() => {
      triggerSequence(['D', 'M']);
    });

    await waitFor(() => {
      expect(mockSetEditMode).toHaveBeenCalledWith(true);
    });
  });
});
