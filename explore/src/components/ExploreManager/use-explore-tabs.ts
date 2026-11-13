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
import { comparePluginVersions, useListPluginMetadata } from '@perses-dev/plugin-system';
import { useMemo } from 'react';

import type { ExploreTab, ResolvedExploreTab } from './explore-tabs';
import { getExplorerKey, resolveExploreTabs } from './explore-tabs';

/** Same precedence as the plugin registry: a plugin served in dev wins over installed ones, whatever their versions. */
function isPreferredOver(plugin: PluginMetadataWithModule, other: PluginMetadataWithModule): boolean {
  if (Boolean(plugin.inDev) !== Boolean(other.inDev)) {
    return Boolean(plugin.inDev);
  }
  return comparePluginVersions(plugin.module.version, other.module.version) > 0;
}

/**
 * Explore plugins sorted by display name, matching the order of the explorer tabs. When several versions of the same
 * explorer are installed, only the one served in dev, or else the latest, is kept.
 */
export function useSortedExplorerPlugins(): PluginMetadataWithModule[] | undefined {
  const plugins = useListPluginMetadata(['Explore']);
  return useMemo(() => {
    if (!plugins.data) {
      return undefined;
    }
    const latestByKey = new Map<string, PluginMetadataWithModule>();
    for (const plugin of plugins.data) {
      const key = getExplorerKey(plugin);
      const existing = latestByKey.get(key);
      if (!existing || isPreferredOver(plugin, existing)) {
        latestByKey.set(key, plugin);
      }
    }
    return [...latestByKey.values()].toSorted((a, b) => a.spec.display.name.localeCompare(b.spec.display.name));
  }, [plugins.data]);
}

/**
 * Tabs of the explore page, resolved against the installed Explore plugins. Undefined while the plugins are loading.
 * See `resolveExploreTabs` for how the tabs are built.
 */
export function useExploreTabs(tabs?: ExploreTab[]): ResolvedExploreTab[] | undefined {
  const plugins = useSortedExplorerPlugins();
  return useMemo(() => (plugins ? resolveExploreTabs(plugins, tabs) : undefined), [plugins, tabs]);
}
