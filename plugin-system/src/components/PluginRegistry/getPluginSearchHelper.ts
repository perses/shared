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

import { PluginType, getPluginModuleCompoundKey } from '../../model';
import { PluginCompoundKey } from './plugin-indexes';

// When both a registry and non-registry variant exist at the same version,
// `registryOverVersion: true` prefers the registry variant.
export interface PluginLookupPrecedenceLogic {
  registryOverVersion: boolean;
}

const PLUGIN_LOOKUP_PRECEDENCE_LOGIC: PluginLookupPrecedenceLogic = { registryOverVersion: false };

/**
 * Returns an ordered list of candidate 4-part keys to try when resolving a plugin.
 * If version/registry are specified, the exact-match key comes first.
 * The best fallback key (highest version, tie-broken by precedence policy) follows.
 */
export const resolvePluginKeys = <T extends PluginType>(
  allKeys: Iterable<string>,
  query: PluginCompoundKey<T>,
  precedenceLogic: PluginLookupPrecedenceLogic = PLUGIN_LOOKUP_PRECEDENCE_LOGIC
): string[] => {
  const { kind, name, version, registry } = query;
  const candidates: string[] = [];

  // Exact match first when version or registry is specified
  if (version || registry) {
    candidates.push(getPluginModuleCompoundKey({ kind, name, registry, version }));
  }

  // Find the best fallback by scanning all matching keys
  type PluginBucket = { key: string; version: string };
  const latestWithRegistry: PluginBucket = { key: '', version: '' };
  const latestWithoutRegistry: PluginBucket = { key: '', version: '' };

  const prefix = `${kind}:${name}:`;
  for (const key of allKeys) {
    if (!key.startsWith(prefix)) continue;
    const split = key.split(':');

    if (split.length !== 4) {
      console.warn(`An invalid Plugin Resource key detected during default plugin lookup: ${key}`);
      continue;
    }

    const [, , reg, ver] = split;
    if (!ver) {
      console.warn(`An invalid Plugin Resource key detected during default plugin lookup: ${key}`);
      continue;
    }

    if (reg) {
      if (!latestWithRegistry.key || gt(ver, latestWithRegistry.version)) {
        latestWithRegistry.key = key;
        latestWithRegistry.version = ver;
      }
    } else {
      if (!latestWithoutRegistry.key || gt(ver, latestWithoutRegistry.version)) {
        latestWithoutRegistry.key = key;
        latestWithoutRegistry.version = ver;
      }
    }
  }

  // Determine the best fallback key from the two buckets
  let fallbackKey: string | undefined;

  if (latestWithRegistry.key && latestWithoutRegistry.key) {
    const { registryOverVersion } = precedenceLogic;

    if (gt(latestWithRegistry.version, latestWithoutRegistry.version)) {
      fallbackKey = latestWithRegistry.key;
    } else if (gt(latestWithoutRegistry.version, latestWithRegistry.version)) {
      fallbackKey = latestWithoutRegistry.key;
    } else {
      // Versions are equal — use the tie-breaker
      fallbackKey = registryOverVersion ? latestWithRegistry.key : latestWithoutRegistry.key;
    }
  } else {
    fallbackKey = latestWithRegistry.key || latestWithoutRegistry.key || undefined;
  }

  if (fallbackKey && !candidates.includes(fallbackKey)) {
    candidates.push(fallbackKey);
  }

  return candidates;
};
