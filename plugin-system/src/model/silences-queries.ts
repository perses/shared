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

import { Query, QueryKey } from '@tanstack/react-query';
import { SilencesData, UnknownSpec } from '@perses-dev/spec';
import { DatasourceStore, VariableStateMap } from '../runtime';
import { Plugin } from './plugin-base';

/**
 * An object containing all the dependencies of a SilencesQuery.
 */
type SilencesQueryPluginDependencies = {
  /**
   * Returns a list of variables name this silences query depends on.
   */
  variables?: string[];
};

/**
 * A plugin for running silences queries.
 * Silences represent current state, not historical data, so the context
 * does NOT include absoluteTimeRange.
 */
export interface SilencesQueryPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getSilencesData: (spec: Spec, ctx: SilencesQueryContext, abortSignal?: AbortSignal) => Promise<SilencesData>;
  dependsOn?: (spec: Spec, ctx: SilencesQueryContext) => SilencesQueryPluginDependencies;
}

/**
 * Context available to SilencesQuery plugins at runtime.
 * Note: No absoluteTimeRange since silences represent current state.
 */
export interface SilencesQueryContext {
  datasourceStore: DatasourceStore;
  variableState: VariableStateMap;
}

export type SilencesDataQuery = Query<SilencesData, unknown, SilencesData, QueryKey>;
