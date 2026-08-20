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

import { BuiltinVariableDefinition, Definition, PluginDefinitionMetadata } from '@perses-dev/spec';
import { useQueries, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  DefaultPluginKinds,
  PluginImplementation,
  PluginMetadataWithModule,
  PluginType,
  PluginCompoundKey,
} from '../model';
import { LATEST_PLUGIN_VERSION } from '../utils/plugin-versions';

export interface PluginRegistryContextType {
  getPlugin<T extends PluginType>(compoundKey: PluginCompoundKey<T>): Promise<PluginImplementation<T>>;
  listPluginMetadata(pluginTypes?: PluginType[]): Promise<PluginMetadataWithModule[]>;
  defaultPluginKinds?: DefaultPluginKinds;
}

export const PluginRegistryContext = createContext<PluginRegistryContextType | undefined>(undefined);

/**
 * Use the PluginRegistry context directly. This is meant as an escape hatch for custom async flows. You should probably
 * be using `usePlugin` or `useListPluginMetadata` instead.
 */
export function usePluginRegistry(): PluginRegistryContextType {
  const ctx = useContext(PluginRegistryContext);
  if (ctx === undefined) {
    throw new Error('PluginRegistryContext not found. Did you forget a provider?');
  }
  return ctx;
}

// Allows consumers to pass useQuery options from react-query when loading a plugin
type UsePluginOptions<T extends PluginType> = Omit<
  UseQueryOptions<
    PluginImplementation<T>,
    Error,
    PluginImplementation<T>,
    [string, PluginType | undefined, string, string, string]
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Extract the pinned version/registry from a plugin definition's `metadata`, if any. Returns `undefined` when nothing
 * is pinned so the plugin resolves to its latest available version.
 */
export function getPluginOverrides(
  plugin: Pick<Definition<unknown>, 'metadata'> | undefined,
): PluginDefinitionMetadata | undefined {
  const metadata = plugin?.metadata;
  if (!metadata) {
    return undefined;
  }
  // `latest` means "resolve the latest available version", so it must not be treated as an exact-version pin.
  const version = metadata.version === LATEST_PLUGIN_VERSION ? undefined : metadata.version;
  const registry = metadata.registry;
  if (version === undefined && registry === undefined) {
    return undefined;
  }
  return { version, registry };
}

/**
 * Loads a plugin and returns the plugin implementation, along with loading/error state.
 *
 * When `overrides.version` is provided, the plugin is resolved with an exact version match: if that version is not
 * installed, the query fails instead of silently falling back to the latest available version.
 */
export function usePlugin<T extends PluginType>(
  pluginType: T | undefined,
  kind: string,
  options?: UsePluginOptions<T>,
  overrides?: PluginDefinitionMetadata,
): UseQueryResult<PluginImplementation<T>, Error> {
  const { version, registry } = overrides ?? {};
  // We never want to ask for a plugin when the kind isn't set yet, so disable those queries automatically
  options = {
    ...options,
    enabled: (options?.enabled ?? true) && pluginType !== undefined && kind !== '',
  };
  const { getPlugin } = usePluginRegistry();
  return useQuery({
    queryKey: ['getPlugin', pluginType, kind, version ?? '', registry ?? ''],
    queryFn: () => getPlugin({ kind: pluginType!, name: kind, version, registry }),
    ...options,
  });
}

/**
 * A plugin reference to load, optionally pinned to a specific version/registry.
 */
export interface UsePluginsItem extends PluginDefinitionMetadata {
  kind: string;
}

/**
 * Full identity of a plugin to load. Two definitions pinned to different versions (or registries) of the same kind are
 * distinct plugins and must be loaded independently.
 */
function getUsePluginsItemIdentity(plugin: UsePluginsItem): string {
  return `${plugin.kind}:${plugin.version ?? ''}:${plugin.registry ?? ''}`;
}

/**
 * Loads a list of plugins and returns the plugin implementation, along with loading/error state.
 */
export function usePlugins<T extends PluginType>(
  pluginType: T,
  plugins: UsePluginsItem[],
): Array<UseQueryResult<PluginImplementation<T>>> {
  const { getPlugin } = usePluginRegistry();

  // useQueries() does not support queries with duplicate keys, therefore we de-duplicate the plugins before running useQueries()
  // This resolves the following warning in the JS console: "[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior."
  // https://github.com/TanStack/query/issues/8224#issuecomment-2523554831
  // https://github.com/TanStack/query/issues/4187#issuecomment-1256336901
  const uniquePlugins = new Map<string, UsePluginsItem>();
  for (const p of plugins) {
    const key = getUsePluginsItemIdentity(p);
    if (!uniquePlugins.has(key)) {
      uniquePlugins.set(key, p);
    }
  }
  const uniqueKeys = [...uniquePlugins.keys()];
  const uniqueValues = [...uniquePlugins.values()];

  const result: Array<UseQueryResult<PluginImplementation<T>>> = useQueries({
    queries: uniqueValues.map((p) => {
      return {
        queryKey: ['getPlugin', pluginType, p.kind, p.version ?? '', p.registry ?? ''],
        queryFn: () => getPlugin({ kind: pluginType, name: p.kind, version: p.version, registry: p.registry }),
      };
    }),
  });

  // Re-assemble array in original order. Index lookups go through a Map so this stays linear on large panels.
  const indexByIdentity = new Map(uniqueKeys.map((key, index) => [key, index]));
  return plugins.map((p) => result[indexByIdentity.get(getUsePluginsItemIdentity(p))!]!);
}

// Allow consumers to pass useQuery options from react-query when listing metadata
type UseListPluginMetadataOptions = Omit<
  UseQueryOptions<PluginMetadataWithModule[], Error, PluginMetadataWithModule[], [string, string[]]>,
  'queryKey' | 'queryFn'
>;

/**
 * Gets a list of plugin metadata for the specified plugin types and returns it, along with loading/error state. When
 * `pluginTypes` is omitted, the metadata of every installed plugin is returned, whatever its type.
 */
export function useListPluginMetadata(
  pluginTypes?: PluginType[],
  options?: UseListPluginMetadataOptions,
): UseQueryResult<PluginMetadataWithModule[]> {
  const { listPluginMetadata } = usePluginRegistry();
  return useQuery({
    // `['*']` marks the "every plugin type" query so it gets its own cache entry.
    queryKey: ['listPluginMetadata', pluginTypes ?? ['*']],
    queryFn: () => listPluginMetadata(pluginTypes),
    ...options,
  });
}

export function usePluginBuiltinVariableDefinitions(): UseQueryResult<BuiltinVariableDefinition[]> {
  const { getPlugin, listPluginMetadata } = usePluginRegistry();

  return useQuery({
    queryKey: ['usePluginBuiltinVariableDefinitions'],
    queryFn: async () => {
      const datasources = await listPluginMetadata(['Datasource']);
      const datasourceNames = new Set(datasources.map((datasource) => datasource.spec.name));
      const result: BuiltinVariableDefinition[] = [];
      for (const name of datasourceNames) {
        const plugin = await getPlugin({ kind: 'Datasource', name });
        if (plugin.getBuiltinVariableDefinitions) {
          plugin.getBuiltinVariableDefinitions().forEach((definition) => result.push(definition));
        }
      }
      return result;
    },
  });
}
