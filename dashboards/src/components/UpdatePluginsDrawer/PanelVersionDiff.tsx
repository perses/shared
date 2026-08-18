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

import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { PanelDefinition } from '@perses-dev/spec';
import { DataQueriesProvider } from '@perses-dev/plugin-system';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { ReactElement, useMemo } from 'react';
import { Panel } from '../Panel';

const PREVIEW_HEIGHT = 260;

export interface PanelVersionDiffProps {
  /** The panel used as a representative example of the plugin being updated. */
  panelDefinition: PanelDefinition;
  /** The version currently pinned in the dashboard spec. */
  currentVersion: string;
  /** The latest available version the plugin would be updated to. */
  latestVersion: string;
}

/** Returns a copy of the panel definition with its panel plugin pinned to the given version. */
function withPluginVersion(panelDefinition: PanelDefinition, version: string): PanelDefinition {
  const next: PanelDefinition = JSON.parse(JSON.stringify(panelDefinition));
  const plugin = next.spec.plugin as typeof next.spec.plugin & { metadata?: { version?: string } };
  plugin.metadata = { ...plugin.metadata, version };
  return next;
}

/**
 * Renders the same panel twice, side by side: once with the plugin version currently pinned in the dashboard, and once
 * with the latest available version. This lets users spot new features or rendering regressions before updating.
 */
export function PanelVersionDiff(props: PanelVersionDiffProps): ReactElement {
  const { panelDefinition, currentVersion, latestVersion } = props;

  const currentDefinition = useMemo(
    () => withPluginVersion(panelDefinition, currentVersion),
    [panelDefinition, currentVersion]
  );
  const latestDefinition = useMemo(
    () => withPluginVersion(panelDefinition, latestVersion),
    [panelDefinition, latestVersion]
  );

  const queries = panelDefinition.spec.queries ?? [];

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        Preview based on panel &quot;{panelDefinition.spec.display?.name ?? 'Untitled'}&quot;
      </Typography>
      {/* Both sides share a single queries provider: only the panel plugin version differs, so the data is the same. */}
      <DataQueriesProvider definitions={queries}>
        <Stack direction="row" spacing={2} alignItems="stretch">
          <Box flex={1} minWidth={0}>
            <Chip label={`Current · ${currentVersion}`} size="small" sx={{ mb: 0.5 }} />
            <Box height={PREVIEW_HEIGHT}>
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <Panel definition={currentDefinition} panelOptions={{ hideHeader: true }} />
              </ErrorBoundary>
            </Box>
          </Box>
          <Box flex={1} minWidth={0}>
            <Chip label={`New · ${latestVersion}`} size="small" color="primary" sx={{ mb: 0.5 }} />
            <Box height={PREVIEW_HEIGHT}>
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <Panel definition={latestDefinition} panelOptions={{ hideHeader: true }} />
              </ErrorBoundary>
            </Box>
          </Box>
        </Stack>
      </DataQueriesProvider>
      {queries.length === 0 && (
        <Alert severity="info" sx={{ backgroundColor: 'transparent', py: 0 }}>
          This panel has no query, the preview only reflects rendering differences.
        </Alert>
      )}
    </Stack>
  );
}
