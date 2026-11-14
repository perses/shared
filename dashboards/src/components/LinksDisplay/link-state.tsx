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
import { useTimeRange } from '@perses-dev/plugin-system';
import type { TimeRangeValue } from '@perses-dev/spec';
import type { ReactElement } from 'react';

import { useVariableDefinitionStates } from '../../context';

export function WithTimeRange({
  enabled,
  children,
}: {
  enabled: boolean;
  children: (timeRange?: TimeRangeValue) => ReactElement;
}): ReactElement {
  return enabled ? <TimeRangeReader>{children}</TimeRangeReader> : children(undefined);
}

function TimeRangeReader({ children }: { children: (timeRange: TimeRangeValue) => ReactElement }): ReactElement {
  return children(useTimeRange().timeRange);
}

export function WithVariables({
  enabled,
  children,
}: {
  enabled: boolean;
  children: (variables?: VariableStateMap) => ReactElement;
}): ReactElement {
  return enabled ? <VariablesReader>{children}</VariablesReader> : children(undefined);
}

function VariablesReader({ children }: { children: (variables: VariableStateMap) => ReactElement }): ReactElement {
  return children(useVariableDefinitionStates());
}
