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

import { TimeRangeProviderBasic, useVariableValues } from '@perses-dev/plugin-system';
import { DEFAULT_ALL_VALUE, VariableDefinition } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

import { VariableProvider } from './VariableProvider';

const variableDefinitions: VariableDefinition[] = [
  {
    kind: 'ListVariable',
    spec: {
      name: 'stack',
      allowAllValue: true,
      allowMultiple: true,
      plugin: {
        kind: 'StaticListVariable',
        spec: {
          values: ['stack-a', 'stack-b'],
        },
      },
    },
  },
];
const initialTimeRange = { pastDuration: '30m' } as const;
const initialVariableValues = { stack: DEFAULT_ALL_VALUE };

describe('VariableProvider', () => {
  it('keeps a compact display value when expanding an all selection for consumers', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <TimeRangeProviderBasic initialTimeRange={initialTimeRange}>
          <VariableProvider
            initialVariableDefinitions={variableDefinitions}
            initialVariableValues={initialVariableValues}
          >
            {children}
          </VariableProvider>
        </TimeRangeProviderBasic>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useVariableValues(), { wrapper });

    expect(result.current.stack?.value).toEqual([]);
    expect(result.current.stack?.displayValue).toBe('All');
  });
});
