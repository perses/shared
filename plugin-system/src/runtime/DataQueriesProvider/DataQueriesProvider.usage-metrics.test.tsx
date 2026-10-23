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

import { FetchProvider } from '@perses-dev/client';
import type { QueryDefinition } from '@perses-dev/spec';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { StrictMode, Suspense } from 'react';

import { UsageMetricsContext, UsageMetricsProvider } from '../UsageMetricsProvider';
import { DataQueriesProvider } from './DataQueriesProvider';

const mocks = vi.hoisted(() => ({
  timeSeriesResults: [] as unknown[],
  noResults: [] as unknown[],
}));

vi.mock('../time-series-queries', () => ({ useTimeSeriesQueries: (): unknown[] => mocks.timeSeriesResults }));
vi.mock('../trace-queries', () => ({ useTraceQueries: (): unknown[] => mocks.noResults }));
vi.mock('../profile-queries', () => ({ useProfileQueries: (): unknown[] => mocks.noResults }));
vi.mock('../log-queries', () => ({ useLogQueries: (): unknown[] => mocks.noResults }));
vi.mock('../alerts-queries', () => ({ useAlertsQueries: (): unknown[] => mocks.noResults }));
vi.mock('../silences-queries', () => ({ useSilencesQueries: (): unknown[] => mocks.noResults }));
vi.mock('../json-queries', () => ({ useJsonQueries: (): unknown[] => mocks.noResults }));

const cachedQuery: QueryDefinition = { kind: 'TimeSeriesQuery', spec: { plugin: { kind: 'Cached', spec: {} } } };
const slowQuery: QueryDefinition = { kind: 'TimeSeriesQuery', spec: { plugin: { kind: 'Slow', spec: {} } } };
const definitions = [cachedQuery, slowQuery];
const queryOptions = { enabled: true };

const done = { data: {}, isFetching: false, isLoading: false, error: null };
const loading = { data: undefined, isFetching: true, isLoading: true, error: null };

const markQuery = vi.fn();
const usageMetrics = { project: 'project', dashboard: 'dashboard', markQuery };
const neverResolves = new Promise<never>(() => undefined);
function Suspend(): ReactElement {
  throw neverResolves;
}

describe('DataQueriesProvider usage metrics', () => {
  afterEach(() => {
    mocks.timeSeriesResults = [];
    vi.restoreAllMocks();
  });

  it('waits for the whole batch when a cached query completes first', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    function Dashboard(): ReactElement {
      return (
        <StrictMode>
          <FetchProvider fetchFn={fetchFn}>
            <UsageMetricsProvider project="project" dashboard="dashboard">
              <DataQueriesProvider definitions={definitions} queryOptions={queryOptions} />
            </UsageMetricsProvider>
          </FetchProvider>
        </StrictMode>
      );
    }

    mocks.timeSeriesResults = [done, loading];
    const { rerender } = render(<Dashboard />);
    expect(fetchFn).not.toHaveBeenCalled();

    mocks.timeSeriesResults = [done, { ...done, data: undefined, error: new Error('boom') }];
    rerender(<Dashboard />);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/v1/view',
      expect.objectContaining({
        body: JSON.stringify({ project: 'project', dashboard: 'dashboard', render_time: 0, render_errors: 1 }),
      }),
    );
  });

  it('does not record queries from a render that is never committed', () => {
    markQuery.mockClear();
    mocks.timeSeriesResults = [done, loading];
    render(
      <UsageMetricsContext.Provider value={usageMetrics}>
        <Suspense fallback={null}>
          <DataQueriesProvider definitions={definitions} queryOptions={queryOptions}>
            <Suspend />
          </DataQueriesProvider>
        </Suspense>
      </UsageMetricsContext.Provider>,
    );

    expect(markQuery).not.toHaveBeenCalled();
  });
});
