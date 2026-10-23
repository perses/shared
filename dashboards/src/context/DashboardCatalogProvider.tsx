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

import { fetchJson } from '@perses-dev/client';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { appBasePath } from '../components/LinksDisplay/tag-links';
import type { TagLinkDashboard } from '../components/LinksDisplay/tag-links';

export type ListProjectDashboards = (project: string) => Promise<TagLinkDashboard[]>;

const DashboardCatalogContext = createContext<ListProjectDashboards | undefined>(undefined);

export interface DashboardCatalogProviderProps {
  listDashboards: ListProjectDashboards;
  children: ReactNode;
}

export function DashboardCatalogProvider({ listDashboards, children }: DashboardCatalogProviderProps): ReactElement {
  return <DashboardCatalogContext.Provider value={listDashboards}>{children}</DashboardCatalogContext.Provider>;
}

export function useListProjectDashboards(): ListProjectDashboards {
  return useContext(DashboardCatalogContext) ?? defaultListProjectDashboards;
}

async function defaultListProjectDashboards(project: string): Promise<TagLinkDashboard[]> {
  const prefix = typeof window === 'undefined' ? '' : appBasePath(window.location.pathname);
  return fetchJson<TagLinkDashboard[]>(`${prefix}/api/v1/projects/${encodeURIComponent(project)}/dashboards`);
}
