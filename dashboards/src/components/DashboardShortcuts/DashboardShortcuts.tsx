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
import { useHotkey, useHotkeySequence } from '@tanstack/react-hotkeys';
import { HotkeyMeta, HotkeySequence } from '@tanstack/hotkeys';
import {
  useShortcutScope,
  useActiveScopes,
  useFocusedPanel,
  useShortcutPreferences,
  PersesShortcutDef,
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
import { useEditMode, useDashboardStore, DashboardStoreState, useViewPanelGroup } from '../../context/DashboardProvider';

function buildMeta(def: PersesShortcutDef): HotkeyMeta {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    scope: def.scope,
  };
}

function dispatchShortcutEvent(eventName: string): void {
  window.dispatchEvent(new CustomEvent(eventName));
}

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
  const { overrides } = useShortcutPreferences();
  const { isEditMode, setEditMode } = useEditMode();
  const { timeRange, setTimeRange, refresh } = useTimeRange();
  const viewPanel = useViewPanelGroup();
  const { openEditPanel, duplicatePanel, openDeletePanelDialog, setViewPanel, panelEditor } = useDashboardStore(
    selectPanelStoreActions
  );

  const dashboardEnabled = activeScopes.has('dashboard');
  const panelEnabled = activeScopes.has('panel');

  function isDisabled(id: string): boolean {
    return overrides.overrides[id] === null;
  }

  // --- Dashboard shortcuts ---

  useHotkey(SAVE_DASHBOARD_SHORTCUT.hotkey!, () => dispatchShortcutEvent(SAVE_DASHBOARD_EVENT), {
    enabled: dashboardEnabled && !isDisabled(SAVE_DASHBOARD_SHORTCUT.id),
    meta: buildMeta(SAVE_DASHBOARD_SHORTCUT),
  });

  useHotkeySequence(
    (REFRESH_DASHBOARD_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(REFRESH_DASHBOARD_EVENT),
    {
      enabled: dashboardEnabled && !isDisabled(REFRESH_DASHBOARD_SHORTCUT.id),
      meta: buildMeta(REFRESH_DASHBOARD_SHORTCUT),
    }
  );

  useHotkeySequence(
    (TOGGLE_EDIT_MODE_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(TOGGLE_EDIT_MODE_EVENT),
    {
      enabled: dashboardEnabled && !isDisabled(TOGGLE_EDIT_MODE_SHORTCUT.id),
      meta: buildMeta(TOGGLE_EDIT_MODE_SHORTCUT),
    }
  );

  // --- Time range shortcuts ---

  useHotkeySequence(
    (TIME_ZOOM_OUT_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(TIME_ZOOM_OUT_EVENT),
    { enabled: dashboardEnabled && !isDisabled(TIME_ZOOM_OUT_SHORTCUT.id), meta: buildMeta(TIME_ZOOM_OUT_SHORTCUT) }
  );

  useHotkeySequence(
    (TIME_SHIFT_BACK_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(TIME_SHIFT_BACK_EVENT),
    { enabled: dashboardEnabled && !isDisabled(TIME_SHIFT_BACK_SHORTCUT.id), meta: buildMeta(TIME_SHIFT_BACK_SHORTCUT) }
  );

  useHotkeySequence(
    (TIME_SHIFT_FORWARD_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(TIME_SHIFT_FORWARD_EVENT),
    {
      enabled: dashboardEnabled && !isDisabled(TIME_SHIFT_FORWARD_SHORTCUT.id),
      meta: buildMeta(TIME_SHIFT_FORWARD_SHORTCUT),
    }
  );

  useHotkeySequence(
    (TIME_MAKE_ABSOLUTE_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(TIME_MAKE_ABSOLUTE_EVENT),
    {
      enabled: dashboardEnabled && !isDisabled(TIME_MAKE_ABSOLUTE_SHORTCUT.id),
      meta: buildMeta(TIME_MAKE_ABSOLUTE_SHORTCUT),
    }
  );

  useHotkeySequence(
    (TIME_COPY_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(TIME_COPY_EVENT),
    { enabled: dashboardEnabled && !isDisabled(TIME_COPY_SHORTCUT.id), meta: buildMeta(TIME_COPY_SHORTCUT) }
  );

  // --- Panel shortcuts ---

  useHotkey(PANEL_EDIT_SHORTCUT.hotkey!, () => dispatchShortcutEvent(PANEL_EDIT_EVENT), {
    enabled: (panelEnabled || panelEditor !== undefined) && !isDisabled(PANEL_EDIT_SHORTCUT.id),
    meta: buildMeta(PANEL_EDIT_SHORTCUT),
  });

  useHotkey(PANEL_FULLSCREEN_SHORTCUT.hotkey!, () => dispatchShortcutEvent(PANEL_FULLSCREEN_EVENT), {
    enabled: (panelEnabled || viewPanel !== undefined) && !isDisabled(PANEL_FULLSCREEN_SHORTCUT.id),
    meta: buildMeta(PANEL_FULLSCREEN_SHORTCUT),
  });

  useHotkeySequence(
    (PANEL_DUPLICATE_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(PANEL_DUPLICATE_EVENT),
    { enabled: panelEnabled && !isDisabled(PANEL_DUPLICATE_SHORTCUT.id), meta: buildMeta(PANEL_DUPLICATE_SHORTCUT) }
  );

  useHotkeySequence(
    (PANEL_DELETE_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(PANEL_DELETE_EVENT),
    { enabled: panelEnabled && !isDisabled(PANEL_DELETE_SHORTCUT.id), meta: buildMeta(PANEL_DELETE_SHORTCUT) }
  );

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

  // Direct keydown listener for Escape to close panel editor (panel scope may be inactive)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && panelEditor !== undefined) {
        // Close the panel editor
        // This is handled by the panel editor component itself
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [panelEditor]);

  return null;
}
