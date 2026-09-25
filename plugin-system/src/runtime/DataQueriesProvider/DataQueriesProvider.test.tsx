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

import type { QueryDefinition, QueryType } from '@perses-dev/spec';
import { renderHook } from '@testing-library/react';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import {
  MOCK_TIME_SERIES_DATA,
  MOCK_TRACE_DATA,
  MOCK_PROFILE_DATA,
  MOCK_LOG_DATA,
  MOCK_ALERTS_DATA,
  MOCK_SILENCES_DATA,
  MOCK_JSON_DATA,
} from '../../test';
import { DataQueriesContext, DataQueriesProvider, useDataQueries } from './DataQueriesProvider';
import type { DataQueriesContextType } from './model';

vi.mock('../time-series-queries', () => ({
  useTimeSeriesQueries: vi.fn().mockImplementation(() => [{ data: MOCK_TIME_SERIES_DATA }]),
}));

vi.mock('../trace-queries', () => ({
  useTraceQueries: vi.fn().mockImplementation(() => [{ data: MOCK_TRACE_DATA }]),
}));

vi.mock('../profile-queries', () => ({
  useProfileQueries: vi.fn().mockImplementation(() => [{ data: MOCK_PROFILE_DATA }]),
}));

vi.mock('../log-queries', () => ({
  useLogQueries: vi.fn().mockImplementation(() => [{ data: MOCK_LOG_DATA }]),
}));

vi.mock('../alerts-queries', () => ({
  useAlertsQueries: vi.fn().mockImplementation(() => [{ data: MOCK_ALERTS_DATA }]),
}));

vi.mock('../silences-queries', () => ({
  useSilencesQueries: vi.fn().mockImplementation(() => [{ data: MOCK_SILENCES_DATA }]),
}));

vi.mock('../json-queries', () => ({
  useJsonQueries: vi.fn().mockImplementation(() => [{ data: MOCK_JSON_DATA }]),
}));

vi.mock('../plugin-registry', () => ({
  useListPluginMetadata: vi.fn().mockImplementation(() => ({
    data: [
      {
        spec: {
          display: {
            name: 'Prometheus Query',
          },
          name: 'PrometheusTimeSeriesQuery',
        },
        kind: 'TimeSeriesQuery',
      },
      {
        spec: {
          display: {
            name: 'Tempo Query',
          },
          name: 'TempoTraceQuery',
        },
        kind: 'TraceQuery',
      },
      {
        spec: {
          display: {
            name: 'Alertmanager Alerts Query',
          },
          name: 'AlertmanagerAlertsQuery',
        },
        kind: 'AlertsQuery',
      },
      {
        spec: {
          display: {
            name: 'Alertmanager Silences Query',
          },
          name: 'AlertmanagerSilencesQuery',
        },
        kind: 'SilencesQuery',
      },
    ],
    isLoading: false,
  })),
}));

function createQueryContext(): DataQueriesContextType {
  const timeSeriesDefinition: QueryDefinition = {
    kind: 'TimeSeriesQuery',
    spec: { plugin: { kind: 'PrometheusTimeSeriesQuery', spec: {} } },
  };
  const traceDefinition: QueryDefinition = {
    kind: 'TraceQuery',
    spec: { plugin: { kind: 'TempoTraceQuery', spec: {} } },
  };
  const traceError = new Error('Trace failed');
  return {
    queryDefinitions: [timeSeriesDefinition, traceDefinition],
    queryResults: [
      {
        definition: timeSeriesDefinition,
        data: MOCK_TIME_SERIES_DATA,
        isFetching: false,
        isLoading: false,
        error: new Error('Time series failed'),
      },
      {
        definition: traceDefinition,
        data: MOCK_TRACE_DATA,
        isFetching: true,
        isLoading: false,
        error: traceError,
      },
    ],
    errors: [new Error('Time series failed'), traceError],
    isFetching: true,
    isLoading: false,
    refetchAll: vi.fn(),
  };
}

