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

import type { ProjectMetadata } from './resource';

/**
 * Lightweight description of a dashboard, without its spec.
 */
export interface DashboardSummary {
  metadata: ProjectMetadata;
  /**
   * Human-readable name of the dashboard. Consumers fall back to `metadata.name` when it is omitted.
   */
  displayName?: string;
  /**
   * Names of the variables declared by the dashboard. Omitted when the host does not provide them.
   */
  variableNames?: string[];
}

export interface ListDashboardsFilters {
  /**
   * Keep only the dashboards whose metadata contains every tag.
   */
  tags?: string[];
}

export interface BuildDashboardUrlParams {
  project: string;
  name: string;
}

/**
 * The external API contract for fetching dashboard resources.
 * The host application implements it, so the shared packages never call a backend route directly.
 */
export interface DashboardApi {
  /**
   * List the dashboards of a project. Implementations must apply the given filters.
   */
  listDashboards: (project: string, filters?: ListDashboardsFilters) => Promise<DashboardSummary[]>;
  /**
   * Optional function to build the URL that opens a dashboard in the host application.
   */
  buildDashboardUrl?: (params: BuildDashboardUrlParams) => string;
}
