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

import type { AbsoluteTimeRange, DurationString } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { PluginRegistry } from '../components/PluginRegistry';
import type { LogQueryPlugin, LogQueryResult } from '../model';
import { mockPluginRegistry } from '../test-utils';
import type { LogQueryDefinition } from './log-queries';
import { useLogQueries } from './log-queries';
import { TimeRangeProvider, useTimeRange } from './TimeRangeProvider';

vi.mock('./datasources', () => ({ useDatasourceStore: (): Record<string, never> => ({}) }));
vi.mock('./variables', () => ({ useAllVariableValues: (): Record<string, never> => ({}) }));

const absoluteTimeRange: AbsoluteTimeRange = {
  start: new Date('2026-01-01'),
  end: new Date('2026-01-02'),
};
const definition: LogQueryDefinition = { kind: 'LogQuery', spec: { plugin: { kind: 'TestLog', spec: {} } } };
const data: LogQueryResult = { logs: { entries: [] }, timeRange: absoluteTimeRange };
const getLogData = vi.fn<LogQueryPlugin['getLogData']>();
const plugin: LogQueryPlugin = { createInitialOptions: () => ({}), getLogData };
const registryProps = mockPluginRegistry({ kind: 'LogQuery', spec: { name: 'TestLog' }, plugin });
const setTimeRange = vi.fn();
const setRefreshInterval = vi.fn();
let queryClient: QueryClient;
let refreshInterval: DurationString | undefined;

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <PluginRegistry {...registryProps}>
        <TimeRangeProvider
          timeRange={absoluteTimeRange}
          refreshInterval={refreshInterval}
          setTimeRange={setTimeRange}
          setRefreshInterval={setRefreshInterval}
        >
          {children}
        </TimeRangeProvider>
      </PluginRegistry>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  refreshInterval = undefined;
  getLogData.mockReset().mockResolvedValue(data);
});
afterEach(() => {
  queryClient.clear();
  vi.useRealTimers();
});

function expectLogExecutions(count: number): void {
  expect(getLogData).toHaveBeenCalledTimes(count);
  for (const [, context] of getLogData.mock.calls) {
    expect(context.absoluteTimeRange).toEqual(absoluteTimeRange);
    expect(context).not.toHaveProperty('timeRange');
    expect(context).not.toHaveProperty('refreshKey');
  }
}

it('supports fixed-range manual refresh and direct refetch without changing the cache key', async () => {
  const { result, rerender, unmount } = renderHook(
    () => ({ query: useLogQueries([definition])[0], refresh: useTimeRange().refresh }),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(result.current.query?.isSuccess).toBe(true));
  rerender();
  expectLogExecutions(1);

  act(() => result.current.refresh());
  await waitFor(() => expect(getLogData).toHaveBeenCalledTimes(2));
  await act(async () => {
    await result.current.query?.refetch();
  });
  expectLogExecutions(3);
  expect(queryClient.getQueryCache().findAll({ queryKey: ['query', 'LogQuery'] })).toHaveLength(1);

  unmount();
  const cached = renderHook(() => useLogQueries([definition])[0], { wrapper: Wrapper });
  await waitFor(() => expect(cached.result.current?.data).toEqual(data));
  expectLogExecutions(3);
});

it('supports scheduled refresh even when the absolute range is unchanged', async () => {
  const { result, rerender, unmount } = renderHook(() => useLogQueries([definition])[0], { wrapper: Wrapper });
  await waitFor(() => expect(result.current?.isSuccess).toBe(true));
  vi.useFakeTimers();
  refreshInterval = '1s';
  rerender();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expectLogExecutions(2);
  unmount();
});

it('retries failed requests', async () => {
  queryClient.setQueryDefaults(['query', 'LogQuery'], { retry: 1, retryDelay: 0 });
  getLogData.mockRejectedValueOnce(new Error('Temporary failure'));
  const { result } = renderHook(() => useLogQueries([definition])[0], { wrapper: Wrapper });
  await waitFor(() => expect(result.current?.isSuccess).toBe(true));
  expectLogExecutions(2);
});
