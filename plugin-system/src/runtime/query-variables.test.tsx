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

import type { AbsoluteTimeRange, ListVariableDefinition } from '@perses-dev/spec';
import type { UseQueryResult } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import { PluginRegistry } from '../components/PluginRegistry';
import { useListVariablePluginValues } from '../components/Variables/variable-model';
import { mockPluginRegistry } from '../test-utils';
import { useAlertsQueries } from './alerts-queries';
import { useAnnotationData, useAnnotations } from './annotations';
import { BuiltinVariableContext } from './builtin-variables';
import { useJsonQueries } from './json-queries';
import { useLogQueries } from './log-queries';
import { useProfileQueries } from './profile-queries';
import { useSilencesQueries } from './silences-queries';
import { useTimeSeriesQuery, useTimeSeriesQueries } from './time-series-queries';
import { useTraceQueries } from './trace-queries';
import type { VariableStateMap } from './variables';
import { VariableContext } from './variables';

const runtime = vi.hoisted(() => ({
  variables: {} as VariableStateMap,
  builtin: 'builtin',
  timeRange: { start: new Date('2026-01-01'), end: new Date('2026-01-02') } as AbsoluteTimeRange,
}));
vi.mock('./TimeRangeProvider', () => ({
  useTimeRange: (): { absoluteTimeRange: AbsoluteTimeRange } => ({ absoluteTimeRange: runtime.timeRange }),
}));
vi.mock('./datasources', () => ({ useDatasourceStore: (): Record<string, never> => ({}) }));

const fetchData = vi.fn();
const dependsOn = vi.fn<(spec: unknown, context: unknown) => { variables?: string[] }>();
const plugin = {
  createInitialOptions: (): Record<string, never> => ({}),
  dependsOn,
  getTimeSeriesData: fetchData,
  getLogData: fetchData,
  getTraceData: fetchData,
  getProfileData: fetchData,
  getJsonData: fetchData,
  getAlertsData: fetchData,
  getSilencesData: fetchData,
  getAnnotationData: fetchData,
  getVariableOptions: fetchData,
};
const kinds = [
  'TimeSeriesQuery',
  'LogQuery',
  'TraceQuery',
  'ProfileQuery',
  'JsonQuery',
  'AlertsQuery',
  'SilencesQuery',
  'Annotation',
  'Variable',
] as const;
const registryProps = mockPluginRegistry(...kinds.map((kind) => ({ kind, spec: { name: 'TestQuery' }, plugin })));
const spec = { plugin: { kind: 'TestQuery', spec: {} } };
const annotationSpec = { ...spec, display: { name: 'Events' } };
const variableDefinition: ListVariableDefinition = {
  kind: 'ListVariable',
  spec: { ...spec, name: 'child', allowAllValue: false, allowMultiple: false },
};
type QueryCase = { name: string; useQuery: (querySpec?: typeof spec) => UseQueryResult<unknown> | undefined };
const queryCases: QueryCase[] = [
  {
    name: 'time series',
    useQuery: (querySpec = spec) => useTimeSeriesQueries([{ kind: 'TimeSeriesQuery', spec: querySpec }])[0],
  },
  {
    name: 'single time series',
    useQuery: (querySpec = spec) => useTimeSeriesQuery({ kind: 'TimeSeriesQuery', spec: querySpec }),
  },
  { name: 'logs', useQuery: (querySpec = spec) => useLogQueries([{ kind: 'LogQuery', spec: querySpec }])[0] },
  { name: 'traces', useQuery: (querySpec = spec) => useTraceQueries([{ kind: 'TraceQuery', spec: querySpec }])[0] },
  {
    name: 'profiles',
    useQuery: (querySpec = spec) => useProfileQueries([{ kind: 'ProfileQuery', spec: querySpec }])[0],
  },
  { name: 'JSON', useQuery: (querySpec = spec) => useJsonQueries([{ kind: 'JsonQuery', spec: querySpec }])[0] },
  { name: 'alerts', useQuery: (querySpec = spec) => useAlertsQueries([{ kind: 'AlertsQuery', spec: querySpec }])[0] },
  {
    name: 'silences',
    useQuery: (querySpec = spec) => useSilencesQueries([{ kind: 'SilencesQuery', spec: querySpec }])[0],
  },
  { name: 'annotations', useQuery: (querySpec = spec) => useAnnotations([{ ...annotationSpec, ...querySpec }])[0] },
  {
    name: 'annotation preview',
    useQuery: (querySpec = spec) => useAnnotationData({ ...annotationSpec, ...querySpec }),
  },
  { name: 'variable options', useQuery: () => useListVariablePluginValues(variableDefinition) },
];
let queryClient: QueryClient;
function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const builtin = runtime.builtin;
  const builtinValue = useMemo(
    () => ({
      variables: [
        { kind: 'BuiltinVariable' as const, spec: { name: '__test', source: 'test', value: (): string => builtin } },
      ],
    }),
    [builtin],
  );
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
  runtime.builtin = 'builtin';
  runtime.variables = {
    service: { value: 'api', loading: false },
    source: { value: 'one', loading: false },
    unrelated: { value: 'unused', loading: false },
  };
  fetchData.mockReset().mockResolvedValue({ data: [] });
  dependsOn.mockReset().mockReturnValue({ variables: ['service', 'source', '__test'] });
});
afterEach(() => queryClient.clear());

