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

import type { SemVer } from 'semver';
import { coerce, compare, parse } from 'semver';

/**
 * Sentinel version meaning "the latest version available in the Perses instance". It mirrors the backend
 * `plugin.LatestVersion` constant. A plugin definition using it is not pinned to an exact version: the plugin registry
 * resolves it dynamically at load time.
 */
export const LATEST_PLUGIN_VERSION = 'latest';

/**
 * Parse a plugin version with semver, tolerating the loose forms the backend also accepts (a leading `v`, a missing
 * patch segment, ...). Returns `null` when the value cannot be understood as a version at all.
 */
function parsePluginVersion(version: string): SemVer | null {
  return parse(version, { loose: true }) ?? coerce(version);
}

/**
 * Compare two plugin version strings with semver semantics, the same way the Perses backend orders plugin versions.
 * Returns a positive number when `a` is greater than `b`, a negative number when it is lower, and 0 when they are equal.
 *
 * Pre-releases order below their stable release (`1.0.0-beta` < `1.0.0`), as semver mandates. Versions that cannot be
 * parsed at all always order below parseable ones, and are compared lexicographically between themselves, so an
 * unexpected value can never be picked as "the latest version".
 */
export function comparePluginVersions(a: string, b: string): number {
  const parsedA = parsePluginVersion(a);
  const parsedB = parsePluginVersion(b);
  if (parsedA && parsedB) {
    return compare(parsedA, parsedB);
  }
  if (parsedA) {
    return 1;
  }
  if (parsedB) {
    return -1;
  }
  return a.localeCompare(b);
}

/** Return a new array of versions sorted from newest to oldest, using {@link comparePluginVersions}. */
export function sortPluginVersionsDesc(versions: string[]): string[] {
  return versions.toSorted((a, b) => comparePluginVersions(b, a));
}
