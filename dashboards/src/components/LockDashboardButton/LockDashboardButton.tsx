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

import { Button, Tooltip } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { useListPluginMetadata } from '@perses-dev/plugin-system';
import LockOpenOutline from 'mdi-material-ui/LockOpenOutline';
import LockOutline from 'mdi-material-ui/LockOutline';
import { ReactElement, useCallback, useMemo, useState } from 'react';

import { useDashboard } from '../../context/useDashboard';
import {
  applyPluginVersions,
  buildLatestPluginVersions,
  hasPinnedPluginVersions,
  isDashboardLocked,
  removePluginVersions,
} from '../../utils/pluginVersioning';

/**
 * Toolbar button that "locks" or "unlocks" the dashboard.
 *
 * Locking pins every plugin definition (panels, queries, variables, datasources, annotations) to the latest version
 * currently available in the Perses instance, by setting `plugin.metadata.version`. Unlocking removes that pinned
 * version so the plugins float on the latest available version again.
 *
 * A dashboard can also be versioned partially (a single panel pinned from the panel editor, for instance). In that case
 * both actions are offered: locking completes the pinning, unlocking clears it.
 *
 * Both actions are confirmed through a dialog explaining their consequences before the dashboard is updated.
 */
export function LockDashboardButton(): ReactElement {
  const { dashboard, setDashboard } = useDashboard();
  const { data: pluginMetadata, isLoading } = useListPluginMetadata();
  const [pendingAction, setPendingAction] = useState<'lock' | 'unlock' | undefined>(undefined);

  const isLocked = useMemo(() => isDashboardLocked(dashboard), [dashboard]);
  const hasPins = useMemo(() => hasPinnedPluginVersions(dashboard), [dashboard]);

  const closeConfirmation = useCallback((): void => setPendingAction(undefined), []);

  const handleConfirm = useCallback((): void => {
    if (pendingAction === 'unlock') {
      setDashboard(removePluginVersions(dashboard));
    } else if (pendingAction === 'lock') {
      setDashboard(applyPluginVersions(dashboard, buildLatestPluginVersions(pluginMetadata ?? [])));
    }
    setPendingAction(undefined);
  }, [dashboard, pendingAction, pluginMetadata, setDashboard]);

  const isUnlockAction = pendingAction === 'unlock';
  const confirmLabel = isUnlockAction ? 'Unlock' : 'Lock';

  return (
    <>
      {!isLocked && (
        <Tooltip title="Pin every plugin to its latest version" placement="bottom">
          <span>
            <Button
              onClick={() => setPendingAction('lock')}
              disabled={isLoading}
              startIcon={<LockOutline />}
              variant="outlined"
              color="secondary"
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
            >
              Lock
            </Button>
          </span>
        </Tooltip>
      )}
      {hasPins && (
        <Tooltip title="Remove the pinned plugin versions" placement="bottom">
          <span>
            <Button
              onClick={() => setPendingAction('unlock')}
              startIcon={<LockOpenOutline />}
              variant="outlined"
              color="secondary"
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
            >
              Unlock
            </Button>
          </span>
        </Tooltip>
      )}
      <Dialog open={pendingAction !== undefined} onClose={closeConfirmation} aria-labelledby="lock-dashboard-dialog">
        <Dialog.Header id="lock-dashboard-dialog" onClose={closeConfirmation}>
          {isUnlockAction ? 'Unlock Dashboard' : 'Lock Dashboard'}
        </Dialog.Header>
        <Dialog.Content>
          {isUnlockAction
            ? 'Unlocking removes the plugin versions pinned on this dashboard. Its panels, queries, variables, datasources and annotations will use the latest plugin versions available in this Perses instance, so their behavior may change when those plugins are updated.'
            : 'Locking pins every plugin used by this dashboard (panels, queries, variables, datasources and annotations) to the latest version currently available in this Perses instance. The dashboard keeps using those exact versions, even after the plugins are updated. Plugins that are not installed in this instance cannot be pinned.'}
          {' The change only applies once you save the dashboard.'}
        </Dialog.Content>
        <Dialog.Actions>
          <Dialog.PrimaryButton onClick={handleConfirm}>{confirmLabel}</Dialog.PrimaryButton>
          <Dialog.SecondaryButton onClick={closeConfirmation}>Cancel</Dialog.SecondaryButton>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}