describe.each(queryCases)('$name variable support', ({ useQuery, name }) => {
  it('waits for query and datasource variables and passes built-ins to the plugin', async () => {
    runtime.variables.service = { value: 'api', loading: true };
    runtime.variables.source = { value: 'one', loading: true };
    const { result, rerender } = renderHook(useQuery, { wrapper: Wrapper });
    await waitFor(() => expect(dependsOn).toHaveBeenCalled());
    expect(fetchData).not.toHaveBeenCalled();
    runtime.variables = { ...runtime.variables, service: { value: 'api', loading: false } };
    rerender();
    expect(fetchData).not.toHaveBeenCalled();
    runtime.variables = { ...runtime.variables, source: { value: 'one', loading: false } };
    rerender();
    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    expect(fetchData).toHaveBeenCalledWith(
      spec.plugin.spec,
      expect.objectContaining({
        [name === 'variable options' ? 'variables' : 'variableState']: expect.objectContaining({
          service: { value: 'api', loading: false },
          source: { value: 'one', loading: false },
          __test: { value: 'builtin', loading: false },
        }),
      }),
      expect.any(AbortSignal),
    );
  });

  it('refetches changed query and datasource variables but ignores unrelated changes', async () => {
    const { result, rerender } = renderHook(useQuery, { wrapper: Wrapper });
    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    runtime.variables = { ...runtime.variables, unrelated: { value: 'changed', loading: true } };
    rerender();
    expect(fetchData).toHaveBeenCalledTimes(1);
    runtime.variables = { ...runtime.variables, service: { value: 'worker', loading: false } };
    rerender();
    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(2));
    runtime.variables = { ...runtime.variables, source: { value: 'two', loading: false } };
    rerender();
    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(3));
  });

  it('refetches when a built-in variable changes', async () => {
    const { result, rerender } = renderHook(useQuery, { wrapper: Wrapper });
    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    runtime.builtin = 'updated';
    rerender();
    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(2));
  });

  it('executes variable-free queries while unrelated variables load', async () => {
    dependsOn.mockReturnValue({ variables: [] });
    runtime.variables.service = { value: 'api', loading: true };
    const { result } = renderHook(useQuery, { wrapper: Wrapper });
    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    expect(fetchData).toHaveBeenCalledTimes(1);
  });
});

describe.each(queryCases.filter(({ name }) => name !== 'variable options'))(
  '$name with unspecified dependencies',
  ({ useQuery }) => {
    it('does not wait for loading variables but reruns when their values change', async () => {
      dependsOn.mockReturnValue({});
      runtime.variables.service = { value: 'api', loading: true };
      const { result, rerender } = renderHook(useQuery, { wrapper: Wrapper });
      await waitFor(() => expect(result.current?.isSuccess).toBe(true));
      expect(fetchData).toHaveBeenCalledTimes(1);
      runtime.variables = { ...runtime.variables, service: { value: 'worker', loading: false } };
      rerender();
      await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(2));
    });
  },
);

it('honors explicit disabling of a single time series query after its plugin and variables load', async () => {
  renderHook(() => useTimeSeriesQuery({ kind: 'TimeSeriesQuery', spec }, undefined, { enabled: false }), {
    wrapper: Wrapper,
  });
  await waitFor(() => expect(dependsOn).toHaveBeenCalled());
  expect(fetchData).not.toHaveBeenCalled();
});

