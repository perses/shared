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

import type { QueryDefinition, TimeSeriesData, UnknownSpec } from '@perses-dev/spec';
import type { QueryCache, QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries, useQueryClient } from '@tanstack/react-query';

import type { ExpressionQueryContext, ExpressionQueryPlugin, TimeSeriesQueryContext } from '../model';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import type { UseTimeSeriesQueryOptions } from './time-series-queries';
import { useTimeRange } from './TimeRangeProvider';
import { filterVariableStateMap, getVariableValuesKey } from './utils';
import { useAllVariableValues } from './variables';

export type ExpressionQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'ExpressionQuery', PluginSpec>;
export const EXPRESSION_QUERY_KEY = 'ExpressionQuery';

/** Converts a 0-based query index to the 1-based number shown in user-facing messages. */
function queryNum(idx: number): number {
  return idx + 1;
}

/**
 * Query types whose results can be used as inputs of an expression: the ones returning TimeSeriesData.
 */
const INPUT_QUERY_TYPES = ['TimeSeriesQuery', EXPRESSION_QUERY_KEY] as const;

/**
 * The state of a query used as input of an expression. Both a `UseQueryResult` and a cached query state match it.
 */
export type ExpressionQueryInputState = Pick<
  UseQueryResult<TimeSeriesData>,
  'status' | 'data' | 'dataUpdatedAt' | 'errorUpdatedAt'
>;

interface PreparedExpressionQuery {
  queryKey: QueryKey;
  enabled: boolean;
  inputs: Record<number, TimeSeriesData>;
  /** Set when the expression can't be executed because of its dependencies (unknown query, cycle, failed input...) */
  error?: Error;
}

function getBaseOptions(
  plugin: ExpressionQueryPlugin | undefined,
  definition: QueryDefinition,
  context: TimeSeriesQueryContext,
): { queryKey: QueryKey; enabled: boolean; dependencies: number[] } {
  const { timeRange, suggestedStepMs, mode, variableState } = context;
  const dependencies = plugin?.dependsOn(definition.spec.plugin.spec, context);
  const variableDependencies = dependencies?.variables;
  const variablesValueKey = getVariableValuesKey(filterVariableStateMap(variableState, variableDependencies));
  const waitToLoad = variableDependencies?.some((v) => variableState[v]?.loading) ?? false;
  return {
    queryKey: ['query', EXPRESSION_QUERY_KEY, definition, timeRange, variablesValueKey, suggestedStepMs, mode],
    enabled: plugin !== undefined && !waitToLoad,
    dependencies: dependencies?.queries ?? [],
  };
}

/**
 * Orders the queries so that every query comes after the queries it depends on.
 * Queries that are part of a cycle or that depend on an unknown index are reported in `errors`.
 * @param nbQueries the number of queries of the panel
 * @param dependencies the indices of the queries each query depends on
 */
export function sortQueriesByDependencies(
  nbQueries: number,
  dependencies: number[][],
): { order: number[]; errors: Map<number, Error> } {
  const errors = new Map<number, Error>();
  const remainingDeps = Array.from<number>({ length: nbQueries }).fill(0);
  const dependents: number[][] = Array.from({ length: nbQueries }, () => []);

  dependencies.forEach((deps, idx) => {
    for (const dep of deps) {
      if (!Number.isInteger(dep) || dep < 0 || dep >= nbQueries) {
        errors.set(idx, new Error(`Query ${queryNum(idx)} depends on the unknown query ${queryNum(dep)}`));
        continue;
      }
      remainingDeps[idx] = (remainingDeps[idx] ?? 0) + 1;
      dependents[dep]?.push(idx);
    }
  });

  const order: number[] = [];
  const queue = remainingDeps.flatMap((count, idx) => (count === 0 ? [idx] : []));
  while (queue.length > 0) {
    const idx = queue.shift();
    if (idx === undefined) {
      continue;
    }
    order.push(idx);
    for (const dependent of dependents[idx] ?? []) {
      remainingDeps[dependent] = (remainingDeps[dependent] ?? 0) - 1;
      if (remainingDeps[dependent] === 0) {
        queue.push(dependent);
      }
    }
  }

  // Every query not ordered is part of a cycle (or depends on one).
  for (let idx = 0; idx < nbQueries; idx++) {
    if (!order.includes(idx)) {
      errors.set(idx, new Error(`Query ${queryNum(idx)} has a circular dependency`));
      order.push(idx);
    }
  }
  return { order, errors };
}

/**
 * Computes the query key and the inputs of every expression query. An expression is enabled only once its inputs are
 * available, and its query key includes the update time of its inputs, so it is re-executed every time an input
 * changes.
 * @param definitions all the queries of the panel
 * @param plugins the expression plugins, indexed like `definitions` (undefined for other queries or while loading)
 * @param context the time series query context
 * @param inputResults the results of the queries that are not expressions, indexed like `definitions`
 * @param queryCache the cache used to read the results of the expressions used as inputs of other expressions
 * @returns the prepared expression queries, indexed like `definitions` (undefined for other queries)
 */
