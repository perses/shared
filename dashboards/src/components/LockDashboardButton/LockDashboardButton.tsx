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

import { useDashboard } from '../../context';
import {
  applyPluginVersions,
  buildLatestPluginVersions,
  isDashboardLocked,
  PLUGIN_VERSIONING_TYPES,
  removePluginVersions,
} from '../../utils';

/**
 * Toolbar button that "locks" or "unlocks" the dashboard.
 *
 * Locking pins every plugin definition (panels, queries, variables, datasources, annotations) to the latest version
 * currently available in the Perses instance, by setting `plugin.metadata.version`. Unlocking removes that pinned
 * version so the plugins float on the latest available version again.
 *
 * Both actions are confirmed through a dialog explaining their consequences before the dashboard is updated.
 */
export function LockDashboardButton(): ReactElement {
  const { dashboard, setDashboard } = useDashboard();
  const { data: pluginMetadata, isLoading } = useListPluginMetadata(PLUGIN_VERSIONING_TYPES);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);

  const locked = useMemo(() => isDashboardLocked(dashboard), [dashboard]);

  const openConfirmation = useCallback((): void => setConfirmationOpen(true), []);
  const closeConfirmation = useCallback((): void => setConfirmationOpen(false), []);

  const handleConfirm = useCallback((): void => {
    if (locked) {
      setDashboard(removePluginVersions(dashboard));
    } else {
      const versions = buildLatestPluginVersions(pluginMetadata ?? []);
      setDashboard(applyPluginVersions(dashboard, versions));
    }
    setConfirmationOpen(false);
  }, [dashboard, locked, pluginMetadata, setDashboard]);

  const label = locked ? 'Unlock' : 'Lock';
  const tooltip = locked ? 'Remove the pinned plugin versions' : 'Pin every plugin to its latest version';

  return (
    <>
      <Tooltip title={tooltip} placement="bottom">
        <span>
          <Button
            onClick={openConfirmation}
            // When unlocked we need the plugin metadata to resolve the latest versions to pin.
            disabled={!locked && isLoading}
            startIcon={locked ? <LockOpenOutline /> : <LockOutline />}
            variant="outlined"
            color="secondary"
            sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
      <Dialog open={isConfirmationOpen} onClose={closeConfirmation} aria-labelledby="lock-dashboard-dialog">
        <Dialog.Header id="lock-dashboard-dialog" onClose={closeConfirmation}>
          {locked ? 'Unlock Dashboard' : 'Lock Dashboard'}
        </Dialog.Header>
        <Dialog.Content>
          {locked
            ? 'Unlocking removes the plugin versions pinned on this dashboard. Its panels, queries, variables, datasources and annotations will use the latest plugin versions available in this Perses instance, so their behavior may change when those plugins are updated.'
            : 'Locking pins every plugin used by this dashboard (panels, queries, variables, datasources and annotations) to the latest version currently available in this Perses instance. The dashboard keeps using those exact versions, even after the plugins are updated.'}
          {' The change only applies once you save the dashboard.'}
        </Dialog.Content>
        <Dialog.Actions>
          <Dialog.PrimaryButton onClick={handleConfirm}>{label}</Dialog.PrimaryButton>
          <Dialog.SecondaryButton onClick={closeConfirmation}>Cancel</Dialog.SecondaryButton>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}
