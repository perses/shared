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

import type { DashboardApi, DashboardSummary, ListDashboardsFilters } from '@perses-dev/client';
import type { UseQueryResult } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RenderHookResult } from '@testing-library/react';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import { DashboardResourceStoreProvider, useListDashboards } from './dashboards';

const summaries: DashboardSummary[] = [{ metadata: { name: 'detail', project: 'perses' }, displayName: 'Detail' }];

function renderListDashboards(
  filters: ListDashboardsFilters,
  dashboardApi?: DashboardApi,
): RenderHookResult<UseQueryResult<DashboardSummary[]>, unknown> {
  // Default retries, so a query that keeps failing would stay pending past the waitFor timeout.
  const queryClient = new QueryClient();
  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        {dashboardApi ? (
          <DashboardResourceStoreProvider dashboardApi={dashboardApi}>{children}</DashboardResourceStoreProvider>
        ) : (
          children
        )}
      </QueryClientProvider>
    );
  }
  return renderHook(() => useListDashboards(filters), { wrapper: Wrapper });
}

describe('useListDashboards', () => {
  it('forwards the project and the tags to the host unchanged', async () => {
    const listDashboards = vi.fn().mockResolvedValue(summaries);
    const filters = { project: 'perses', tags: [' traffic', 'api', 'traffic'] };
    const { result } = renderListDashboards(filters, { listDashboards });

    await waitFor(() => expect(result.current.data).toEqual(summaries));
    expect(listDashboards).toHaveBeenCalledWith(filters);
  });

  it('lists the dashboards of all projects when no project is given', async () => {
    const listDashboards = vi.fn().mockResolvedValue([]);
    const { result } = renderListDashboards({}, { listDashboards });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listDashboards).toHaveBeenCalledWith({});
  });

  it('fails instead of staying pending when no provider is mounted', async () => {
    const { result } = renderListDashboards({ project: 'perses' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('No DashboardResourceStoreContext found. Did you forget a Provider?');
  });
});
