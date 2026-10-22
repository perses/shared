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

import type { PluginMetadataWithModule } from '@perses-dev/plugin-system';
import type { ReactNode } from 'react';

/** A tab of the explore page, defined by the consumer. */
export interface ExploreTab {
  /** Unique identifier of the tab. */
  id: string;
  /** Text displayed in the tab. */
  label: string;
  /** Name of the Explore plugin associated with the tab. It is rendered when no `content` is given. */
  explorerPluginName?: string;
  /** Content rendered by the tab instead of the explorer plugin, for example a custom explorer. */
  content?: ReactNode;
}

/** A tab of the explore page, resolved against the installed Explore plugins. */
export interface ResolvedExploreTab {
  /** Identifier of the tab, as stored in the explorer manager state. */
  key: string;
  label: string;
  plugin?: PluginMetadataWithModule;
  content?: ReactNode;
  /** Name of the expected Explore plugin when it is not installed. */
  missingPluginName?: string;
}

/** Identifier of an explorer plugin, as stored in the explorer manager state. */
export function getExplorerKey(plugin: PluginMetadataWithModule): string {
  return `${plugin.module.name}-${plugin.spec.name}`;
}

function toPluginTab(plugin: PluginMetadataWithModule): ResolvedExploreTab {
  return { key: getExplorerKey(plugin), label: plugin.spec.display.name, plugin };
}

/**
 * Resolves the tabs of the explore page. Without tab definitions, there is one tab per Explore plugin. With tab
 * definitions, each definition gets a tab, and the Explore plugins no definition refers to get a tab of their own after
 * them, so they stay reachable.
 */
export function resolveExploreTabs(
  plugins: PluginMetadataWithModule[],
  tabs: ExploreTab[] | undefined,
): ResolvedExploreTab[] {
  if (tabs === undefined) {
    return plugins.map(toPluginTab);
  }

  const definedTabs = tabs.map((tab): ResolvedExploreTab => {
    const plugin = tab.explorerPluginName ? plugins.find((p) => p.spec.name === tab.explorerPluginName) : undefined;
    return {
      key: plugin ? getExplorerKey(plugin) : `tab-${tab.id}`,
      label: tab.label,
      plugin,
      content: tab.content,
      missingPluginName: plugin || tab.content !== undefined ? undefined : tab.explorerPluginName,
    };
  });
  const otherTabs = plugins
    .filter((plugin) => !tabs.some((tab) => tab.explorerPluginName === plugin.spec.name))
    .map(toPluginTab);
  return [...definedTabs, ...otherTabs];
}
