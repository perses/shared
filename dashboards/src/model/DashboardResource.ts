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

import { DashboardSpec } from '@perses-dev/spec';

export type DashboardKind = 'Dashboard' | 'EphemeralDashboard';

/* TODO: As discussed we can keep this intermediary type until we decide on a new location for it. */
export type DashboardMetaData = {
  name: string;
  project: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
};

/* TODO: There is an open and ongoing issue whether the meta-data should be removed or not.
   Such a decision would affect DashbaordProvider and buildDatasourceProxyUrl
   https://github.com/perses/perses/issues/4016
*/
export interface DashboardResource {
  kind: DashboardKind;
  spec: DashboardSpec;
  metadata: DashboardMetaData;
}
