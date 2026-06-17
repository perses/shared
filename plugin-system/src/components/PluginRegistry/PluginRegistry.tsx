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
import { useEvent } from '../../utils';
import { resolvePluginKeys } from './getPluginSearchHelper';
import { usePluginIndexes, PluginCompoundKey } from './plugin-indexes';

export interface PluginRegistryProps {
  pluginLoader: PluginLoader;
  defaultPluginKinds?: DefaultPluginKinds;
  children?: ReactNode;
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
      const { kind, name } = compoundKeyObj;

      const candidateKeys = resolvePluginKeys(
        pluginIndexes.pluginResourcesByNameKindRegistryVersion.keys(),
        compoundKeyObj
      );

      for (const resourceKey of candidateKeys) {
        const resource = pluginIndexes.pluginResourcesByNameKindRegistryVersion.get(resourceKey);
        if (!resource) continue;

        const pluginModule = (await loadPluginModule(resource)) as Record<string, Plugin<UnknownSpec>>;
        const plugin = pluginModule?.[resourceKey];
        if (plugin) return plugin as PluginImplementation<T>;
      }

      throw new Error(`A ${name} plugin for kind '${kind}' is not installed`);
    },
    [getPluginIndexes, loadPluginModule]
  );

  const listPluginMetadata = useCallback(
    async (pluginTypes: PluginType[]) => {
      const pluginIndexes = await getPluginIndexes();
      return pluginTypes.flatMap((type) => pluginIndexes.pluginMetadataByKind.get(type) ?? []);
    },
    [getPluginIndexes]
  );

  // Create the registry's context value and render
  const context = useMemo(
    () => ({ getPlugin, listPluginMetadata, defaultPluginKinds }),
    [getPlugin, listPluginMetadata, defaultPluginKinds]
  );
  return <PluginRegistryContext.Provider value={context}>{children}</PluginRegistryContext.Provider>;
}
