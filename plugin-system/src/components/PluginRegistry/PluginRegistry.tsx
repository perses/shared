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

import { UnknownSpec } from '@perses-dev/spec';
import { useRef, useCallback, useMemo, ReactNode, ReactElement } from 'react';

import {
  PluginModuleResource,
  PluginType,
  PluginImplementation,
  Plugin,
  PluginLoader,
  DefaultPluginKinds,
} from '../../model';
import { PluginRegistryContext } from '../../runtime';
import { comparePluginVersions, useEvent } from '../../utils';
import { resolvePluginKeys } from './getPluginSearchHelper';
import { usePluginIndexes, PluginCompoundKey } from './plugin-indexes';

export interface PluginRegistryProps {
  pluginLoader: PluginLoader;
  defaultPluginKinds?: DefaultPluginKinds;
  children?: ReactNode;
}

/**
 * Returns the indexed key of a plugin served by a local dev server for the given plugin type and kind, if any.
 * Keys are `${kind}:${name}:${registry}:${version}`, so we match on the `kind:name:` prefix.
 */
function findDevPluginKey(devPluginKeys: Set<string>, kind: string, name: string): string | undefined {
  const prefix = `${kind}:${name}:`;
  for (const key of devPluginKeys) {
    if (key.startsWith(prefix)) {
      return key;
    }
  }
  return undefined;
}

/**
 * Returns the indexed keys (`${kind}:${name}:${registry}:${version}`) matching *every* field supplied in the query.
 * `kind` and `name` are always compared; `registry` and `version` are only compared when they are set, so a
 * version-only pin matches whatever registry the plugin happens to be installed under, and a registry-only pin never
 * leaks into another registry. Results are ordered from the newest version to the oldest.
 */
function findMatchingPluginKeys<T extends PluginType>(
  allKeys: Iterable<string>,
  query: PluginCompoundKey<T>,
): string[] {
  const { kind, name, registry, version } = query;
  const prefix = `${kind}:${name}:`;
  const matches: Array<{ key: string; version: string }> = [];

  for (const key of allKeys) {
    if (!key.startsWith(prefix)) continue;
    const parts = key.split(':');
    if (parts.length !== 4) continue;
    const [, , keyRegistry, keyVersion] = parts;
    if (registry !== undefined && keyRegistry !== registry) continue;
    if (version !== undefined && keyVersion !== version) continue;
    matches.push({ key, version: keyVersion ?? '' });
  }

  return matches.toSorted((a, b) => comparePluginVersions(b.version, a.version)).map((match) => match.key);
}

/**
 * PluginRegistryContext provider that keeps track of all available plugins and provides an API for getting them or
 * querying the metadata about them.
 */
export function PluginRegistry(props: PluginRegistryProps): ReactElement {
  const {
    pluginLoader: { getInstalledPlugins, importPluginModule },
    children,
    defaultPluginKinds,
  } = props;

  const getPluginIndexes = usePluginIndexes(getInstalledPlugins);

  // De-dupe calls to import plugin modules
  const importCache = useRef(new Map<PluginModuleResource, Promise<unknown>>());

  // Do useEvent here since this accesses the importPluginModule prop and we want a stable reference to it for the
  // callback below
  const loadPluginModule = useEvent((resource: PluginModuleResource) => {
    let request = importCache.current.get(resource);
    if (request === undefined) {
      request = importPluginModule(resource);
      importCache.current.set(resource, request);

      // Remove failed requests from the cache so they can potentially be retried
      request.catch(() => importCache.current.delete(resource));
    }
    return request;
  });

  const getPlugin = useCallback(
    async <T extends PluginType>(compoundKeyObj: PluginCompoundKey<T>): Promise<PluginImplementation<T>> => {
      const pluginIndexes = await getPluginIndexes();
      const { kind, name, version, registry } = compoundKeyObj;
      const allKeys = pluginIndexes.pluginResourcesByNameKindRegistryVersion.keys();

      let candidateKeys: string[];
      if (version || registry) {
        // A pin is an exact constraint: only the plugins matching every supplied field are acceptable, and we never
        // silently fall back to another version or another registry.
        candidateKeys = findMatchingPluginKeys(allKeys, compoundKeyObj);
      } else {
        candidateKeys = resolvePluginKeys(allKeys, compoundKeyObj);
        // Nothing pinned: a plugin served by a local dev server (`percli plugin start`) wins over installed archives,
        // whatever their versions. Otherwise a dev plugin whose package version is lower than an installed archive would
        // never be used, which defeats the purpose of running it in dev.
        const devKey = findDevPluginKey(pluginIndexes.devPluginKeys, kind, name);
        if (devKey) {
          candidateKeys = [devKey, ...candidateKeys.filter((key) => key !== devKey)];
        }
      }

      for (const resourceKey of candidateKeys) {
        const resource = pluginIndexes.pluginResourcesByNameKindRegistryVersion.get(resourceKey);
        if (!resource) continue;

        const pluginModule = (await loadPluginModule(resource)) as Record<string, Plugin<UnknownSpec>>;
        // Try to get the plugin implementation from the module using the versioned export first
        const plugin = pluginModule?.[resourceKey];
        if (plugin) return plugin as PluginImplementation<T>;
        // If the plugin module doesn't have a versioned export, fallback to the plugin name
        const versionlessPlugin = pluginModule?.[name];
        if (versionlessPlugin) return versionlessPlugin as PluginImplementation<T>;
      }

      const pins = [
        version ? `version '${version}'` : undefined,
        registry ? `registry '${registry}'` : undefined,
      ].filter((pin) => pin !== undefined);
      throw new Error(
        pins.length > 0
          ? `A ${name} plugin for kind '${kind}' with ${pins.join(' and ')} is not installed`
          : `A ${name} plugin for kind '${kind}' is not installed`,
      );
    },
    [getPluginIndexes, loadPluginModule],
  );

  const listPluginMetadata = useCallback(
    async (pluginTypes?: PluginType[]) => {
      const pluginIndexes = await getPluginIndexes();
      if (pluginTypes === undefined) {
        // No filter: return the metadata of every installed plugin, whatever its type.
        return [...pluginIndexes.pluginMetadataByKind.values()].flat();
      }
      return pluginTypes.flatMap((type) => pluginIndexes.pluginMetadataByKind.get(type) ?? []);
    },
    [getPluginIndexes],
  );

  // Create the registry's context value and render
  const context = useMemo(
    () => ({ getPlugin, listPluginMetadata, defaultPluginKinds }),
    [getPlugin, listPluginMetadata, defaultPluginKinds],
  );
  return <PluginRegistryContext.Provider value={context}>{children}</PluginRegistryContext.Provider>;
}
