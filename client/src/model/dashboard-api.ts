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
}

export interface ListDashboardsFilters {
  /**
   * Project to list the dashboards from. Dashboards of all projects are listed when it is omitted.
   */
  project?: string;
  /**
   * Keep only the dashboards whose metadata contains every tag.
   * The host owns the matching, for example by filtering client-side when its backend cannot search on tags.
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
   * List the dashboards matching the given filters. Implementations must apply every filter.
   */
  listDashboards: (filters?: ListDashboardsFilters) => Promise<DashboardSummary[]>;
  /**
   * Optional function to build the URL that opens a dashboard in the host application.
   */
  buildDashboardUrl?: (params: BuildDashboardUrlParams) => string;
}
