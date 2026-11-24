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
});
