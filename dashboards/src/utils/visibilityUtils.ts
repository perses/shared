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
import type { Visibility } from '@perses-dev/spec';

// Anchored like a Prometheus matcher. A leading RE2 (?i) becomes the JS i flag.
// Any other pattern the JS engine rejects never matches.
function matchesPattern(pattern: string, value: string): boolean {
  const caseInsensitive = pattern.startsWith('(?i)');
  const source = caseInsensitive ? pattern.slice(4) : pattern;
  try {
    return new RegExp(`^(?:${source})$`, caseInsensitive ? 'i' : '').test(value);
  } catch {
    return false;
  }
}

/**
 * A group without visibility is always visible. Otherwise the selected values of the variable are tested against
 * `visibility.value` with `visibility.operator` (default `equals`). An unknown variable, or one still loading
 * with no value yet, hides the group. A refresh that keeps the previous value leaves the group mounted.
 */
export function isPanelGroupVisible(visibility: Visibility | undefined, variableValues: VariableStateMap): boolean {
  if (!visibility) {
    return true;
  }
  const state = variableValues[visibility.variable];
  if (!state || (state.loading && state.value == null)) {
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

export interface VisibilityNotice {
  hidden: boolean;
  description: string;
}

const operatorText: Record<NonNullable<Visibility['operator']>, string> = {
  equals: 'is',
  notEquals: 'is not',
  matches: 'matches',
  notMatches: 'does not match',
};

export function visibilityNotice(visibility: Visibility, variableValues: VariableStateMap): VisibilityNotice {
  const operator = visibility.operator ?? 'equals';
  return {
    hidden: !isPanelGroupVisible(visibility, variableValues),
    description: `Shown when ${visibility.variable} ${operatorText[operator]} ${visibility.value.join(', ')}`,
  };
}
