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

import { Badge, Button, Tooltip } from '@mui/material';
import { useListPluginMetadata } from '@perses-dev/plugin-system';
import UpdateIcon from 'mdi-material-ui/Update';
import { ReactElement, useMemo, useState } from 'react';

import { useDashboard } from '../../context';
import {
  buildLatestPluginVersions,
  findOutdatedPlugins,
  isDashboardLocked,
  OutdatedPlugin,
  PLUGIN_VERSIONING_TYPES,
  updatePluginVersions,
} from '../../utils';
import { UpdatePluginsDrawer } from '../UpdatePluginsDrawer';

/**
 * Toolbar button shown next to the lock button when the dashboard is locked and at least one of its pinned plugins has
 * a newer version installed. Opens a drawer to review and select which plugins to update.
 */
export function UpdatePluginsButton(): ReactElement | null {
  const { dashboard, setDashboard } = useDashboard();
  const { data: pluginMetadata } = useListPluginMetadata(PLUGIN_VERSIONING_TYPES);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const outdatedPlugins = useMemo(() => {
    if (!isDashboardLocked(dashboard)) {
      return [];
    }
    return findOutdatedPlugins(dashboard, buildLatestPluginVersions(pluginMetadata ?? []));
  }, [dashboard, pluginMetadata]);

  const handleUpdate = (plugins: OutdatedPlugin[]): void => {
    setDashboard(updatePluginVersions(dashboard, plugins));
    setDrawerOpen(false);
  };

  // Nothing to update: don't render the button at all.
  if (outdatedPlugins.length === 0) {
    return null;
  }

  return (
    <>
      <Tooltip title="Update plugins to their latest version" placement="bottom">
        <Badge badgeContent={outdatedPlugins.length} color="primary">
          <Button
            onClick={() => setDrawerOpen(true)}
            startIcon={<UpdateIcon />}
            variant="outlined"
            color="secondary"
            sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
          >
            Update
          </Button>
        </Badge>
      </Tooltip>
      <UpdatePluginsDrawer
        isOpen={isDrawerOpen}
        outdatedPlugins={outdatedPlugins}
        onUpdate={handleUpdate}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
