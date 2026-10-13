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

import type { Resource } from '@perses-dev/client';

function getDisplayName(spec: unknown): string | undefined {
  if (typeof spec !== 'object' || spec === null || !('display' in spec)) return undefined;
  const { display } = spec;
  if (typeof display !== 'object' || display === null || !('name' in display)) return undefined;
  return typeof display.name === 'string' && display.name ? display.name : undefined;
}

function getSpecDisplayName(spec: unknown): string | undefined {
  // Variables wrap their display settings in a nested spec.
  const nestedSpec = typeof spec === 'object' && spec !== null && 'spec' in spec ? spec.spec : undefined;
  return getDisplayName(nestedSpec) ?? getDisplayName(spec);
}

export function getResourceDisplayName<T extends Resource>(resource: T): string {
  return getSpecDisplayName(resource.spec) ?? resource.metadata.name;
}

/**
 * If the resource has a display name, return the resource display name with the resource name too
 * Else, only return the resource name
 */
export function getResourceExtendedDisplayName<T extends Resource>(resource: T): string {
  const displayName = getSpecDisplayName(resource.spec);
  return displayName ? `${displayName} (ID: ${resource.metadata.name})` : resource.metadata.name;
}
