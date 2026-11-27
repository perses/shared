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
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { transformQueryResults } from './model';

describe('transformQueryResults', () => {
  it('keeps dependent panels loading while pending and keeps data visible during refetch', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const definition: QueryDefinition = {
      kind: 'TimeSeriesQuery',
      spec: { plugin: { kind: 'TestQuery', spec: {} } },
    };
    const queryFn = vi.fn().mockResolvedValue({ series: [] });
    const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender, unmount } = renderHook(
      ({ enabled }) => {
        const query = useQuery({ queryKey: ['query'], queryFn, enabled });
        return { query, panel: transformQueryResults([query], [definition])[0] };
      },
      { wrapper, initialProps: { enabled: false } },
    );

    expect(result.current.query.isLoading).toBe(false);
    expect(result.current.panel?.isPending).toBe(true);
    expect(queryFn).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.panel?.data).toEqual({ series: [] }));
    expect(result.current.panel?.isPending).toBe(false);

    queryFn.mockImplementation(() => new Promise(() => {}));
    act(() => {
      void client.invalidateQueries({ queryKey: ['query'] });
    });
    await waitFor(() => expect(result.current.panel?.isFetching).toBe(true));
    expect(result.current.panel?.isPending).toBe(false);
    expect(result.current.panel?.data).toEqual({ series: [] });
    unmount();
    client.clear();
  });

  it('cancels the in-flight fetch of the query matching the definition', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const definition: QueryDefinition = {
      kind: 'TimeSeriesQuery',
      spec: { plugin: { kind: 'TestQuery', spec: {} } },
    };
    let signal: AbortSignal | undefined;
    const queryFn = vi.fn(
      (ctx: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal = ctx.signal;
          ctx.signal.addEventListener('abort', () => reject(ctx.signal.reason));
        }),
    );
    const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () => {
        // Same key layout as the data query hooks: ['query', kind, definition, ...context].
        const query = useQuery({ queryKey: ['query', definition.kind, { ...definition }, 'time-range'], queryFn });
        return transformQueryResults([query], [definition], client)[0];
      },
      { wrapper },
    );

    await waitFor(() => expect(result.current?.isFetching).toBe(true));
    act(() => result.current?.cancel?.());

    await waitFor(() => expect(result.current?.isFetching).toBe(false));
    expect(signal?.aborted).toBe(true);
    expect(result.current?.error).toBeNull();
    unmount();
    client.clear();
  });
});
