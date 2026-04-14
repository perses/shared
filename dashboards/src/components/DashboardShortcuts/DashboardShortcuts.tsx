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

import { ReactElement, useCallback } from 'react';
import { AbsoluteTimeRange, isRelativeTimeRange, PanelGroupItemId, toAbsoluteTimeRange } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useHotkeys, useHotkeySequences } from '@tanstack/react-hotkeys';
import {
  useFocusedPanel,
  buildShortcutOptions,
  requireShortcutHotkey,
  requireShortcutSequence,
  SAVE_DASHBOARD_SHORTCUT,
  REFRESH_DASHBOARD_SHORTCUT,
  TOGGLE_EDIT_MODE_SHORTCUT,
  TIME_ZOOM_OUT_SHORTCUT,
  TIME_ZOOM_IN_SHORTCUT,
  TIME_SHIFT_BACK_SHORTCUT,
  TIME_SHIFT_FORWARD_SHORTCUT,
  TIME_MAKE_ABSOLUTE_SHORTCUT,
  TIME_COPY_SHORTCUT,
  TIME_PASTE_SHORTCUT,
  PANEL_EDIT_SHORTCUT,
  PANEL_FULLSCREEN_SHORTCUT,
  PANEL_DUPLICATE_SHORTCUT,
  PANEL_DELETE_SHORTCUT,
} from '../../keyboard-shortcuts';
import {
  OnSaveDashboard,
  useEditMode,
  useDashboardStore,
  DashboardStoreState,
  useViewPanelGroup,
  useSaveDashboard,
} from '../../context/DashboardProvider';

const SAVE_SHORTCUT_EDIT_MODE_MESSAGE = 'Enter edit mode to save this dashboard.';
const SAVE_SHORTCUT_READONLY_MESSAGE = 'This dashboard is read-only. Keyboard save is disabled.';
const SAVE_SHORTCUT_UNAVAILABLE_MESSAGE = 'Save action is unavailable for this dashboard.';

/**
 * Parses a panelKey string back into a PanelGroupItemId.
 */
function parsePanelKey(panelKey: string): PanelGroupItemId | null {
  const dashIndex = panelKey.indexOf('-');
  if (dashIndex === -1) return null;

  const panelGroupId = parseInt(panelKey.substring(0, dashIndex), 10);
  const panelGroupItemLayoutId = panelKey.substring(dashIndex + 1);

  if (isNaN(panelGroupId)) return null;

  return { panelGroupId, panelGroupItemLayoutId };
}

const selectPanelStoreActions = (
  state: DashboardStoreState
): {
  openEditPanel: DashboardStoreState['openEditPanel'];
  duplicatePanel: DashboardStoreState['duplicatePanel'];
  openDeletePanelDialog: DashboardStoreState['openDeletePanelDialog'];
  setViewPanel: DashboardStoreState['setViewPanel'];
  panelEditor: DashboardStoreState['panelEditor'];
} => ({
  openEditPanel: state.openEditPanel,
  duplicatePanel: state.duplicatePanel,
  openDeletePanelDialog: state.openDeletePanelDialog,
  setViewPanel: state.setViewPanel,
  panelEditor: state.panelEditor,
});

export interface DashboardShortcutsProps {
  onSave?: OnSaveDashboard;
  onRefresh?: () => void;
  isReadonly: boolean;
  onEditButtonClick?: () => void;
  onCancelButtonClick?: () => void;
}

/**
 * Non-visual component that registers dashboard, time-range, and panel keyboard shortcuts.
 * Must be rendered within a dashboard view that provides DashboardProvider context.
 */
