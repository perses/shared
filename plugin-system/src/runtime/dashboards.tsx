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

import type {
  BuildDashboardUrlParams,
  DashboardApi,
  DashboardSummary,
  ListDashboardsFilters,
} from '@perses-dev/client';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

/**
 * Read access to dashboard resources, backed by the `DashboardApi` of the host application.
 */
export interface DashboardResourceStore {
  /**
   * Lists the dashboards matching the given filters. The host applies the filters.
   */
  listDashboards(filters?: ListDashboardsFilters): Promise<DashboardSummary[]>;

  /**
   * Builds the URL that opens a dashboard. Undefined when the host does not support it.
   */
  buildDashboardUrl(params: BuildDashboardUrlParams): string | undefined;
}

export const DashboardResourceStoreContext = createContext<DashboardResourceStore | undefined>(undefined);

export function useDashboardResourceStore(): DashboardResourceStore {
  const ctx = useContext(DashboardResourceStoreContext);
  if (ctx === undefined) {
    throw new Error('No DashboardResourceStoreContext found. Did you forget a Provider?');
  }
  return ctx;
}

export interface DashboardResourceStoreProviderProps {
  dashboardApi: DashboardApi;
  children?: ReactNode;
}

/**
 * A `DashboardResourceStoreContext` provider that uses an external API to read dashboard resources.
 */
export function DashboardResourceStoreProvider({
  dashboardApi,
  children,
}: DashboardResourceStoreProviderProps): ReactElement {
  const store = useMemo<DashboardResourceStore>(
    () => ({
      listDashboards: (filters): Promise<DashboardSummary[]> => dashboardApi.listDashboards(filters),
      buildDashboardUrl: (params): string | undefined => dashboardApi.buildDashboardUrl?.(params),
    }),
    [dashboardApi],
  );
  return <DashboardResourceStoreContext.Provider value={store}>{children}</DashboardResourceStoreContext.Provider>;
}

/**
 * Lists the dashboards matching the given filters, across all projects when no project is given.
 * The query fails, instead of staying pending, when no `DashboardResourceStoreProvider` is mounted.
 */
export function useListDashboards(
  filters: ListDashboardsFilters = {},
  options?: Omit<UseQueryOptions<DashboardSummary[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<DashboardSummary[]> {
  const store = useContext(DashboardResourceStoreContext);
  return useQuery<DashboardSummary[]>({
    ...options,
    queryKey: ['listDashboards', filters],
    queryFn: () => {
      if (store === undefined) {
        throw new Error('No DashboardResourceStoreContext found. Did you forget a Provider?');
      }
      return store.listDashboards(filters);
    },
    // Retrying cannot help when the store is missing.
    ...(store === undefined ? { retry: false } : {}),
  });
}
