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

import type { VariableStateMap } from '@perses-dev/plugin-system';

import type { PanelGroupVisibility } from '../model';

// Patterns are anchored like Prometheus label matchers; an invalid pattern never matches.
function matchesPattern(pattern: string, value: string): boolean {
  try {
    return new RegExp(`^(?:${pattern})$`).test(value);
  } catch {
    return false;
  }
}

/**
 * A group without visibility is always visible. Otherwise the selected values of the variable are tested against
 * `visibility.value` with `visibility.operator` (default `equals`); an unknown or loading variable hides the group.
 */
export function isPanelGroupVisible(
  visibility: PanelGroupVisibility | undefined,
  variableValues: VariableStateMap,
): boolean {
  if (!visibility) {
    return true;
  }
  const state = variableValues[visibility.variable];
  if (!state || state.loading) {
    return false;
  }
  const selected: string[] = [state.value ?? []].flat();
  const matchesAny = (value: string): boolean =>
    visibility.operator === 'matches' || visibility.operator === 'notMatches'
      ? visibility.value.some((pattern) => matchesPattern(pattern, value))
      : visibility.value.includes(value);

  switch (visibility.operator) {
    case 'notEquals':
    case 'notMatches':
      return !selected.some(matchesAny);
    default:
      return selected.some(matchesAny);
  }
}
