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

import { ReactElement, useCallback, useEffect } from 'react';
import { AbsoluteTimeRange, isRelativeTimeRange, PanelGroupItemId, toAbsoluteTimeRange } from '@perses-dev/core';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useHotkeys, useHotkeySequences } from '@tanstack/react-hotkeys';
import {
  useShortcutScope,
  useActiveScopes,
  useFocusedPanel,
  buildMeta,
  dispatchShortcutEvent,
  SAVE_DASHBOARD_SHORTCUT,
  REFRESH_DASHBOARD_SHORTCUT,
  TOGGLE_EDIT_MODE_SHORTCUT,
  TIME_ZOOM_OUT_SHORTCUT,
  TIME_SHIFT_BACK_SHORTCUT,
  TIME_SHIFT_FORWARD_SHORTCUT,
  TIME_MAKE_ABSOLUTE_SHORTCUT,
  TIME_COPY_SHORTCUT,
  PANEL_EDIT_SHORTCUT,
  PANEL_FULLSCREEN_SHORTCUT,
  PANEL_DUPLICATE_SHORTCUT,
  PANEL_DELETE_SHORTCUT,
  SAVE_DASHBOARD_EVENT,
  REFRESH_DASHBOARD_EVENT,
  TOGGLE_EDIT_MODE_EVENT,
  TIME_ZOOM_OUT_EVENT,
  TIME_SHIFT_BACK_EVENT,
  TIME_SHIFT_FORWARD_EVENT,
  TIME_MAKE_ABSOLUTE_EVENT,
  TIME_COPY_EVENT,
  PANEL_EDIT_EVENT,
  PANEL_FULLSCREEN_EVENT,
  PANEL_DUPLICATE_EVENT,
  PANEL_DELETE_EVENT,
} from '../../keyboard-shortcuts';
import {
  useEditMode,
  useDashboardStore,
  DashboardStoreState,
  useViewPanelGroup,
} from '../../context/DashboardProvider';

/**
 * Hook to subscribe to a window event. Automatically cleans up on unmount.
 */
function useWindowEvent(eventName: string, handler: (event: Event) => void): void {
  useEffect(() => {
    window.addEventListener(eventName, handler);
    return (): void => {
      window.removeEventListener(eventName, handler);
    };
  }, [eventName, handler]);
}

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
  onSave?: () => void;
  onRefresh?: () => void;
}

/**
 * Non-visual component that registers dashboard, time-range, and panel keyboard shortcuts.
 * Must be rendered within a dashboard view that provides DashboardProvider context.
 */
export function DashboardShortcuts({ onSave, onRefresh }: DashboardShortcutsProps): ReactElement | null {
  // Activate the dashboard scope
  useShortcutScope('dashboard');

  const activeScopes = useActiveScopes();
  const focusedPanelKey = useFocusedPanel();
  const { isEditMode, setEditMode } = useEditMode();
  const { timeRange, setTimeRange, refresh } = useTimeRange();
  const viewPanel = useViewPanelGroup();
  const { openEditPanel, duplicatePanel, openDeletePanelDialog, setViewPanel, panelEditor } =
    useDashboardStore(selectPanelStoreActions);

  const dashboardEnabled = activeScopes.has('dashboard');
  const panelEnabled = activeScopes.has('panel');

  // --- Register single-key shortcuts (dashboard + panel) ---

  useHotkeys([
    {
      hotkey: SAVE_DASHBOARD_SHORTCUT.hotkey!,
      callback: (): void => dispatchShortcutEvent(SAVE_DASHBOARD_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(SAVE_DASHBOARD_SHORTCUT) },
    },
    {
      hotkey: PANEL_EDIT_SHORTCUT.hotkey!,
      callback: (): void => dispatchShortcutEvent(PANEL_EDIT_EVENT),
      options: { enabled: panelEnabled || panelEditor !== undefined, meta: buildMeta(PANEL_EDIT_SHORTCUT) },
    },
    {
      hotkey: PANEL_FULLSCREEN_SHORTCUT.hotkey!,
      callback: (): void => dispatchShortcutEvent(PANEL_FULLSCREEN_EVENT),
      options: { enabled: panelEnabled || viewPanel !== undefined, meta: buildMeta(PANEL_FULLSCREEN_SHORTCUT) },
    },
  ]);

  // --- Register sequence shortcuts (dashboard + time-range + panel) ---

  useHotkeySequences([
    {
      sequence: REFRESH_DASHBOARD_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(REFRESH_DASHBOARD_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(REFRESH_DASHBOARD_SHORTCUT) },
    },
    {
      sequence: TOGGLE_EDIT_MODE_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(TOGGLE_EDIT_MODE_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(TOGGLE_EDIT_MODE_SHORTCUT) },
    },
    {
      sequence: TIME_ZOOM_OUT_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(TIME_ZOOM_OUT_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(TIME_ZOOM_OUT_SHORTCUT) },
    },
    {
      sequence: TIME_SHIFT_BACK_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(TIME_SHIFT_BACK_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(TIME_SHIFT_BACK_SHORTCUT) },
    },
    {
      sequence: TIME_SHIFT_FORWARD_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(TIME_SHIFT_FORWARD_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(TIME_SHIFT_FORWARD_SHORTCUT) },
    },
    {
      sequence: TIME_MAKE_ABSOLUTE_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(TIME_MAKE_ABSOLUTE_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(TIME_MAKE_ABSOLUTE_SHORTCUT) },
    },
    {
      sequence: TIME_COPY_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(TIME_COPY_EVENT),
      options: { enabled: dashboardEnabled, meta: buildMeta(TIME_COPY_SHORTCUT) },
    },
    {
      sequence: PANEL_DUPLICATE_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(PANEL_DUPLICATE_EVENT),
      options: { enabled: panelEnabled, meta: buildMeta(PANEL_DUPLICATE_SHORTCUT) },
    },
    {
      sequence: PANEL_DELETE_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(PANEL_DELETE_EVENT),
      options: { enabled: panelEnabled, meta: buildMeta(PANEL_DELETE_SHORTCUT) },
    },
  ]);

  // --- Event handlers for dashboard operations ---

  const handleSave = useCallback(() => {
    if (isEditMode && onSave) {
      onSave();
    }
  }, [isEditMode, onSave]);

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
    navigator.clipboard.writeText(text).catch(() => {
      // Ignore clipboard errors
    });
  }, [timeRange]);

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

  // Subscribe to custom events
  useWindowEvent(SAVE_DASHBOARD_EVENT, handleSave);
  useWindowEvent(REFRESH_DASHBOARD_EVENT, handleRefresh);
  useWindowEvent(TOGGLE_EDIT_MODE_EVENT, handleToggleEditMode);
  useWindowEvent(TIME_ZOOM_OUT_EVENT, handleTimeZoomOut);
  useWindowEvent(TIME_SHIFT_BACK_EVENT, handleTimeShiftBack);
  useWindowEvent(TIME_SHIFT_FORWARD_EVENT, handleTimeShiftForward);
  useWindowEvent(TIME_MAKE_ABSOLUTE_EVENT, handleTimeMakeAbsolute);
  useWindowEvent(TIME_COPY_EVENT, handleTimeCopy);
  useWindowEvent(PANEL_EDIT_EVENT, handlePanelEdit);
  useWindowEvent(PANEL_FULLSCREEN_EVENT, handlePanelFullscreen);
  useWindowEvent(PANEL_DUPLICATE_EVENT, handlePanelDuplicate);
  useWindowEvent(PANEL_DELETE_EVENT, handlePanelDelete);

  return null;
}
