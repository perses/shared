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
import LockOutline from 'mdi-material-ui/LockOutline';
import LockOpenOutline from 'mdi-material-ui/LockOpenOutline';
import { ReactElement, useMemo } from 'react';
import { useListPluginMetadata } from '@perses-dev/plugin-system';
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
 */
export function LockDashboardButton(): ReactElement {
  const { dashboard, setDashboard } = useDashboard();
  const { data: pluginMetadata, isLoading } = useListPluginMetadata(PLUGIN_VERSIONING_TYPES);

  const locked = useMemo(() => isDashboardLocked(dashboard), [dashboard]);

  const handleClick = (): void => {
    if (locked) {
      setDashboard(removePluginVersions(dashboard));
      return;
    }
    const versions = buildLatestPluginVersions(pluginMetadata ?? []);
    setDashboard(applyPluginVersions(dashboard, versions));
  };

  const label = locked ? 'Unlock' : 'Lock';
  const tooltip = locked
    ? 'Remove the pinned plugin versions from the dashboard'
    : 'Pin every plugin to its latest available version';

  return (
    <Tooltip title={tooltip} placement="bottom">
      <span>
        <Button
          onClick={handleClick}
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
  );
}
