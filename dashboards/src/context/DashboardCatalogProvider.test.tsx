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

import type { FetchFn } from '@perses-dev/client';
import { FetchProvider } from '@perses-dev/client';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import type { TagLinkDashboard } from '../components/LinksDisplay/tag-links';
import { DashboardCatalogProvider, useListProjectDashboards } from './DashboardCatalogProvider';

const dashboards: TagLinkDashboard[] = [
  { kind: 'Dashboard', metadata: { name: 'overview', project: 'my project', tags: ['ops'] } },
];

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('useListProjectDashboards', () => {
  test('loads the project catalog with the fetch from FetchProvider', async () => {
    const customFetch = vi.fn<FetchFn>().mockResolvedValue(jsonResponse(dashboards));
    const wrapper = ({ children }: PropsWithChildren): ReactElement => (
      <FetchProvider fetchFn={customFetch}>{children}</FetchProvider>
    );

    const { result } = renderHook(() => useListProjectDashboards(), { wrapper });

    await expect(result.current('my project')).resolves.toEqual(dashboards);
    expect(customFetch).toHaveBeenCalledWith('/api/v1/projects/my%20project/dashboards');
  });

  test('uses the catalog provider instead of fetching', async () => {
    const customFetch = vi.fn<FetchFn>();
    const listDashboards = vi.fn().mockResolvedValue(dashboards);
    const wrapper = ({ children }: PropsWithChildren): ReactElement => (
      <FetchProvider fetchFn={customFetch}>
        <DashboardCatalogProvider listDashboards={listDashboards}>{children}</DashboardCatalogProvider>
      </FetchProvider>
    );

    const { result } = renderHook(() => useListProjectDashboards(), { wrapper });

    await expect(result.current('my project')).resolves.toEqual(dashboards);
    expect(listDashboards).toHaveBeenCalledWith('my project');
    expect(customFetch).not.toHaveBeenCalled();
  });
});
