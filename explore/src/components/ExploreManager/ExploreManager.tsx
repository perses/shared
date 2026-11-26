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

import { Alert, Card, Stack, Tab, Tabs } from '@mui/material';
import { PluginLoaderComponent, usePluginRegistry } from '@perses-dev/plugin-system';
import type { ReactElement, ReactNode, SyntheticEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { ExploreToolbar } from '../ExploreToolbar';
import type { ExploreTab, ResolvedExploreTab } from './explore-tabs';
import { useExplorerManagerContext } from './ExplorerManagerProvider';
import { useExploreTabs } from './use-explore-tabs';

export { useSortedExplorerPlugins } from './use-explore-tabs';

const ROOT_SX = { width: '100%' };
const TABS_SX = { borderBottom: 1, borderColor: 'divider' };
const CARD_SX = { padding: '10px', width: '100%', minWidth: 0 };

export interface ExploreManagerProps {
  exploreTitleComponent?: ReactNode;
  /**
   * Tabs of the explore page. Defaults to one tab per Explore plugin, sorted by display name. Keep the array stable
   * between renders (e.g. define it outside of the component or memoize it).
   */
  tabs?: ExploreTab[];
}

/** Explore page: the toolbar, a tab per explorer, and the content of the selected tab. */
export function ExploreManager(props: ExploreManagerProps): ReactElement {
  const { exploreTitleComponent, tabs } = props;
  const { explorer, setExplorer } = useExplorerManagerContext();
  const resolvedTabs = useExploreTabs(tabs);

  const handleTabChange = useCallback((_: SyntheticEvent, key: string) => setExplorer(key), [setExplorer]);

  if (!explorer) {
    return <div>No explorer plugin available</div>;
  }

  const currentTab = resolvedTabs?.find((tab) => tab.key === explorer);

  return (
    <Stack sx={ROOT_SX} px={2} pb={2} pt={1.5} gap={1}>
      <ExploreToolbar exploreTitleComponent={exploreTitleComponent} />
      <Tabs
        value={currentTab ? explorer : false}
        onChange={handleTabChange}
        variant="scrollable"
        aria-label="Explorers"
        sx={TABS_SX}
      >
        {resolvedTabs?.map((tab) => (
          <Tab key={tab.key} value={tab.key} label={tab.label} />
        ))}
      </Tabs>
      {currentTab && <ExploreTabContent tab={currentTab} />}
    </Stack>
  );
}

interface ExploreTabContentProps {
  tab: ResolvedExploreTab;
}

function ExploreTabContent(props: ExploreTabContentProps): ReactNode {
  const { tab } = props;
  const { pluginsBaseURL } = usePluginRegistry();
  const plugin = useMemo(
    () =>
      tab.plugin && {
        name: tab.plugin.spec.name,
        moduleName: tab.plugin.module.name,
        version: tab.plugin.module.version,
        registry: tab.plugin.module.registry,
        baseURL: pluginsBaseURL,
      },
    [tab.plugin, pluginsBaseURL],
  );

  // Custom content owns its layout.
  if (tab.content !== undefined) {
    return tab.content;
  }
  return (
    <Card sx={CARD_SX}>
      {plugin && <PluginLoaderComponent key={tab.key} plugin={plugin} />}
      {!plugin && (
        <Alert severity="info">
          {tab.missingPluginName
            ? `${tab.label} is not available: the ${tab.missingPluginName} plugin is not installed.`
            : `${tab.label} is not available.`}
        </Alert>
      )}
    </Card>
  );
}
