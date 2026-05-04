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
import { usePluginIndexes, PluginCompoundKey } from './plugin-indexes';
import { lookUpDefaultPluginKey } from './getPluginSearchHelper';

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
      let resource: PluginModuleResource | undefined = undefined;
      let pluginModule: Record<string, Plugin<UnknownSpec>> | undefined;
      const { kind, name, version, registry } = compoundKeyObj;

      /**
       * By default both version and registry are undefined,
       * If one or both are passed, the registry will check if the plugin with the specific version and registry is available,
       * falling back to the current behavior which is returning the default.
       */

      if (registry || version) {
        let compoundKey = '';
        /**
         * This branch tries to look up a resource deterministically, using a compound_key which consists of kind, name, registry, and version
         * Based on the user input, the likely keys are
         * 1- kind:name:registry:version (This is the complete compound key. It is very likely the key is looked up)
         * 2- kind:name::version (This is very likely, because registry is an optional field of the resource object)
         * 3- kind:name:registry: (It is impossible to find any combination, because version is a mandatory field of the resource. So, this will be handled by the fallback)
         * Note: It is likely that the key is not found. However, the search should NOT give up easily!
         * Instead it should continue with the fallback mechanism
         */
        compoundKey = `${kind}:${name}:${registry}:${version}`;
        resource = pluginIndexes.pluginResourcesByNameKindRegistryVersion.get(compoundKey);
        if (resource) {
          pluginModule = (await loadPluginModule(resource)) as Record<string, Plugin<UnknownSpec>>;
          const plugin = pluginModule?.[`${name}:${registry ?? ''}:${version ?? ''}`];
          if (!plugin) {
            throw new Error(
              `The ${name} plugin for kind '${kind}' is missing from the ${resource.metadata.name} plugin module`
            );
          }
          return plugin as PluginImplementation<T>;
        }
      }
      /**
       * This is the fallback mechanism branch.
       * It performs a minimal search using the mandatory inputs from user and returns the default resource
       * More information can be found in the searchHelper.ts
       */
      const resourceKey = lookUpDefaultPluginKey(
        Array.from(pluginIndexes.pluginResourcesByNameKindRegistryVersion.keys()),
        {
          kind,
          name,
        }
      );

      if (!resourceKey) {
        throw new Error(`A ${name} plugin for kind '${kind}' is not installed`);
      }

      resource = pluginIndexes.pluginResourcesByNameKindRegistryVersion.get(resourceKey)!;
      pluginModule = (await loadPluginModule(resource)) as Record<string, Plugin<UnknownSpec>>;

      const plugin = pluginModule?.[resourceKey];
      if (!plugin) {
        throw new Error(
          `The ${name} plugin for kind '${kind}' is missing from the ${resource.metadata.name} plugin module`
        );
      }
      return plugin as PluginImplementation<T>;
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
