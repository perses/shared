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

import { renderHook } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import type { TagLinkHit } from '../components/LinksDisplay/tag-links';
import type { DashboardCatalog } from './DashboardCatalogProvider';
import { DashboardCatalogProvider, useDashboardCatalog } from './DashboardCatalogProvider';

const hits: TagLinkHit[] = [{ name: 'overview', label: 'Overview', variableNames: ['env'] }];

describe('useDashboardCatalog', () => {
  test('is unset until the host provides a catalog', () => {
    const { result } = renderHook(() => useDashboardCatalog());

    expect(result.current).toBeUndefined();
  });

  test('returns the catalog provided by the host', async () => {
    const search = vi.fn().mockResolvedValue(hits);
    const catalog: DashboardCatalog = {
      search,
      queryKey: (project, tags) => ['dashboards', project, tags],
      href: (input) => `/go/${input.project}/${input.name}`,
    };
    const wrapper = ({ children }: PropsWithChildren): ReactElement => (
      <DashboardCatalogProvider catalog={catalog}>{children}</DashboardCatalogProvider>
    );

    const { result } = renderHook(() => useDashboardCatalog(), { wrapper });

    await expect(result.current?.search('demo', ['ops'])).resolves.toEqual(hits);
    expect(search).toHaveBeenCalledWith('demo', ['ops']);
    expect(result.current?.queryKey('demo', ['ops'])).toEqual(['dashboards', 'demo', ['ops']]);
  });
});