export function prepareExpressionQueries(
  definitions: QueryDefinition[],
  plugins: Array<ExpressionQueryPlugin | undefined>,
  context: TimeSeriesQueryContext,
  inputResults: Array<ExpressionQueryInputState | undefined>,
  queryCache: Pick<QueryCache, 'find'>,
): Array<PreparedExpressionQuery | undefined> {
  const baseOptions = definitions.map((definition, idx) =>
    definition.kind === EXPRESSION_QUERY_KEY ? getBaseOptions(plugins[idx], definition, context) : undefined,
  );
  const { order, errors } = sortQueriesByDependencies(
    definitions.length,
    baseOptions.map((options) => options?.dependencies ?? []),
  );

  const prepared: Array<PreparedExpressionQuery | undefined> = Array.from({ length: definitions.length });
  for (const idx of order) {
    const base = baseOptions[idx];
    if (base === undefined) {
      continue;
    }
    const dependencyError = errors.get(idx);
    if (dependencyError) {
      prepared[idx] = {
        queryKey: [...base.queryKey, 'dependency-error'],
        enabled: base.enabled,
        inputs: {},
        error: dependencyError,
      };
      continue;
    }

    const inputs: Record<number, TimeSeriesData> = {};
    const inputsKey: Array<[number, number]> = [];
    let ready = true;
    let error: Error | undefined;
    for (const dep of base.dependencies) {
      const kind = definitions[dep]?.kind;
      if (!INPUT_QUERY_TYPES.includes(kind)) {
        error = new Error(
          `Query ${queryNum(idx)} can't use the query ${queryNum(dep)}: only time series and expression queries can be used`,
        );
        continue;
      }

      let state: ExpressionQueryInputState | undefined;
      if (kind === EXPRESSION_QUERY_KEY) {
        const depPrepared = prepared[dep];
        if (depPrepared?.error) {
          error = new Error(`Query ${queryNum(idx)} can't be computed because the query ${queryNum(dep)} failed`);
          continue;
        }
        state = depPrepared?.enabled
          ? queryCache.find<TimeSeriesData>({ queryKey: depPrepared.queryKey, exact: true })?.state
          : undefined;
      } else {
        state = inputResults[dep];
      }

      if (state?.status === 'error') {
        error = new Error(`Query ${queryNum(idx)} can't be computed because the query ${queryNum(dep)} failed`);
        inputsKey.push([dep, state.errorUpdatedAt]);
        continue;
      }
      if (state?.status !== 'success' || state.data === undefined) {
        ready = false;
        continue;
      }
      inputs[dep] = state.data;
      inputsKey.push([dep, state.dataUpdatedAt]);
    }
    prepared[idx] = {
      queryKey: [...base.queryKey, ...inputsKey],
      enabled: base.enabled && (ready || error !== undefined),
      inputs,
      error,
    };
  }
  return prepared;
}

/**
 * Runs the expression queries of a panel. An expression query is computed from the results of other queries of the
 * panel, referenced by their position in `definitions` (see `ExpressionQueryPluginDependencies.queries`). It is
 * executed once these queries succeeded, with their results in `ExpressionQueryContext.inputs`.
 * @param definitions all the queries of the panel, whatever their type
 * @param inputResults the results of the queries that are not expressions, indexed like `definitions`
 * @param options time range and step options forwarded to the expression query context
 * @param queryOptions additional react-query observer options (excluding `queryKey` and `queryFn`) applied to every expression query
 * @returns the results of the expression queries, in their order of appearance in `definitions`
 */
export function useExpressionQueries(
  definitions: QueryDefinition[],
  inputResults: Array<ExpressionQueryInputState | undefined>,
  options?: UseTimeSeriesQueryOptions,
  queryOptions?: Omit<QueryObserverOptions, 'queryKey' | 'queryFn'>,
): Array<UseQueryResult<TimeSeriesData>> {
  const { getPlugin } = usePluginRegistry();
  const queryClient = useQueryClient();
  const { absoluteTimeRange } = useTimeRange();
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();
  const context: TimeSeriesQueryContext = {
    timeRange: absoluteTimeRange,
    variableState,
    datasourceStore,
    mode: options?.mode,
    suggestedStepMs: options?.suggestedStepMs,
  };

  const expressionIndices = definitions.flatMap((definition, idx) =>
    definition.kind === EXPRESSION_QUERY_KEY ? [idx] : [],
  );
  const pluginLoaderResponse = usePlugins(
    EXPRESSION_QUERY_KEY,
    expressionIndices.map((idx) => ({
      kind: definitions[idx]!.spec.plugin.kind,
      version: definitions[idx]!.spec.plugin.metadata?.version,
      registry: definitions[idx]!.spec.plugin.metadata?.registry,
    })),
  );
  const plugins: Array<ExpressionQueryPlugin | undefined> = Array.from({ length: definitions.length });
  expressionIndices.forEach((defIdx, i) => {
    plugins[defIdx] = pluginLoaderResponse[i]?.data;
  });

  // The state of the expressions used as inputs of other expressions is read from the cache. This hook is subscribed
  // to all of them through useQueries, so it re-renders (and enables the dependent expressions) once they are ready.
  const prepared = prepareExpressionQueries(definitions, plugins, context, inputResults, queryClient.getQueryCache());

  return useQueries({
    queries: expressionIndices.map((defIdx) => {
      const definition = definitions[defIdx]!;
      const { queryKey, enabled, inputs, error } = prepared[defIdx]!;
      return Object.assign({}, queryOptions, {
        enabled: (queryOptions?.enabled ?? true) && enabled,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        // expression is not fetching data from a remote source, so we don't want to retry on failure (e.g. if an input query is invalid)
        retry: 0,
        queryKey,
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<TimeSeriesData> => {
          if (error) {
            throw error;
          }
          const plugin = await getPlugin({
            kind: EXPRESSION_QUERY_KEY,
            name: definition.spec.plugin.kind,
            version: definition.spec.plugin.metadata?.version,
            registry: definition.spec.plugin.metadata?.registry,
          });
          const ctx: ExpressionQueryContext = { ...context, inputs };
          return plugin.getTimeSeriesData(definition.spec.plugin.spec, ctx, signal);
        },
      });
    }),
  });
}