export function DashboardShortcuts({
  onSave,
  onRefresh,
  isReadonly,
  onEditButtonClick,
  onCancelButtonClick,
}: DashboardShortcutsProps): ReactElement | null {
  const focusedPanelKey = useFocusedPanel();
  const { isEditMode, setEditMode } = useEditMode();
  const { timeRange, setTimeRange, refresh } = useTimeRange();
  const { infoSnackbar, warningSnackbar } = useSnackbar();
  const viewPanel = useViewPanelGroup();
  const { openEditPanel, duplicatePanel, openDeletePanelDialog, setViewPanel, panelEditor } =
    useDashboardStore(selectPanelStoreActions);
  const { saveDashboard } = useSaveDashboard(onSave);

  const panelFocused = focusedPanelKey !== null;

  // --- Handlers ---

  const handleSave = useCallback(() => {
    if (isReadonly) {
      warningSnackbar(SAVE_SHORTCUT_READONLY_MESSAGE);
      return;
    }

    if (!isEditMode) {
      infoSnackbar(SAVE_SHORTCUT_EDIT_MODE_MESSAGE);
      return;
    }

    if (!onSave) {
      warningSnackbar(SAVE_SHORTCUT_UNAVAILABLE_MESSAGE);
      return;
    }

    saveDashboard();
  }, [infoSnackbar, isEditMode, isReadonly, onSave, saveDashboard, warningSnackbar]);

  const handleRefresh = useCallback(() => {
    refresh();
    if (onRefresh) {
      onRefresh();
    }
  }, [refresh, onRefresh]);

  const handleToggleEditMode = useCallback(() => {
    if (isEditMode) {
      // Switching from edit to view: delegate to cancel flow (shows discard dialog if needed)
      if (onCancelButtonClick) {
        onCancelButtonClick();
      } else {
        setEditMode(false);
      }
    } else {
      // Switching from view to edit: delegate to edit flow (saves original state)
      if (onEditButtonClick) {
        onEditButtonClick();
      } else {
        setEditMode(true);
      }
    }
  }, [isEditMode, setEditMode, onCancelButtonClick, onEditButtonClick]);

  // Time range handlers

  /**
   * Resolves the current time range to absolute and computes its duration in ms.
   */
  function resolveAbsoluteRange(): { absoluteRange: AbsoluteTimeRange; durationMs: number } {
    const absoluteRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    const durationMs = absoluteRange.end.getTime() - absoluteRange.start.getTime();
    return { absoluteRange, durationMs };
  }

  const handleTimeZoomOut = useCallback(() => {
    const { absoluteRange, durationMs } = resolveAbsoluteRange();
    setTimeRange({
      start: new Date(absoluteRange.start.getTime() - durationMs / 2),
      end: new Date(absoluteRange.end.getTime() + durationMs / 2),
    });
  }, [timeRange, setTimeRange]);

  const handleTimeZoomIn = useCallback(() => {
    const { absoluteRange, durationMs } = resolveAbsoluteRange();
    setTimeRange({
      start: new Date(absoluteRange.start.getTime() + durationMs / 4),
      end: new Date(absoluteRange.end.getTime() - durationMs / 4),
    });
  }, [timeRange, setTimeRange]);

  const handleTimeShiftBack = useCallback(() => {
    const { absoluteRange, durationMs } = resolveAbsoluteRange();
    const shift = durationMs / 2;
    setTimeRange({
      start: new Date(absoluteRange.start.getTime() - shift),
      end: new Date(absoluteRange.end.getTime() - shift),
    });
  }, [timeRange, setTimeRange]);

  const handleTimeShiftForward = useCallback(() => {
    const { absoluteRange, durationMs } = resolveAbsoluteRange();
    const shift = durationMs / 2;
    setTimeRange({
      start: new Date(absoluteRange.start.getTime() + shift),
      end: new Date(absoluteRange.end.getTime() + shift),
    });
  }, [timeRange, setTimeRange]);

  const handleTimeMakeAbsolute = useCallback(() => {
    if (isRelativeTimeRange(timeRange)) {
      setTimeRange(toAbsoluteTimeRange(timeRange));
    }
  }, [timeRange, setTimeRange]);

  const handleTimeCopy = useCallback(() => {
    const absoluteRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    const text = `${absoluteRange.start.toISOString()} - ${absoluteRange.end.toISOString()}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        infoSnackbar('Time range copied to clipboard.');
      })
      .catch(() => {
        warningSnackbar('Failed to copy time range to clipboard.');
      });
  }, [timeRange, infoSnackbar, warningSnackbar]);

  const handleTimePaste = useCallback(() => {
    const FORMAT_HINT = 'Expected format: "<ISO date format> - <ISO date format>".';
    navigator.clipboard
      .readText()
      .then((text) => {
        const parts = text.split(' - ');
        if (parts.length !== 2) {
          warningSnackbar(`Clipboard does not contain a valid time range. ${FORMAT_HINT}`);
          return;
        }
        const startStr = parts[0];
        const endStr = parts[1];
        if (startStr === undefined || endStr === undefined) {
          warningSnackbar(`Clipboard does not contain a valid time range. ${FORMAT_HINT}`);
          return;
        }
        const start = new Date(startStr.trim());
        const end = new Date(endStr.trim());
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          warningSnackbar(`Clipboard does not contain a valid time range. ${FORMAT_HINT}`);
          return;
        }
        if (start >= end) {
          warningSnackbar('Invalid time range: start must be before end.');
          return;
        }
        const newRange: AbsoluteTimeRange = { start, end };
        setTimeRange(newRange);
        infoSnackbar('Time range pasted from clipboard.');
      })
      .catch(() => {
        warningSnackbar('Unable to read from clipboard. Check browser permissions.');
      });
  }, [setTimeRange, infoSnackbar, warningSnackbar]);

  // Panel handlers
  const handlePanelEdit = useCallback(() => {
    if (panelEditor !== undefined) {
      panelEditor.close();
      return;
    }

    if (focusedPanelKey && isEditMode) {
      const panelId = parsePanelKey(focusedPanelKey);
      if (panelId) {
        openEditPanel(panelId);
      }
    }
  }, [focusedPanelKey, isEditMode, openEditPanel, panelEditor]);

  const handlePanelFullscreen = useCallback(() => {
    if (viewPanel !== undefined) {
      setViewPanel(undefined);
      return;
    }

    if (focusedPanelKey) {
      const panelId = parsePanelKey(focusedPanelKey);
      if (panelId) {
        setViewPanel(panelId);
      }
    }
  }, [focusedPanelKey, setViewPanel, viewPanel]);

  const handlePanelDuplicate = useCallback(() => {
    if (focusedPanelKey && isEditMode) {
      const panelId = parsePanelKey(focusedPanelKey);
      if (panelId) {
        duplicatePanel(panelId);
      }
    }
  }, [focusedPanelKey, isEditMode, duplicatePanel]);

  const handlePanelDelete = useCallback(() => {
    if (focusedPanelKey && isEditMode) {
      const panelId = parsePanelKey(focusedPanelKey);
      if (panelId) {
        openDeletePanelDialog(panelId);
      }
    }
  }, [focusedPanelKey, isEditMode, openDeletePanelDialog]);

  // --- Register shortcuts with TanStack, calling handlers directly ---

  useHotkeys(
    [
      { def: SAVE_DASHBOARD_SHORTCUT, enabled: true, callback: handleSave },
      { def: PANEL_EDIT_SHORTCUT, enabled: panelFocused || panelEditor !== undefined, callback: handlePanelEdit },
      {
        def: PANEL_FULLSCREEN_SHORTCUT,
        enabled: panelFocused || viewPanel !== undefined,
        callback: handlePanelFullscreen,
      },
    ].map(({ def, enabled, callback }) => ({
      hotkey: requireShortcutHotkey(def),
      callback,
      options: buildShortcutOptions(def, enabled),
    }))
  );

  useHotkeySequences(
    [
      { def: REFRESH_DASHBOARD_SHORTCUT, enabled: true, callback: handleRefresh },
      { def: TOGGLE_EDIT_MODE_SHORTCUT, enabled: true, callback: handleToggleEditMode },
      { def: TIME_ZOOM_OUT_SHORTCUT, enabled: true, callback: handleTimeZoomOut },
      { def: TIME_ZOOM_IN_SHORTCUT, enabled: true, callback: handleTimeZoomIn },
      { def: TIME_SHIFT_BACK_SHORTCUT, enabled: true, callback: handleTimeShiftBack },
      { def: TIME_SHIFT_FORWARD_SHORTCUT, enabled: true, callback: handleTimeShiftForward },
      { def: TIME_MAKE_ABSOLUTE_SHORTCUT, enabled: true, callback: handleTimeMakeAbsolute },
      { def: TIME_COPY_SHORTCUT, enabled: true, callback: handleTimeCopy },
      { def: TIME_PASTE_SHORTCUT, enabled: true, callback: handleTimePaste },
      { def: PANEL_DUPLICATE_SHORTCUT, enabled: panelFocused, callback: handlePanelDuplicate },
      { def: PANEL_DELETE_SHORTCUT, enabled: panelFocused, callback: handlePanelDelete },
    ].map(({ def, enabled, callback }) => ({
      sequence: requireShortcutSequence(def),
      callback,
      options: buildShortcutOptions(def, enabled),
    }))
  );

  return null;
}
