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

import { useSnackbar } from '@perses-dev/components';
import {
  useTimeRange,
  useTimeZoneParams,
  useDisableAutoRefreshSetting,
  usePluginRegistry,
} from '@perses-dev/plugin-system';
import { isRelativeTimeRange } from '@perses-dev/spec';
import { useCallback, useState } from 'react';

import { buildAvailablePluginVersions, findInvalidPinnedVersions, PLUGIN_VERSIONING_TYPES } from '../../utils';
import { useDashboard } from '../useDashboard';
import { useVariableDefinitionActions } from '../VariableProvider';
import { OnSaveDashboard } from './common';
import { useEditMode, useSaveChangesConfirmationDialog } from './dashboard-provider-api';
import { SaveChangesConfirmationDialogOptions } from './save-changes-dialog-slice';

export interface SaveDashboardResult {
  /**
   * Triggers the save flow. If time range, refresh interval, or variable defaults have been
   * modified, opens the SaveChangesConfirmationDialog before saving. Otherwise saves directly.
   * Includes a concurrent-save guard to prevent duplicate saves.
   */
  saveDashboard: () => void;

  /**
   * Whether a save operation is currently in progress.
   */
  isSaving: boolean;
}

/**
 * Hook that encapsulates the full save-dashboard flow, including:
 * - Checking for modified defaults (time range, refresh interval, variables)
 * - Opening the SaveChangesConfirmationDialog when defaults have changed
 * - Saving directly when no confirmation is needed
 * - Preventing concurrent saves via an `isSaving` guard
 * - Exiting edit mode after a successful save
 *
 * Used by both SaveDashboardButton and DashboardShortcuts to ensure consistent save behavior.
 */
export function useSaveDashboard(onSave?: OnSaveDashboard): SaveDashboardResult {
  const [isSaving, setSaving] = useState(false);
  const { dashboard, setDashboard } = useDashboard();
  const { setEditMode } = useEditMode();
  const { timeRange, refreshInterval } = useTimeRange();
  const disableAutoRefresh = useDisableAutoRefreshSetting();
  const { timeZone } = useTimeZoneParams();
  const { getSavedVariablesStatus, setVariableDefaultValues } = useVariableDefinitionActions();
  const { openSaveChangesConfirmationDialog, closeSaveChangesConfirmationDialog } = useSaveChangesConfirmationDialog();
  const { listPluginMetadata } = usePluginRegistry();
  const { exceptionSnackbar } = useSnackbar();
  const performSave = useCallback(async (): Promise<void> => {
    if (!onSave) {
      setEditMode(false);
      return;
    }

    try {
      setSaving(true);
      // Validate that any pinned plugin version (plugin.metadata.version) actually exists in the registry before
      // saving, so we never persist a dashboard referencing a plugin version that cannot be loaded.
      const pluginMetadata = await listPluginMetadata(PLUGIN_VERSIONING_TYPES);
      const invalidPins = findInvalidPinnedVersions(dashboard, buildAvailablePluginVersions(pluginMetadata));
      if (invalidPins.length > 0) {
        const details = invalidPins.map((pin) => `${pin.kind}@${pin.version}`).join(', ');
        exceptionSnackbar(new Error(`Cannot save dashboard: pinned plugin version(s) not available: ${details}`));
        return;
      }
      await onSave(dashboard);
      closeSaveChangesConfirmationDialog();
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }, [closeSaveChangesConfirmationDialog, dashboard, onSave, setEditMode, listPluginMetadata, exceptionSnackbar]);

  const saveDashboard = useCallback((): void => {
    if (isSaving) {
      return;
    }

    const { isSavedVariableModified } = getSavedVariablesStatus();
    const isSavedDurationModified =
      isRelativeTimeRange(timeRange) && dashboard.spec.duration !== timeRange.pastDuration;
    const isSavedRefreshIntervalModified = !disableAutoRefresh && dashboard.spec.refreshInterval !== refreshInterval;
    const isTimeZoneModified =
      timeZone === 'local' && !dashboard.spec.timezone ? false : dashboard.spec.timezone !== timeZone;

    if (isSavedDurationModified || isSavedVariableModified || isSavedRefreshIntervalModified || isTimeZoneModified) {
      openSaveChangesConfirmationDialog({
        onSaveChanges: (options: SaveChangesConfirmationDialogOptions) => {
          const { saveDefaultRefreshInterval, saveDefaultTimeRange, saveDefaultTimeZone, saveDefaultVariables } =
            options;
          if (isRelativeTimeRange(timeRange) && saveDefaultTimeRange) {
            dashboard.spec.duration = timeRange.pastDuration;
          }
          if (saveDefaultTimeZone) {
            dashboard.spec.timezone = timeZone;
          }
          if (saveDefaultVariables) {
            const variables = setVariableDefaultValues();
            dashboard.spec.variables = variables;
          }
          if (saveDefaultRefreshInterval && isSavedRefreshIntervalModified) {
            dashboard.spec.refreshInterval = refreshInterval;
          }
          setDashboard(dashboard);
          performSave();
        },
        onCancel: () => {
          closeSaveChangesConfirmationDialog();
        },
        isSavedDurationModified,
        isSavedVariableModified,
        isSavedRefreshIntervalModified,
        isTimeZoneModified,
      });
    } else {
      performSave();
    }
  }, [
    isSaving,
    timeRange,
    dashboard,
    refreshInterval,
    disableAutoRefresh,
    timeZone,
    getSavedVariablesStatus,
    openSaveChangesConfirmationDialog,
    setVariableDefaultValues,
    setDashboard,
    performSave,
    closeSaveChangesConfirmationDialog,
  ]);

  return { saveDashboard, isSaving };
}
