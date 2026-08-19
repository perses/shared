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

import { VariableStateMap } from '@perses-dev/components';
import { useVariableValues, VariableContext } from '@perses-dev/plugin-system';
import { renderHook } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

import { FixedValueVariableProvider } from './FixedValueVariableProvider';

function renderWithProvider(
  variableName: string,
  fixedValue: string,
  outerState: VariableStateMap,
): ReturnType<typeof renderHook<ReturnType<typeof useVariableValues>, unknown>> {
  const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <VariableContext.Provider value={{ state: outerState }}>
      <FixedValueVariableProvider variableName={variableName} value={fixedValue}>
        {children}
      </FixedValueVariableProvider>
    </VariableContext.Provider>
  );
  return renderHook(() => useVariableValues(), { wrapper });
}

describe('FixedValueVariableProvider', () => {
  it('overrides the value of an existing variable and sets loading to false', () => {
    const { result } = renderWithProvider('env', 'prod', {
      env: { value: ['prod', 'dev'], loading: true },
    });

    expect(result.current['env']?.value).toBe('prod');
    expect(result.current['env']?.loading).toBe(false);
  });

  it('preserves other fields of an existing variable when overriding', () => {
    const options = [
      { label: 'prod', value: 'prod' },
      { label: 'dev', value: 'dev' },
    ];
    const { result } = renderWithProvider('env', 'prod', {
      env: { value: ['prod', 'dev'], loading: false, options, error: undefined },
    });

    expect(result.current['env']?.options).toEqual(options);
    expect(result.current['env']?.error).toBeUndefined();
  });

  it('does not throw and produces a valid entry when the variable is not in the outer context', () => {
    expect(() => {
      const { result } = renderWithProvider('missing', 'someValue', {});
      expect(result.current['missing']?.value).toBe('someValue');
      expect(result.current['missing']?.loading).toBe(false);
    }).not.toThrow();
  });

  it('passes through unrelated variables unchanged', () => {
    const { result } = renderWithProvider('env', 'prod', {
      env: { value: ['prod', 'dev'], loading: false },
      region: { value: 'us-east-1', loading: false },
    });

    expect(result.current['region']).toEqual({ value: 'us-east-1', loading: false });
  });
});
