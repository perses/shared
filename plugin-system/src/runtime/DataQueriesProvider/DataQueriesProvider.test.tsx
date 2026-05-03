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
import {
  MOCK_TIME_SERIES_DATA,
  MOCK_TRACE_DATA,
  MOCK_PROFILE_DATA,
  MOCK_LOG_DATA,
  MOCK_ALERTS_DATA,
  MOCK_SILENCES_DATA,
} from '../../test';
import { useListPluginMetadata } from '../plugin-registry';
import { DataQueriesProvider, useDataQueries } from './DataQueriesProvider';
import { useQueryType } from './model';

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

jest.mock('../alerts-queries', () => ({
  useAlertsQueries: jest.fn().mockImplementation(() => [{ data: MOCK_ALERTS_DATA }]),
}));

jest.mock('../silences-queries', () => ({
  useSilencesQueries: jest.fn().mockImplementation(() => [{ data: MOCK_SILENCES_DATA }]),
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

describe('useDataQueries', (): void => {
  it('should return the correct data for TimeSeriesQuery', () => {
    const definitions = [
      {
        kind: 'PrometheusTimeSeriesQuery',
        spec: {
          query: 'up',
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
        kind: 'TempoTraceQuery',
        spec: {
          query: '{ duration > 1000ms }',
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
    const definitions = [
      {
        kind: 'AlertmanagerAlertsQuery',
        spec: {},
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
    const definitions = [
      {
        kind: 'AlertmanagerSilencesQuery',
        spec: {},
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
});

describe('useQueryType', () => {
  it('should return the correct query type for a given plugin kind', () => {
    const { result } = renderHook(() => useQueryType());

    const getQueryType = result.current;
    expect(getQueryType('PrometheusTimeSeriesQuery')).toBe('TimeSeriesQuery');
    expect(getQueryType('TempoTraceQuery')).toBe('TraceQuery');
    expect(getQueryType('AlertmanagerAlertsQuery')).toBe('AlertsQuery');
    expect(getQueryType('AlertmanagerSilencesQuery')).toBe('SilencesQuery');
  });

  it('should throw an error if query type is not found ', () => {
    const { result } = renderHook(() => useQueryType());

    const getQueryType = result.current;
    expect(() => getQueryType('UnknownQuery')).toThrow(`Unable to determine the query type: UnknownQuery`);
  });

  it('should return undefined if useListPluginMetadata is still loading', () => {
    (useListPluginMetadata as jest.Mock).mockReturnValue({ isLoading: true });
    const { result } = renderHook(() => useQueryType());

    const getQueryType = result.current;
    expect(getQueryType('PrometheusTimeSeriesQuery')).toBeUndefined();
    expect(getQueryType('TempoTraceQuery')).toBeUndefined();
    expect(getQueryType('UnknownQuery')).toBeUndefined();
  });
});
