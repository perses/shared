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

import type { TimeSeriesData, TimeSeriesQueryDefinition, UnknownSpec } from '@perses-dev/spec';
import type { Query, QueryCache, QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TimeSeriesDataQuery, TimeSeriesQueryContext, TimeSeriesQueryMode, TimeSeriesQueryPlugin } from '../model';
import { useDatasourceStore } from './datasources';
import { usePlugin, usePluginRegistry, usePlugins } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
import { filterVariableStateMap, getVariableValuesKey } from './utils';
import { useAllVariableValues } from './variables';

export interface UseTimeSeriesQueryOptions {
  suggestedStepMs?: number;
  mode?: TimeSeriesQueryMode;
}

export const TIME_SERIES_QUERY_KEY = 'TimeSeriesQuery';

/**
 * Runs a time series query using a plugin and returns the results.
 */
export const useTimeSeriesQuery = (
  definition: TimeSeriesQueryDefinition,
  options?: UseTimeSeriesQueryOptions,
  queryOptions?: QueryObserverOptions<TimeSeriesData>,
): UseQueryResult<TimeSeriesData> => {
  const { getPlugin } = usePluginRegistry();
  const { data: plugin, isError: pluginLoadFailed } = usePlugin(TIME_SERIES_QUERY_KEY, definition.spec.plugin.kind, {
    version: definition.spec.plugin.metadata?.version,
    registry: definition.spec.plugin.metadata?.registry,
  });
  const context = useTimeSeriesQueryContext();
  const { queryEnabled, queryKey } = getQueryOptions({ plugin, pluginLoadFailed, definition, context });
  return useQuery({
    enabled: (queryOptions?.enabled ?? true) && queryEnabled,
    queryKey,
    structuralSharing: false,
    queryFn: async ({ signal }): Promise<TimeSeriesData> => {
      const queryPlugin = await getPlugin({
        kind: TIME_SERIES_QUERY_KEY,
        name: definition.spec.plugin.kind,
        version: definition.spec.plugin.metadata?.version,
        registry: definition.spec.plugin.metadata?.registry,
      });
      // Keep options out of query key so we don't re-run queries because suggested step changes
      const ctx: TimeSeriesQueryContext = { ...context, suggestedStepMs: options?.suggestedStepMs };
      return queryPlugin.getTimeSeriesData(definition.spec.plugin.spec, ctx, signal);
    },
  });
};

/**
 * Runs multiple time series queries using plugins and returns the results.
 */
export function useTimeSeriesQueries(
  definitions: TimeSeriesQueryDefinition[],
  options?: UseTimeSeriesQueryOptions,
  queryOptions?: Omit<QueryObserverOptions, 'queryKey'>,
): Array<UseQueryResult<TimeSeriesData>> {
  const { getPlugin } = usePluginRegistry();
  const context = {
    ...useTimeSeriesQueryContext(),
    mode: options?.mode,
    suggestedStepMs: options?.suggestedStepMs,
  };

  const pluginLoaderResponse = usePlugins(
    TIME_SERIES_QUERY_KEY,
    definitions.map(({ spec }) => ({
      kind: spec.plugin.kind,
      version: spec.plugin.metadata?.version,
      registry: spec.plugin.metadata?.registry,
    })),
  );
  return useQueries({
    queries: definitions.map((definition, index) => {
      const plugin = pluginLoaderResponse[index]?.data;
      const pluginLoadFailed = pluginLoaderResponse[index]?.isError ?? false;
      const { queryEnabled, queryKey } = getQueryOptions({ plugin, pluginLoadFailed, definition, context });
      return {
        ...queryOptions,
        enabled: (queryOptions?.enabled ?? true) && queryEnabled,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        structuralSharing: queryOptions?.structuralSharing ?? false,
        queryKey,
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<TimeSeriesData> => {
          const queryPlugin = await getPlugin({
            kind: TIME_SERIES_QUERY_KEY,
            name: definition.spec.plugin.kind,
            version: definition.spec.plugin.metadata?.version,
            registry: definition.spec.plugin.metadata?.registry,
          });
          return queryPlugin.getTimeSeriesData(definition.spec.plugin.spec, context, signal);
        },
      } as QueryObserverOptions;
    }),
  }) as Array<UseQueryResult<TimeSeriesData>>;
}

function getQueryOptions({
  plugin,
  pluginLoadFailed,
  definition,
  context,
}: {
  plugin?: TimeSeriesQueryPlugin;
  pluginLoadFailed: boolean;
  definition: TimeSeriesQueryDefinition;
  context: TimeSeriesQueryContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { absoluteTimeRange, suggestedStepMs, mode, variableState } = context;

  const dependencies = plugin?.dependsOn?.(definition.spec.plugin.spec, context);
  const variableDependencies = dependencies?.variables;

  // Determine queryKey
  const filteredVariableState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariableState);

  const queryKey = [
    'query',
    TIME_SERIES_QUERY_KEY,
    definition,
    absoluteTimeRange,
    variablesValueKey,
    suggestedStepMs,
    mode,
  ] as const;

  // Determine queryEnabled
  // Only declared dependencies delay the query; undeclared ones still rerun it through the cache key.
  const waitToLoad = variableDependencies?.some((name) => variableState[name]?.loading) ?? false;

  // Let the query function surface plugin loading errors once variable dependencies are ready.
  const queryEnabled = (plugin !== undefined || pluginLoadFailed) && !waitToLoad;

  return {
    queryKey,
    queryEnabled,
  };
}

/**
 * Build the time series query context object from data available at runtime
 */
function useTimeSeriesQueryContext(): TimeSeriesQueryContext {
  const { absoluteTimeRange } = useTimeRange();
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    absoluteTimeRange,
    variableState,
    datasourceStore,
  };
}

/**
 * Get active time series queries for query results summary
 */
export function useActiveTimeSeriesQueries(): TimeSeriesDataQuery[] {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  return getActiveTimeSeriesQueries(queryCache);
}

/**
 * Filter all cached queries down to only active time series queries
 */
export function getActiveTimeSeriesQueries(cache: QueryCache): TimeSeriesDataQuery[] {
  const queries: TimeSeriesDataQuery[] = [];

  for (const query of cache.findAll({ type: 'active' })) {
    const firstPart = query.queryKey?.[0] as UnknownSpec;
    if (firstPart?.kind && (firstPart.kind as string).startsWith(TIME_SERIES_QUERY_KEY)) {
      queries.push(query as Query<TimeSeriesData, unknown, TimeSeriesData, QueryKey>);
    }
  }

  return queries;
}