describe.each(
  queryCases.filter(({ name }) => ['time series', 'single time series', 'logs', 'variable options'].includes(name)),
)('$name absolute time range context', ({ useQuery }) => {
  it('supplies the resolved range under absoluteTimeRange to dependency discovery and execution', async () => {
    const { result } = renderHook(() => useQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    for (const calls of [dependsOn.mock.calls, fetchData.mock.calls]) {
      for (const call of calls) {
        expect(call[1]).toHaveProperty('absoluteTimeRange', runtime.timeRange);
        expect(call[1]).not.toHaveProperty('timeRange');
      }
    }
  });
});

describe.each(queryCases.filter(({ name }) => name !== 'variable options'))(
  '$name query lifecycle',
  ({ useQuery, name }) => {
    it('surfaces plugin loading errors once variables are ready', async () => {
      const missingSpec = { plugin: { kind: 'Missing', spec: {} } };
      const { result } = renderHook(() => useQuery(missingSpec), { wrapper: Wrapper });
      await waitFor(() => expect(result.current?.isError).toBe(true));
      expect(result.current?.error).toBeInstanceOf(Error);
      expect(fetchData).not.toHaveBeenCalled();
    });

    it.each([{ version: '2.0.0' }, { registry: 'missing-registry' }])(
      'does not fall back to an unpinned plugin for %j',
      async (metadata) => {
        const pinnedSpec = { plugin: { ...spec.plugin, metadata } };
        const { result } = renderHook(() => useQuery(pinnedSpec), { wrapper: Wrapper });
        await waitFor(() => expect(result.current?.isError).toBe(true));
        expect(fetchData).not.toHaveBeenCalled();
      },
    );

    it('surfaces query failures', async () => {
      const error = new Error('Query failed');
      fetchData.mockRejectedValue(error);
      const { result } = renderHook(() => useQuery(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current?.error).toBe(error));
    });

    it('cancels in-flight work on unmount', async () => {
      fetchData.mockImplementation(() => new Promise(() => {}));
      const { unmount } = renderHook(() => useQuery(), { wrapper: Wrapper });
      await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1));
      const signal = fetchData.mock.calls[0]?.[2] as AbortSignal;
      expect(signal.aborted).toBe(false);
      unmount();
      expect(signal.aborted).toBe(true);
    });

    it('refetches through the dashboard refresh prefix', async () => {
      const { result } = renderHook(() => useQuery(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current?.isSuccess).toBe(true));
      const prefix = name.startsWith('annotation') ? 'annotation' : 'query';
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: [prefix] });
      });
      expect(fetchData).toHaveBeenCalledTimes(2);
    });
  },
);

describe.each(queryCases)('$name structural sharing', ({ useQuery }) => {
  it('keeps new result references when a refetch returns equal content', async () => {
    fetchData.mockImplementation(async () => ({ data: [{ label: 'api', value: 'api' }] }));
    const { result } = renderHook(() => useQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    const firstData = result.current?.data;

    await act(async () => {
      await result.current?.refetch();
    });

    expect(fetchData).toHaveBeenCalledTimes(2);
    expect(result.current?.data).toEqual(firstData);
    await waitFor(() => expect(result.current?.data).not.toBe(firstData));
  });
});

it.each([true, false, undefined])(
  'supports bulk time series structuralSharing=%s with a false default',
  async (structuralSharing) => {
    fetchData.mockImplementation(async () => ({ series: [{ name: 'up', values: [[1, 1]] }] }));
    const { result } = renderHook(
      () => useTimeSeriesQueries([{ kind: 'TimeSeriesQuery', spec }], undefined, { structuralSharing })[0],
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current?.isSuccess).toBe(true));
    const firstData = result.current?.data;

    await act(async () => {
      const refreshed = await result.current?.refetch();
      if (structuralSharing) {
        expect(refreshed?.data).toBe(firstData);
      }
    });

    expect(fetchData).toHaveBeenCalledTimes(2);
    expect(result.current?.data).toEqual(firstData);
    if (structuralSharing) {
      expect(result.current?.data).toBe(firstData);
    } else {
      await waitFor(() => expect(result.current?.data).not.toBe(firstData));
    }
  },
);
