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

import { useCallback, useState } from 'react';
import { isRelativeTimeRange } from '@perses-dev/spec';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useVariableDefinitionActions } from '../VariableProvider/VariableProvider';
import { useDashboard } from '../useDashboard';
import { OnSaveDashboard } from './common';
import { useEditMode, useSaveChangesConfirmationDialog } from './dashboard-provider-api';

export interface UseSaveDashboardResult {
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
export function useSaveDashboard(onSave?: OnSaveDashboard): UseSaveDashboardResult {
  const [isSaving, setSaving] = useState(false);
  const { dashboard, setDashboard } = useDashboard();
  const { setEditMode } = useEditMode();
  const { timeRange, refreshInterval } = useTimeRange();
  const { getSavedVariablesStatus, setVariableDefaultValues } = useVariableDefinitionActions();
  const { openSaveChangesConfirmationDialog, closeSaveChangesConfirmationDialog } = useSaveChangesConfirmationDialog();

  const performSave = useCallback(async (): Promise<void> => {
    if (!onSave) {
      setEditMode(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(dashboard);
      closeSaveChangesConfirmationDialog();
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }, [closeSaveChangesConfirmationDialog, dashboard, onSave, setEditMode]);

  const saveDashboard = useCallback((): void => {
    if (isSaving) {
      return;
    }

    const { isSavedVariableModified } = getSavedVariablesStatus();
    const isSavedDurationModified =
      isRelativeTimeRange(timeRange) && dashboard.spec.duration !== timeRange.pastDuration;
    const isSavedRefreshIntervalModified = dashboard.spec.refreshInterval !== refreshInterval;

    if (isSavedDurationModified || isSavedVariableModified || isSavedRefreshIntervalModified) {
      openSaveChangesConfirmationDialog({
        onSaveChanges: (
          saveDefaultTimeRange: boolean,
          saveDefaultRefreshInterval: boolean,
          saveDefaultVariables: boolean
        ) => {
          if (isRelativeTimeRange(timeRange) && saveDefaultTimeRange) {
            dashboard.spec.duration = timeRange.pastDuration;
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
      });
    } else {
      performSave();
    }
  }, [
    isSaving,
    getSavedVariablesStatus,
    timeRange,
    dashboard,
    refreshInterval,
    openSaveChangesConfirmationDialog,
    setVariableDefaultValues,
    setDashboard,
    performSave,
    closeSaveChangesConfirmationDialog,
  ]);

  return { saveDashboard, isSaving };
}
