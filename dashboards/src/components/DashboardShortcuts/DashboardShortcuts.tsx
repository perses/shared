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

import { ReactElement, useCallback, useEffect, useRef } from 'react';
import { AbsoluteTimeRange, isRelativeTimeRange, PanelGroupItemId, toAbsoluteTimeRange } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useHotkeys, useHotkeySequences } from '@tanstack/react-hotkeys';
import {
  useShortcutScope,
  useActiveScopes,
  useFocusedPanel,
  buildShortcutOptions,
  dispatchShortcutEvent,
  requireShortcutEvent,
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
 * Hook to subscribe to multiple window events. Uses a ref to store the latest handlers,
 * so event listeners are only added/removed on mount/unmount rather than on every handler change.
 */
function useWindowEvents(subscriptions: ReadonlyArray<{ eventName: string; handler: (event: Event) => void }>): void {
  const handlersRef = useRef(subscriptions);
  handlersRef.current = subscriptions;

  useEffect(() => {
    const listeners = subscriptions.map(({ eventName }, i) => {
      const listener = (event: Event): void => {
        handlersRef.current[i]?.handler(event);
      };
      window.addEventListener(eventName, listener);
      return { eventName, listener };
    });

    return (): void => {
      listeners.forEach(({ eventName, listener }) => {
        window.removeEventListener(eventName, listener);
      });
    };
    // Event names are module-level constants and never change, so this effect
    // runs once on mount and cleans up on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const SAVE_DASHBOARD_EVENT = requireShortcutEvent(SAVE_DASHBOARD_SHORTCUT);
const REFRESH_DASHBOARD_EVENT = requireShortcutEvent(REFRESH_DASHBOARD_SHORTCUT);
const TOGGLE_EDIT_MODE_EVENT = requireShortcutEvent(TOGGLE_EDIT_MODE_SHORTCUT);
const TIME_ZOOM_OUT_EVENT = requireShortcutEvent(TIME_ZOOM_OUT_SHORTCUT);
const TIME_ZOOM_IN_EVENT = requireShortcutEvent(TIME_ZOOM_IN_SHORTCUT);
const TIME_SHIFT_BACK_EVENT = requireShortcutEvent(TIME_SHIFT_BACK_SHORTCUT);
const TIME_SHIFT_FORWARD_EVENT = requireShortcutEvent(TIME_SHIFT_FORWARD_SHORTCUT);
const TIME_MAKE_ABSOLUTE_EVENT = requireShortcutEvent(TIME_MAKE_ABSOLUTE_SHORTCUT);
const TIME_COPY_EVENT = requireShortcutEvent(TIME_COPY_SHORTCUT);
const TIME_PASTE_EVENT = requireShortcutEvent(TIME_PASTE_SHORTCUT);
const PANEL_EDIT_EVENT = requireShortcutEvent(PANEL_EDIT_SHORTCUT);
const PANEL_FULLSCREEN_EVENT = requireShortcutEvent(PANEL_FULLSCREEN_SHORTCUT);
const PANEL_DUPLICATE_EVENT = requireShortcutEvent(PANEL_DUPLICATE_SHORTCUT);
const PANEL_DELETE_EVENT = requireShortcutEvent(PANEL_DELETE_SHORTCUT);

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
}

/**
 * Non-visual component that registers dashboard, time-range, and panel keyboard shortcuts.
 * Must be rendered within a dashboard view that provides DashboardProvider context.
 */
export function DashboardShortcuts({ onSave, onRefresh, isReadonly }: DashboardShortcutsProps): ReactElement | null {
  // Activate the dashboard scope
  useShortcutScope('dashboard');

  const activeScopes = useActiveScopes();
  const focusedPanelKey = useFocusedPanel();
  const { isEditMode, setEditMode } = useEditMode();
  const { timeRange, setTimeRange, refresh } = useTimeRange();
  const { infoSnackbar, warningSnackbar } = useSnackbar();
  const viewPanel = useViewPanelGroup();
  const { openEditPanel, duplicatePanel, openDeletePanelDialog, setViewPanel, panelEditor } =
    useDashboardStore(selectPanelStoreActions);
  const { saveDashboard } = useSaveDashboard(onSave);

  const dashboardEnabled = activeScopes.has('dashboard');
  const panelEnabled = activeScopes.has('panel');

  useHotkeys(
    [
      { def: SAVE_DASHBOARD_SHORTCUT, enabled: dashboardEnabled },
      { def: PANEL_EDIT_SHORTCUT, enabled: panelEnabled || panelEditor !== undefined },
      { def: PANEL_FULLSCREEN_SHORTCUT, enabled: panelEnabled || viewPanel !== undefined },
    ].map(({ def, enabled }) => ({
      hotkey: requireShortcutHotkey(def),
      callback: (): void => dispatchShortcutEvent(requireShortcutEvent(def)),
      options: buildShortcutOptions(def, enabled),
    }))
  );

  useHotkeySequences(
    [
      { def: REFRESH_DASHBOARD_SHORTCUT, enabled: dashboardEnabled },
      { def: TOGGLE_EDIT_MODE_SHORTCUT, enabled: dashboardEnabled },
      { def: TIME_ZOOM_OUT_SHORTCUT, enabled: dashboardEnabled },
      { def: TIME_ZOOM_IN_SHORTCUT, enabled: dashboardEnabled },
      { def: TIME_SHIFT_BACK_SHORTCUT, enabled: dashboardEnabled },
      { def: TIME_SHIFT_FORWARD_SHORTCUT, enabled: dashboardEnabled },
      { def: TIME_MAKE_ABSOLUTE_SHORTCUT, enabled: dashboardEnabled },
      { def: TIME_COPY_SHORTCUT, enabled: dashboardEnabled },
      { def: TIME_PASTE_SHORTCUT, enabled: dashboardEnabled },
      { def: PANEL_DUPLICATE_SHORTCUT, enabled: panelEnabled },
      { def: PANEL_DELETE_SHORTCUT, enabled: panelEnabled },
    ].map(({ def, enabled }) => ({
      sequence: requireShortcutSequence(def),
      callback: (): void => dispatchShortcutEvent(requireShortcutEvent(def)),
      options: buildShortcutOptions(def, enabled),
    }))
  );

  // --- Event handlers for dashboard operations ---

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
    setEditMode(!isEditMode);
  }, [isEditMode, setEditMode]);

  // Time range handlers
  const handleTimeZoomOut = useCallback(() => {
    const absoluteRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    const duration = absoluteRange.end.getTime() - absoluteRange.start.getTime();
    const newRange: AbsoluteTimeRange = {
      start: new Date(absoluteRange.start.getTime() - duration / 2),
      end: new Date(absoluteRange.end.getTime() + duration / 2),
    };
    setTimeRange(newRange);
  }, [timeRange, setTimeRange]);

  const handleTimeZoomIn = useCallback(() => {
    const absoluteRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    const duration = absoluteRange.end.getTime() - absoluteRange.start.getTime();
    const newRange: AbsoluteTimeRange = {
      start: new Date(absoluteRange.start.getTime() + duration / 4),
      end: new Date(absoluteRange.end.getTime() - duration / 4),
    };
    setTimeRange(newRange);
  }, [timeRange, setTimeRange]);

  const handleTimeShiftBack = useCallback(() => {
    const absoluteRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    const duration = absoluteRange.end.getTime() - absoluteRange.start.getTime();
    const shift = duration / 2;
    const newRange: AbsoluteTimeRange = {
      start: new Date(absoluteRange.start.getTime() - shift),
      end: new Date(absoluteRange.end.getTime() - shift),
    };
    setTimeRange(newRange);
  }, [timeRange, setTimeRange]);

  const handleTimeShiftForward = useCallback(() => {
    const absoluteRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    const duration = absoluteRange.end.getTime() - absoluteRange.start.getTime();
    const shift = duration / 2;
    const newRange: AbsoluteTimeRange = {
      start: new Date(absoluteRange.start.getTime() + shift),
      end: new Date(absoluteRange.end.getTime() + shift),
    };
    setTimeRange(newRange);
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

  useWindowEvents([
    { eventName: SAVE_DASHBOARD_EVENT, handler: handleSave },
    { eventName: REFRESH_DASHBOARD_EVENT, handler: handleRefresh },
    { eventName: TOGGLE_EDIT_MODE_EVENT, handler: handleToggleEditMode },
    { eventName: TIME_ZOOM_OUT_EVENT, handler: handleTimeZoomOut },
    { eventName: TIME_ZOOM_IN_EVENT, handler: handleTimeZoomIn },
    { eventName: TIME_SHIFT_BACK_EVENT, handler: handleTimeShiftBack },
    { eventName: TIME_SHIFT_FORWARD_EVENT, handler: handleTimeShiftForward },
    { eventName: TIME_MAKE_ABSOLUTE_EVENT, handler: handleTimeMakeAbsolute },
    { eventName: TIME_COPY_EVENT, handler: handleTimeCopy },
    { eventName: TIME_PASTE_EVENT, handler: handleTimePaste },
    { eventName: PANEL_EDIT_EVENT, handler: handlePanelEdit },
    { eventName: PANEL_FULLSCREEN_EVENT, handler: handlePanelFullscreen },
    { eventName: PANEL_DUPLICATE_EVENT, handler: handlePanelDuplicate },
    { eventName: PANEL_DELETE_EVENT, handler: handlePanelDelete },
  ]);

  return null;
}
