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

import type { AbsoluteTimeRange, ProfileData } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import { PluginRegistry } from '../components/PluginRegistry';
import type { ProfileQueryPlugin } from '../model';
import { mockPluginRegistry } from '../test-utils';
import { BuiltinVariableContext } from './builtin-variables';
import type { ProfileQueryDefinition } from './profile-queries';
import { useProfileQueries } from './profile-queries';
import type { VariableStateMap } from './variables';
import { VariableContext } from './variables';

const runtime = vi.hoisted(() => ({
  variables: {} as VariableStateMap,
  timeRange: { start: new Date('2026-01-01'), end: new Date('2026-01-02') } as AbsoluteTimeRange,
}));
vi.mock('./TimeRangeProvider', () => ({
  useTimeRange: (): { absoluteTimeRange: AbsoluteTimeRange } => ({ absoluteTimeRange: runtime.timeRange }),
}));
vi.mock('./datasources', () => ({ useDatasourceStore: (): Record<string, never> => ({}) }));

const definition: ProfileQueryDefinition = {
  kind: 'ProfileQuery',
  spec: { plugin: { kind: 'TestProfile', spec: { query: 'test' } } },
};
const plainDefinition: ProfileQueryDefinition = {
  kind: 'ProfileQuery',
  spec: { plugin: { kind: 'PlainProfile', spec: {} } },
};
const data: ProfileData = {
  profile: { stackTrace: { id: 1, name: 'total', level: 0, start: 0, end: 1, total: 1, self: 1, children: [] } },
};
const getProfileData = vi.fn<ProfileQueryPlugin['getProfileData']>();
const dependsOn = vi.fn<NonNullable<ProfileQueryPlugin['dependsOn']>>();
const plugin: ProfileQueryPlugin = { createInitialOptions: () => ({}), getProfileData, dependsOn };
const plainPlugin: ProfileQueryPlugin = { createInitialOptions: () => ({}), getProfileData };
const registryProps = mockPluginRegistry(
  { kind: 'ProfileQuery', spec: { name: 'TestProfile' }, plugin },
  { kind: 'ProfileQuery', spec: { name: 'PlainProfile' }, plugin: plainPlugin },
);
let queryClient: QueryClient;

const builtinValue = {
  variables: [
    { kind: 'BuiltinVariable' as const, spec: { source: 'test', name: '__test', value: (): string => 'builtin' } },
  ],
};
function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const state = runtime.variables;
  const value = useMemo(() => ({ state }), [state]);
  return (
    <QueryClientProvider client={queryClient}>
      <PluginRegistry {...registryProps}>
        <VariableContext.Provider value={value}>
          <BuiltinVariableContext.Provider value={builtinValue}>{children}</BuiltinVariableContext.Provider>
        </VariableContext.Provider>
      </PluginRegistry>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  runtime.variables = {};
  runtime.timeRange = { start: new Date('2026-01-01'), end: new Date('2026-01-02') };
  getProfileData.mockReset().mockResolvedValue(data);
  dependsOn.mockReset().mockReturnValue({ variables: [] });
});
afterEach(() => queryClient.clear());

it('waits for dependent variables, then supplies their values and the time range to the plugin', async () => {
  dependsOn.mockReturnValue({ variables: ['service'] });
  runtime.variables = { service: { value: 'api', loading: true } };
  const { result, rerender } = renderHook(() => useProfileQueries([definition]), { wrapper: Wrapper });
  await waitFor(() => expect(dependsOn).toHaveBeenCalled());
  expect(getProfileData).not.toHaveBeenCalled();
  runtime.variables = { service: { value: 'api', loading: false } };
  rerender();
  await waitFor(() => expect(result.current[0]?.data).toEqual(data));
  expect(getProfileData).toHaveBeenCalledWith(
    definition.spec.plugin.spec,
    expect.objectContaining({
      variableState: { ...runtime.variables, __test: { value: 'builtin', loading: false } },
      absoluteTimeRange: runtime.timeRange,
    }),
    expect.any(AbortSignal),
  );
});

it('refetches changed dependencies and ranges but ignores unrelated variables', async () => {
  dependsOn.mockReturnValue({ variables: ['service', 'source'] });
  runtime.variables = {
    service: { value: 'api', loading: false },
    source: { value: 'one', loading: false },
    unrelated: { value: 'a', loading: false },
  };
  const { result, rerender } = renderHook(() => useProfileQueries([definition]), { wrapper: Wrapper });
  await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true));
  runtime.variables = { ...runtime.variables, unrelated: { value: 'b', loading: false } };
  rerender();
  expect(getProfileData).toHaveBeenCalledTimes(1);
  runtime.variables = { ...runtime.variables, service: { value: 'worker', loading: false } };
  rerender();
  await waitFor(() => expect(getProfileData).toHaveBeenCalledTimes(2));
  runtime.variables = { ...runtime.variables, source: { value: 'two', loading: false } };
  rerender();
  await waitFor(() => expect(getProfileData).toHaveBeenCalledTimes(3));
  runtime.timeRange = { ...runtime.timeRange, end: new Date('2026-01-03') };
  rerender();
  await waitFor(() => expect(getProfileData).toHaveBeenCalledTimes(4));
});

it('does not wait for variables without a dependency hook and supports dashboard refresh', async () => {
  runtime.variables = { service: { value: 'api', loading: true } };
  const { result } = renderHook(() => useProfileQueries([plainDefinition]), { wrapper: Wrapper });
  await waitFor(() => expect(result.current[0]?.data).toEqual(data));
  await act(async () => {
    await queryClient.invalidateQueries({ queryKey: ['query', 'ProfileQuery'] });
  });
  expect(getProfileData).toHaveBeenCalledTimes(2);
});

it('aborts in-flight work when the profile consumer unmounts', async () => {
  getProfileData.mockImplementation(() => new Promise(() => {}));
  const { unmount } = renderHook(() => useProfileQueries([definition]), { wrapper: Wrapper });
  await waitFor(() => expect(getProfileData).toHaveBeenCalledTimes(1));
  const signal = getProfileData.mock.calls[0]?.[2];
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
});

it('surfaces query failures', async () => {
  const error = new Error('Profile query failed');
  getProfileData.mockRejectedValue(error);
  const { result } = renderHook(() => useProfileQueries([definition]), { wrapper: Wrapper });
  await waitFor(() => expect(result.current[0]?.error).toBe(error));
});

it('surfaces plugin loading failures instead of leaving the query disabled', async () => {
  const missing: ProfileQueryDefinition = { kind: 'ProfileQuery', spec: { plugin: { kind: 'Missing', spec: {} } } };
  const { result } = renderHook(() => useProfileQueries([missing]), { wrapper: Wrapper });
  await waitFor(() => expect(result.current[0]?.isError).toBe(true));
  expect(getProfileData).not.toHaveBeenCalled();
});
