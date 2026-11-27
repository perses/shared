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
   * Project used when a consumer does not name one, usually the project of the current dashboard.
   */
  project?: string;

  /**
   * Lists the dashboards of a project. Tags are trimmed, deduplicated and sorted before reaching the API.
   */
  listDashboards(project: string, filters?: ListDashboardsFilters): Promise<DashboardSummary[]>;

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
  projectName?: string;
  children?: ReactNode;
}

/**
 * A `DashboardResourceStoreContext` provider that uses an external API to read dashboard resources.
 */
export function DashboardResourceStoreProvider({
  dashboardApi,
  projectName,
  children,
}: DashboardResourceStoreProviderProps): ReactElement {
  const store = useMemo<DashboardResourceStore>(
    () => ({
      project: projectName,
      listDashboards: (project, filters): Promise<DashboardSummary[]> =>
        dashboardApi.listDashboards(project, { ...filters, tags: normalizeTags(filters?.tags) }),
      buildDashboardUrl: (params): string | undefined => dashboardApi.buildDashboardUrl?.(params),
    }),
    [dashboardApi, projectName],
  );
  return <DashboardResourceStoreContext.Provider value={store}>{children}</DashboardResourceStoreContext.Provider>;
}

export interface UseListDashboardsParams extends ListDashboardsFilters {
  /**
   * Defaults to the project of the `DashboardResourceStore`.
   */
  project?: string;
}

/**
 * Lists the dashboards of a project. The query fails, instead of staying pending, when no
 * `DashboardResourceStoreProvider` is mounted or no project is known.
 */
export function useListDashboards(
  params: UseListDashboardsParams = {},
  options?: Omit<UseQueryOptions<DashboardSummary[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<DashboardSummary[]> {
  const store = useContext(DashboardResourceStoreContext);
  const project = params.project ?? store?.project;
  const tags = normalizeTags(params.tags);
  const isUnavailable = store === undefined || project === undefined;
  return useQuery<DashboardSummary[]>({
    ...options,
    queryKey: ['listDashboards', project, tags],
    queryFn: () => {
      if (store === undefined) {
        throw new Error('No DashboardResourceStoreContext found. Did you forget a Provider?');
      }
      if (project === undefined) {
        throw new Error('No project to list dashboards from');
      }
      return store.listDashboards(project, { tags });
    },
    // Retrying cannot help when the store or the project is missing.
    ...(isUnavailable ? { retry: false } : {}),
  });
}

function normalizeTags(tags: string[] | undefined): string[] {
  const normalized = new Set<string>();
  for (const tag of tags ?? []) {
    const trimmed = tag.trim();
    if (trimmed !== '') {
      normalized.add(trimmed);
    }
  }
  return [...normalized].toSorted();
}
