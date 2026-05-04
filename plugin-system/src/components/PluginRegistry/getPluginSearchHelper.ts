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

import { gt } from 'semver';
import { PluginType } from '../../model';
import { PluginCompoundKey } from './plugin-indexes';

/**
 * ____ LOOK UP DEFAULT PLUGIN KEYS WITH PLUGIN TYPE (KIND) AND NAME ___
 * This is the fallback mechanism to look up the default plugin using the plugin type (kind) and the name
 * When the version and registry are not available, the function shortlists all plugins which have the kind and name combination
 * If multiple plugins are nominated, the function will follow a precedence policy
 * ___ PLUGIN LOOKUP PRECEDENCE POLICY ___
 * The search finds the latest versions available for plugins with and without registry by keeping them in two separate buckets
 * 1- If nothing found, simply return undefined
 * 2- If only one of the buckets have value, there will be no comparison. Return the one with the value
 * 3- If both have the value, check the Precedence Logic input and act accordingly
 * 3.1- If the one WITH the registry has a greater version, return it.
 * 3.2- If the one WITHOUT the registry has a greater version, return it
 * 3.2.1- If we have a draw consider the policy flag
 */

export interface PluginLookupPrecedenceLogic {
  registryOverVersion: boolean;
}

const PLUGIN_LOOKUP_PRECEDENCE_LOGIC: PluginLookupPrecedenceLogic = { registryOverVersion: false };

export const lookUpDefaultPluginKey = <T extends PluginType>(
  pluginModuleResourceMapKeys: string[],
  query: Pick<PluginCompoundKey<T>, 'kind' | 'name'>,
  precedenceLogic: PluginLookupPrecedenceLogic = PLUGIN_LOOKUP_PRECEDENCE_LOGIC
): string | undefined => {
  type PluginBucket = { key: string; version: string };
  const latestFoundVersionWithRegistry: PluginBucket = { key: '', version: '' };
  const latestFoundVersionWithoutRegistry: PluginBucket = { key: '', version: '' };

  for (const np of pluginModuleResourceMapKeys) {
    if (!np.startsWith(`${query.kind}:${query.name}:`)) continue;
    const split = np.split(':');

    /**
     * This is not a valid key. A valid key has 4 sections. The registry is optional. It might be empty or holds a value
     */
    if (split.length !== 4) {
      console.warn(`An invalid Plugin Resource key detected during default plugin lookup: ${np}`);
      continue;
    }

    const [kind, name, registry, version] = split;
    /**
     * Such a case is representing a wrong key and it is not technically possible (Just to be precautious)
     * A resource MUST have kind, name, and version according to its definition and interface
     * So skip this record
     */
    if (!kind || !name || !version) {
      console.warn(`An invalid Plugin Resource key detected during default plugin lookup: ${np}`);
      continue;
    }

    if (registry) {
      if (!latestFoundVersionWithRegistry.key || gt(version, latestFoundVersionWithRegistry.version!)) {
        latestFoundVersionWithRegistry.key = np;
        latestFoundVersionWithRegistry.version = version;
      }
      continue;
    }

    if (!latestFoundVersionWithoutRegistry.key || gt(version, latestFoundVersionWithoutRegistry.version!)) {
      latestFoundVersionWithoutRegistry.key = np;
      latestFoundVersionWithoutRegistry.version = version;
    }
  }

  /* Before it proceeds with the precedence logic, it checks whether so far anything has been found, if not return undefined  */
  if ([latestFoundVersionWithRegistry, latestFoundVersionWithoutRegistry].every((p) => !p.key)) {
    return undefined;
  }

  if (latestFoundVersionWithRegistry.key && latestFoundVersionWithoutRegistry.key) {
    const { registryOverVersion } = precedenceLogic;

    // Registry version is strictly higher
    if (gt(latestFoundVersionWithRegistry.version, latestFoundVersionWithoutRegistry.version)) {
      return latestFoundVersionWithRegistry.key;
    }

    // None-registry version is strictly higher
    if (gt(latestFoundVersionWithoutRegistry.version, latestFoundVersionWithRegistry.version)) {
      return latestFoundVersionWithoutRegistry.key;
    }

    // Versions are equal - use the tie-breaker
    return registryOverVersion ? latestFoundVersionWithRegistry.key : latestFoundVersionWithoutRegistry.key;
  }

  return latestFoundVersionWithRegistry.key || latestFoundVersionWithoutRegistry?.key;
};
