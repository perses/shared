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

import { VariableStateMap } from './variables';

export function filterVariableStateMap(v: VariableStateMap, names?: string[]): VariableStateMap {
  if (!names) {
    return v;
  }
  return Object.fromEntries(Object.entries(v).filter(([name]) => names.includes(name)));
}

/**
 * Returns a serialized string of the current state of variable values.
 */
export function getVariableValuesKey(v: VariableStateMap): string {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}

/**
 * Adds a random jitter delay to distribute query requests over time.
 * This helps reduce server load by preventing all panels from firing queries in bursts.
 */
export function jitterDelay(minMs = 0, maxMs = 500): Promise<void> {
  const safeMin = Number.isFinite(minMs) ? minMs : 0;
  const safeMax = Number.isFinite(maxMs) ? maxMs : 0;
  const normalizedMin = Math.max(0, Math.min(safeMin, safeMax));
  const normalizedMax = Math.max(0, Math.max(safeMin, safeMax));

  if (normalizedMax === 0) {
    return Promise.resolve();
  }

  const delay = Math.floor(Math.random() * (normalizedMax - normalizedMin + 1)) + normalizedMin;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