describe('useDataQueries', (): void => {
  it('reuses chart transformations on local rerenders and updates them when query type or data changes', () => {
    let context = createQueryContext();
    const traceDefinition = context.queryDefinitions[1];
    const traceError = context.errors[1];
    const wrapper = ({ children }: React.PropsWithChildren): ReactElement => (
      <DataQueriesContext.Provider value={context}>{children}</DataQueriesContext.Provider>
    );
    const transform = vi.fn((queries: DataQueriesContextType['queryResults']) => queries.map((query) => query.data));
    const { result, rerender } = renderHook(
      ({ queryType }: { queryType: keyof QueryType }) => {
        const queries = useDataQueries(queryType);
        const data = useMemo(() => transform(queries.queryResults), [queries.queryResults]);
        return { queries, data };
      },
      { wrapper, initialProps: { queryType: 'TimeSeriesQuery' as keyof QueryType } },
    );
    const initial = result.current.queries;
    rerender({ queryType: 'TimeSeriesQuery' });
    expect(result.current.queries).toBe(initial);
    expect(transform).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([MOCK_TIME_SERIES_DATA]);
    expect(result.current.queries.isFetching).toBe(false);

    rerender({ queryType: 'TraceQuery' });
    expect(transform).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([MOCK_TRACE_DATA]);
    expect(result.current.queries.queryDefinitions).toEqual([traceDefinition]);
    expect(result.current.queries.queryResults[0]?.data).toBe(MOCK_TRACE_DATA);
    expect(result.current.queries.errors).toEqual([traceError]);
    expect(result.current.queries.isFetching).toBe(true);

    context = {
      ...context,
      queryResults: context.queryResults.map((query) => ({ ...query, isFetching: false })),
      isFetching: false,
    };
    rerender({ queryType: 'TraceQuery' });
    expect(transform).toHaveBeenCalledTimes(3);
    expect(result.current.queries.isFetching).toBe(false);
    result.current.queries.refetchAll();
    expect(context.refetchAll).toHaveBeenCalledOnce();
  });

  it('should return the correct data for TimeSeriesQuery', () => {
    const definitions: QueryDefinition[] = [
      {
        kind: 'TimeSeriesQuery',
        spec: {
          plugin: {
            kind: 'PrometheusTimeSeriesQuery',
            spec: {
              query: 'up',
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: React.PropsWithChildren): ReactElement => {
      return <DataQueriesProvider definitions={definitions}>{children}</DataQueriesProvider>;
    };

    const { result } = renderHook(() => useDataQueries('TimeSeriesQuery'), {
      wrapper,
    });
    expect(result.current.queryResults[0]?.data).toEqual(MOCK_TIME_SERIES_DATA);
  });

  it('should return the correct data for TraceQuery', () => {
    const definitions: QueryDefinition[] = [
      {
        kind: 'TraceQuery',
        spec: {
          plugin: {
            kind: 'TempoTraceQuery',
            spec: {
              query: '{ duration > 1000ms }',
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: React.PropsWithChildren): ReactElement => {
      return <DataQueriesProvider definitions={definitions}>{children}</DataQueriesProvider>;
    };

    const { result: traceResult } = renderHook(() => useDataQueries('TraceQuery'), {
      wrapper,
    });
    expect(traceResult.current.queryResults[0]?.data).toEqual(MOCK_TRACE_DATA);
  });

  it('should return the correct data for AlertsQuery', () => {
    const definitions: QueryDefinition[] = [
      {
        kind: 'AlertsQuery',
        spec: {
          plugin: {
            kind: 'AlertmanagerAlertsQuery',
            spec: {},
          },
        },
      },
    ];

    const wrapper = ({ children }: React.PropsWithChildren): ReactElement => {
      return <DataQueriesProvider definitions={definitions}>{children}</DataQueriesProvider>;
    };

    const { result } = renderHook(() => useDataQueries('AlertsQuery'), {
      wrapper,
    });
    expect(result.current.queryResults[0]?.data).toEqual(MOCK_ALERTS_DATA);
  });

  it('should return the correct data for SilencesQuery', () => {
    const definitions: QueryDefinition[] = [
      {
        kind: 'SilencesQuery',
        spec: {
          plugin: {
            kind: 'AlertmanagerSilencesQuery',
            spec: {},
          },
        },
      },
    ];

    const wrapper = ({ children }: React.PropsWithChildren): ReactElement => {
      return <DataQueriesProvider definitions={definitions}>{children}</DataQueriesProvider>;
    };

    const { result } = renderHook(() => useDataQueries('SilencesQuery'), {
      wrapper,
    });
    expect(result.current.queryResults[0]?.data).toEqual(MOCK_SILENCES_DATA);
  });

  it('should return the correct data for JsonQuery', () => {
    const definitions: QueryDefinition[] = [
      {
        kind: 'JsonQuery',
        spec: {
          plugin: {
            kind: 'SomeJsonQuery',
            spec: {},
          },
        },
      },
    ];

    const wrapper = ({ children }: React.PropsWithChildren): ReactElement => {
      return <DataQueriesProvider definitions={definitions}>{children}</DataQueriesProvider>;
    };

    const { result } = renderHook(() => useDataQueries('JsonQuery'), {
      wrapper,
    });
    expect(result.current.queryResults[0]?.data).toEqual(MOCK_JSON_DATA);
  });
});
