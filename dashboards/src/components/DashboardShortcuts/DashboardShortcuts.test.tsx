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

import { act, render, waitFor } from '@testing-library/react';
import { DashboardResource } from '@perses-dev/core';
import { DashboardShortcuts } from './DashboardShortcuts';

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

jest.mock('@tanstack/react-hotkeys', () => ({
  useHotkeys: jest.fn(),
  useHotkeySequences: jest.fn(),
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
  useShortcutScope: jest.fn(),
  useActiveScopes: (): Set<string> => new Set(['global', 'dashboard']),
  useFocusedPanel: (): null => null,
  buildShortcutOptions: jest.fn(() => ({ enabled: true, meta: {} })),
  dispatchShortcutEvent: jest.fn(),
  requireShortcutEvent: (def: { event?: string }): string => def.event ?? 'missing-event',
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

  SAVE_DASHBOARD_EVENT: 'perses:save-dashboard',
  REFRESH_DASHBOARD_EVENT: 'perses:refresh-dashboard',
  TOGGLE_EDIT_MODE_EVENT: 'perses:toggle-edit-mode',
  TIME_ZOOM_OUT_EVENT: 'perses:time-zoom-out',
  TIME_ZOOM_IN_EVENT: 'perses:time-zoom-in',
  TIME_SHIFT_BACK_EVENT: 'perses:time-shift-back',
  TIME_SHIFT_FORWARD_EVENT: 'perses:time-shift-forward',
  TIME_MAKE_ABSOLUTE_EVENT: 'perses:time-make-absolute',
  TIME_COPY_EVENT: 'perses:time-copy',
  TIME_PASTE_EVENT: 'perses:time-paste',
  PANEL_EDIT_EVENT: 'perses:panel-edit',
  PANEL_FULLSCREEN_EVENT: 'perses:panel-fullscreen',
  PANEL_DUPLICATE_EVENT: 'perses:panel-duplicate',
  PANEL_DELETE_EVENT: 'perses:panel-delete',
}));

const SAVE_DASHBOARD_EVENT = 'perses:save-dashboard';
const TIME_PASTE_EVENT = 'perses:time-paste';

describe('DashboardShortcuts save behavior', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    jest.clearAllMocks();
  });

  it('shows an info snackbar when save shortcut is used outside edit mode', async () => {
    const onSave = jest.fn(async () => undefined);
    render(<DashboardShortcuts onSave={onSave} isReadonly={false} />);

    act(() => {
      window.dispatchEvent(new CustomEvent(SAVE_DASHBOARD_EVENT));
    });

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
      expect(mockInfoSnackbar).toHaveBeenCalledWith('Enter edit mode to save this dashboard.');
    });
  });

  it('shows a warning snackbar when dashboard is read-only', async () => {
    const onSave = jest.fn(async () => undefined);
    mockIsEditMode = true;
    render(<DashboardShortcuts onSave={onSave} isReadonly={true} />);

    act(() => {
      window.dispatchEvent(new CustomEvent(SAVE_DASHBOARD_EVENT));
    });

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
      expect(mockWarningSnackbar).toHaveBeenCalledWith('This dashboard is read-only. Keyboard save is disabled.');
    });
  });

  it('calls save callback and exits edit mode when save shortcut is used in edit mode', async () => {
    const onSave = jest.fn(async () => undefined);
    mockIsEditMode = true;
    render(<DashboardShortcuts onSave={onSave} isReadonly={false} />);

    act(() => {
      window.dispatchEvent(new CustomEvent(SAVE_DASHBOARD_EVENT));
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockDashboard);
      expect(mockSetEditMode).toHaveBeenCalledWith(false);
    });
  });
});

describe('DashboardShortcuts paste time range behavior', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    jest.clearAllMocks();
  });

  it('sets time range when clipboard contains a valid time range', async () => {
    const start = '2026-04-13T10:00:00.000Z';
    const end = '2026-04-13T11:00:00.000Z';
    Object.assign(navigator, {
      clipboard: { readText: jest.fn().mockResolvedValue(`${start} - ${end}`) },
    });

    render(<DashboardShortcuts isReadonly={false} />);

    act(() => {
      window.dispatchEvent(new CustomEvent(TIME_PASTE_EVENT));
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

    render(<DashboardShortcuts isReadonly={false} />);

    act(() => {
      window.dispatchEvent(new CustomEvent(TIME_PASTE_EVENT));
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

    render(<DashboardShortcuts isReadonly={false} />);

    act(() => {
      window.dispatchEvent(new CustomEvent(TIME_PASTE_EVENT));
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

    render(<DashboardShortcuts isReadonly={false} />);

    act(() => {
      window.dispatchEvent(new CustomEvent(TIME_PASTE_EVENT));
    });

    await waitFor(() => {
      expect(mockSetTimeRange).not.toHaveBeenCalled();
      expect(mockWarningSnackbar).toHaveBeenCalledWith('Unable to read from clipboard. Check browser permissions.');
    });
  });
});
