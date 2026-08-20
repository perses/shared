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

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import ArrowRight from 'mdi-material-ui/ArrowRight';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import ChevronUp from 'mdi-material-ui/ChevronUp';
import { ReactElement, useMemo, useState } from 'react';

import { useDashboard } from '../../context/useDashboard';
import { OutdatedPlugin, getOutdatedPluginId } from '../../utils/pluginVersioning';
import { PanelVersionDiff } from './PanelVersionDiff';

export interface UpdatePluginsDrawerProps {
  isOpen: boolean;
  /** The plugins pinned to a version older than the latest available one. */
  outdatedPlugins: OutdatedPlugin[];
  /** Called with the plugins the user selected for update. */
  onUpdate: (plugins: OutdatedPlugin[]) => void;
  onClose: () => void;
}

/**
 * Drawer listing every plugin the dashboard pins to an outdated version, letting the user pick which ones to update to
 * their latest available version. Panel plugins can be expanded to show a side-by-side preview of a representative
 * panel rendered with the current and the new plugin version.
 */
export function UpdatePluginsDrawer(props: UpdatePluginsDrawerProps): ReactElement {
  const { isOpen, outdatedPlugins, onUpdate, onClose } = props;
  const { dashboard } = useDashboard();
  const panels = dashboard.spec.panels ?? {};

  // Selected plugin ids. Everything starts unselected so updating is always an explicit action.
  // Sets, because these ids are looked up once per rendered row.
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());

  const allIds = useMemo(
    () => new Set(outdatedPlugins.map((plugin) => getOutdatedPluginId(plugin))),
    [outdatedPlugins],
  );
  const selectedCount = selectedIds.size;
  const isAllSelected = allIds.size > 0 && selectedCount === allIds.size;
  const isPartiallySelected = selectedCount > 0 && !isAllSelected;

  const toggleAll = (): void => {
    setSelectedIds(isAllSelected ? new Set() : new Set(allIds));
  };

  const toggleId = (setIds: typeof setSelectedIds, id: string): void => {
    setIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  };

  const resetSelection = (): void => {
    setSelectedIds(new Set());
    setExpandedIds(new Set());
  };

  const handleUpdate = (): void => {
    const selection = outdatedPlugins.filter((plugin) => selectedIds.has(getOutdatedPluginId(plugin)));
    // The parent closes the drawer without going through `handleClose`, so reset here too: otherwise a partial update
    // would leave stale selections behind and re-enable Update on plugins that are already up to date.
    resetSelection();
    onUpdate(selection);
  };

  const handleClose = (): void => {
    resetSelection();
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} data-testid="update-plugins-drawer">
      <Stack height="100%">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: (theme) => theme.spacing(1, 2),
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h2">Update plugins</Typography>
          <Stack direction="row" spacing={1} marginLeft="auto">
            <Button variant="contained" disabled={selectedCount === 0} onClick={handleUpdate}>
              Update{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', padding: (theme) => theme.spacing(2) }}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            The following plugins are pinned to an older version than the one installed. Select the plugins you want to
            update to their latest version.
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={isAllSelected}
                indeterminate={isPartiallySelected}
                onChange={toggleAll}
                inputProps={{ 'aria-label': 'Select all plugins' }}
              />
            }
            label={isAllSelected ? 'Unselect all' : 'Select all'}
          />
          <Divider sx={{ mb: 1 }} />

          <Stack divider={<Divider />}>
            {outdatedPlugins.map((plugin) => {
              const id = getOutdatedPluginId(plugin);
              const isExpanded = expandedIds.has(id);
              // Only panel plugins can be previewed, and only if we found a panel using them.
              const examplePanel =
                plugin.pluginType === 'Panel' && plugin.examplePanelKey ? panels[plugin.examplePanelKey] : undefined;

              return (
                <Box key={id} py={1} data-testid="outdated-plugin">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Checkbox
                      checked={selectedIds.has(id)}
                      onChange={() => toggleId(setSelectedIds, id)}
                      inputProps={{ 'aria-label': `Select ${plugin.kind}` }}
                    />
                    <Stack flex={1} minWidth={0}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1">{plugin.kind}</Typography>
                        <Chip label={plugin.pluginType} size="small" variant="outlined" />
                        {plugin.occurrences > 1 && (
                          <Typography variant="caption" color="text.secondary">
                            {plugin.occurrences} usages
                          </Typography>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          {plugin.currentVersion}
                        </Typography>
                        <ArrowRight fontSize="small" color="disabled" />
                        <Typography variant="body2" color="primary">
                          {plugin.latestVersion}
                        </Typography>
                      </Stack>
                    </Stack>
                    {examplePanel && (
                      <IconButton
                        onClick={() => toggleId(setExpandedIds, id)}
                        aria-label={isExpanded ? `Hide preview of ${plugin.kind}` : `Show preview of ${plugin.kind}`}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </IconButton>
                    )}
                  </Stack>

                  {examplePanel && (
                    <Collapse in={isExpanded} mountOnEnter unmountOnExit>
                      <Box pt={1} pl={5}>
                        <ErrorBoundary FallbackComponent={ErrorAlert}>
                          <PanelVersionDiff
                            panelDefinition={examplePanel}
                            currentVersion={plugin.currentVersion}
                            latestVersion={plugin.latestVersion}
                            registry={plugin.registry}
                          />
                        </ErrorBoundary>
                      </Box>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
}
