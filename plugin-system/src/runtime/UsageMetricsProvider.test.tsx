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
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { StrictMode, useMemo } from 'react';

import { UsageMetricsContext, UsageMetricsProvider, useUsageMetrics } from './UsageMetricsProvider';

const query: QueryDefinition = { kind: 'TimeSeriesQuery', spec: { plugin: { kind: 'TestQuery', spec: {} } } };
const secondQuery: QueryDefinition = { ...query, spec: { plugin: { kind: 'OtherQuery', spec: {} } } };

describe('UsageMetricsProvider', () => {
  it('keeps pending queries across rerenders and submits only once, including zero-duration renders', () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    function Wrapper({ children }: PropsWithChildren): ReactElement {
      return (
        <StrictMode>
          <FetchProvider fetchFn={fetchFn}>
            <UsageMetricsProvider project="project" dashboard="dashboard" apiPrefix="/prefix">
              {children}
            </UsageMetricsProvider>
          </FetchProvider>
        </StrictMode>
      );
    }
    try {
      const { result, rerender } = renderHook(() => useUsageMetrics(), { wrapper: Wrapper });
      expect(fetchFn).not.toHaveBeenCalled();
      act(() => {
        result.current.markQuery(query, 'pending');
        result.current.markQuery(secondQuery, 'pending');
        result.current.markQuery(query, 'success');
      });
      rerender();
      expect(fetchFn).not.toHaveBeenCalled();
      act(() => result.current.markQuery(secondQuery, 'error'));
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledWith(
        '/prefix/api/v1/view',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ project: 'project', dashboard: 'dashboard', render_time: 0, render_errors: 1 }),
        }),
      );
      act(() => {
        result.current.markQuery(secondQuery, 'pending');
        result.current.markQuery(secondQuery, 'success');
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('supports directly supplied context values', () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    const stats = {
      project: 'project',
      dashboard: 'dashboard',
      startRenderTime: 0,
      renderDurationMs: 0,
      renderErrorCount: 0,
      pendingQueries: new Map<string, 'pending' | 'success' | 'error'>(),
      fetchFn,
    };
    function Wrapper({ children }: PropsWithChildren): ReactElement {
      const value = useMemo(() => stats, []);
      return <UsageMetricsContext.Provider value={value}>{children}</UsageMetricsContext.Provider>;
    }
    const { result } = renderHook(() => useUsageMetrics(), { wrapper: Wrapper });
    act(() => result.current.markQuery(query, 'success'));
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(stats.pendingQueries.get(JSON.stringify(query))).toBe('success');
  });

  it('is safe without a provider', () => {
    const { result } = renderHook(() => useUsageMetrics());
    expect(() => result.current.markQuery(query, 'success')).not.toThrow();
  });
});
