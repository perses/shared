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

import type { QueryPluginType, TimeSeriesData, UnknownSpec } from '@perses-dev/spec';

import type { Plugin } from './plugin-base';
import type { TimeSeriesQueryContext } from './time-series-queries';

/**
 * An object containing all the dependencies of an ExpressionQuery.
 */
export interface ExpressionQueryPluginDependencies {
  /**
   * Returns a list of variables name this expression query depends on.
   */
  variables?: string[];
  /**
   * The indices of the queries of the panel this expression depends on (position in the panel's list of queries, 0
   * for the first query). Only TimeSeriesQuery and ExpressionQuery queries can be used. The expression is executed
   * once all of them succeeded, with their results in `ExpressionQueryContext.inputs`, indexed the same way.
   */
  queries: number[];
}

/**
 * Context available to ExpressionQuery plugins at runtime.
 */
export interface ExpressionQueryContext extends TimeSeriesQueryContext {
  /**
   * The results of the queries this expression depends on (see `ExpressionQueryPluginDependencies.queries`), indexed
   * by their position in the panel's list of queries.
   */
  inputs: Record<number, TimeSeriesData>;
}

/**
 * A plugin computing time series from the results of other queries of the same panel (e.g. a math expression),
 * instead of fetching them from a datasource.
 */
export interface ExpressionQueryPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getTimeSeriesData: (spec: Spec, ctx: ExpressionQueryContext, abortSignal?: AbortSignal) => Promise<TimeSeriesData>;

  dependsOn: (spec: Spec, ctx: TimeSeriesQueryContext) => ExpressionQueryPluginDependencies;
}

/**
 * Returns the query types a panel supports, given the ones it declares. An ExpressionQuery returns TimeSeriesData, so
 * it is supported by every panel supporting TimeSeriesQuery without the panel having to declare it.
 */
export function getSupportedQueryTypes(declaredQueryTypes: QueryPluginType[] = []): QueryPluginType[] {
  if (declaredQueryTypes.includes('TimeSeriesQuery') && !declaredQueryTypes.includes('ExpressionQuery')) {
    return [...declaredQueryTypes, 'ExpressionQuery'];
  }
  return declaredQueryTypes;
}
