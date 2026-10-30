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

import type { QueryDefinition } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import type * as PluginRegistryModule from '../plugin-registry';
import { DataQueriesProvider } from './DataQueriesProvider';

const mocks = vi.hoisted(() => ({
  getPlugin: vi.fn(),
  absoluteTimeRange: { start: new Date(0), end: new Date(3_600_000) },
}));

vi.mock('../plugin-registry', async () => {
  const actual = await vi.importActual<typeof PluginRegistryModule>('../plugin-registry');
  return {
    ...actual,
    usePluginRegistry: (): unknown => ({ getPlugin: mocks.getPlugin }),
    usePlugins: (_kind: string, plugins: unknown[]): unknown[] => plugins.map(() => ({ data: {} })),
  };
});
vi.mock('../datasources', () => ({ useDatasourceStore: (): unknown => ({}) }));
vi.mock('../variables', () => ({ useAllVariableValues: (): unknown => ({}), useVariableValues: (): unknown => ({}) }));
vi.mock('../TimeRangeProvider', () => ({
  useTimeRange: (): unknown => ({ absoluteTimeRange: mocks.absoluteTimeRange }),
}));

const QUERY_KINDS = [
  'TimeSeriesQuery',
  'TraceQuery',
  'ProfileQuery',
  'LogQuery',
  'AlertsQuery',
  'SilencesQuery',
  'JsonQuery',
] as const;
const definitions: QueryDefinition[] = QUERY_KINDS.map((kind) => ({
  kind,
  spec: { plugin: { kind: `Test${kind}`, spec: {} } },
}));

const resolveData = (): Promise<object> => Promise.resolve({});
const queryPlugin = {
  getTimeSeriesData: resolveData,
  getTraceData: resolveData,
  getProfileData: resolveData,
  getLogData: resolveData,
  getAlertsData: resolveData,
  getSilencesData: resolveData,
  getJsonData: resolveData,
};

function fetchedKinds(): string[] {
  return mocks.getPlugin.mock.calls.map(([{ kind }]) => kind as string).toSorted();
}

describe('DataQueriesProvider queryOptions.enabled', () => {
  let queryClient: QueryClient;

  function renderProvider(enabled?: boolean): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <DataQueriesProvider definitions={definitions} queryOptions={enabled === undefined ? undefined : { enabled }} />
      </QueryClientProvider>
    );
  }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mocks.getPlugin.mockReset();
    mocks.getPlugin.mockResolvedValue(queryPlugin);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('runs the queries of every kind by default', async () => {
    render(renderProvider());

    await waitFor(() => expect(fetchedKinds()).toEqual(QUERY_KINDS.toSorted()));
  });

  it('does not run the queries of any kind until enabled', async () => {
    const { rerender } = render(renderProvider(false));
    await act(() => Promise.resolve());
    expect(mocks.getPlugin).not.toHaveBeenCalled();

    rerender(renderProvider(true));

    await waitFor(() => expect(fetchedKinds()).toEqual(QUERY_KINDS.toSorted()));
  });
});
