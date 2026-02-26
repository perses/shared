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

import React, { ReactElement } from 'react';
import { renderHook } from '@testing-library/react';
import { MOCK_TIME_SERIES_DATA, MOCK_TRACE_DATA, MOCK_PROFILE_DATA, MOCK_LOG_DATA } from '../../test';
import { DataQueriesProvider, useDataQueries } from './DataQueriesProvider';

jest.mock('../time-series-queries', () => ({
  useTimeSeriesQueries: jest.fn().mockImplementation(() => [{ data: MOCK_TIME_SERIES_DATA }]),
}));

jest.mock('../trace-queries', () => ({
  useTraceQueries: jest.fn().mockImplementation(() => [{ data: MOCK_TRACE_DATA }]),
}));

jest.mock('../profile-queries', () => ({
  useProfileQueries: jest.fn().mockImplementation(() => [{ data: MOCK_PROFILE_DATA }]),
}));

jest.mock('../log-queries', () => ({
  useLogQueries: jest.fn().mockImplementation(() => [{ data: MOCK_LOG_DATA }]),
}));

jest.mock('../plugin-registry', () => ({
  useListPluginMetadata: jest.fn().mockImplementation(() => ({
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
    ],
    isLoading: false,
  })),
}));

describe('useDataQueries', (): void => {
  it('should return the correct data for TimeSeriesQuery', () => {
    const definitions = [
      {
        kind: 'TimeSeriesQuery',
        spec: {
          kind: 'PrometheusTimeSeriesQuery',
          spec: {
            query: 'up',
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
    const definitions = [
      {
        kind: 'TraceQuery',
        spec: {
          kind: 'TempoTraceQuery',
          spec: {
            query: '{ duration > 1000ms }',
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
});
