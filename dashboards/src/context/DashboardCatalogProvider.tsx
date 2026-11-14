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

import type { TimeRangeValue, VariableValue } from '@perses-dev/spec';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { TagLinkHit } from '../components/LinksDisplay/tag-links';

export interface TagLinkHrefInput {
  project: string;
  name: string;
  keepTime: boolean;
  includeVariables: boolean;
  timeRange?: TimeRangeValue;
  variables?: Record<string, { value: VariableValue }>;
  variableNames: string[];
}

export interface DashboardCatalog {
  search: (project: string, tags: string[]) => Promise<TagLinkHit[]>;
  queryKey: (project: string, tags: string[]) => readonly unknown[];
  href: (input: TagLinkHrefInput) => string;
}

const DashboardCatalogContext = createContext<DashboardCatalog | undefined>(undefined);

export interface DashboardCatalogProviderProps {
  catalog: DashboardCatalog;
  children: ReactNode;
}

export function DashboardCatalogProvider({ catalog, children }: DashboardCatalogProviderProps): ReactElement {
  return <DashboardCatalogContext.Provider value={catalog}>{children}</DashboardCatalogContext.Provider>;
}

export function useDashboardCatalog(): DashboardCatalog | undefined {
  return useContext(DashboardCatalogContext);
}
