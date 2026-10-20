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

import type {
  TimeSeriesDataQuery,
  TimeSeriesQueryContext,
  TimeSeriesQueryMode,
  TimeSeriesQueryPlugin,
} from '../model';
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

function getQueryOptions({
  plugin,
  definition,
  context,
}: {
  plugin?: TimeSeriesQueryPlugin;
  definition: TimeSeriesQueryDefinition;
  context: TimeSeriesQueryContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { timeRange, suggestedStepMs, mode, variableState } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  // Determine queryKey
  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);

  const queryKey = [
    'query',
    TIME_SERIES_QUERY_KEY,
    definition,
    timeRange,
    variablesValueKey,
    suggestedStepMs,
    mode,
  ] as const;

  // Determine queryEnabled
  let waitToLoad = false;
  if (variableDependencies) {
    waitToLoad = variableDependencies.some((v) => variableState[v]?.loading);
  }

  const queryEnabled = plugin !== undefined && !waitToLoad;

  return {
    queryKey,
    queryEnabled,
  };
}

/**
 * Runs a time series query using a plugin and returns the results.
 */
export const useTimeSeriesQuery = (
  definition: TimeSeriesQueryDefinition,
  options?: UseTimeSeriesQueryOptions,
  queryOptions?: QueryObserverOptions<TimeSeriesData>,
): UseQueryResult<TimeSeriesData> => {
  const { data: plugin } = usePlugin(TIME_SERIES_QUERY_KEY, definition.spec.plugin.kind, {
    version: definition.spec.plugin.metadata?.version,
    registry: definition.spec.plugin.metadata?.registry,
  });
  const context = useTimeSeriesQueryContext();
  const { queryEnabled, queryKey } = getQueryOptions({ plugin, definition, context });
  return useQuery({
    enabled: (queryOptions?.enabled ?? true) || queryEnabled,
    queryKey: queryKey,
    queryFn: ({ signal }) => {
      // The 'enabled' option should prevent this from happening, but make TypeScript happy by checking
      if (plugin === undefined) {
        throw new Error('Expected plugin to be loaded');
      }
      // Keep options out of query key so we don't re-run queries because suggested step changes
      const ctx: TimeSeriesQueryContext = { ...context, suggestedStepMs: options?.suggestedStepMs };
      return plugin.getTimeSeriesData(definition.spec.plugin.spec, ctx, signal);
    },
  });
};

/**
 * Enablement order:
 * 1. window.__PERSES_QUERY_BATCH__ (force on/off for debug)
 * 2. dashboard.spec.queryBatching.mode (preferred: off | panel | viewport | dashboard)
 * 3. localStorage perses.queryBatch=1 (dev fallback)
 */
/** Exported for unit tests. */
export function isQueryBatchEnabled(dashboardMode?: string): boolean {
  if (typeof window !== 'undefined') {
    try {
      const w = window as unknown as { __PERSES_QUERY_BATCH__?: boolean };
      if (typeof w.__PERSES_QUERY_BATCH__ === 'boolean') {
        return w.__PERSES_QUERY_BATCH__;
      }
    } catch {
      /* ignore */
    }
  }
  const mode = (dashboardMode ?? '').toLowerCase().trim();
  if (mode === 'off' || mode === 'false' || mode === '0') {
    return false;
  }
  if (
    mode === 'panel' ||
    mode === 'viewport' ||
    mode === 'dashboard' ||
    mode === 'on' ||
    mode === 'true' ||
    mode === '1'
  ) {
    return true;
  }
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem('perses.queryBatch') === '1';
  } catch {
    return false;
  }
}

// In-flight batch promises keyed by panel-level batch id (same time range + plugin kind).
const inflightBatches = new Map<string, Promise<TimeSeriesData[]>>();

/**
 * Runs multiple time series queries using plugins and returns the results.
 * When batching is enabled and the plugin implements getTimeSeriesDataBatch, definitions
 * sharing the same plugin kind are coalesced into one plugin call (same-panel batch).
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
    definitions.map((d) => ({
      kind: d.spec.plugin.kind,
      version: d.spec.plugin.metadata?.version,
      registry: d.spec.plugin.metadata?.registry,
    })),
  );

  // Dashboard YAML: spec.queryBatching.mode — set by DashboardProvider on window for plugin-system.
  const dashMode =
    typeof window !== 'undefined'
      ? (window as unknown as { __PERSES_DASHBOARD_QUERY_BATCHING_MODE__?: string })
          .__PERSES_DASHBOARD_QUERY_BATCHING_MODE__
      : undefined;
  const batchOn = isQueryBatchEnabled(dashMode) && definitions.length > 1;

  return useQueries({
    queries: definitions.map((definition, idx) => {
      const plugin = pluginLoaderResponse[idx]?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ plugin, definition, context });
      return {
        ...queryOptions,
        enabled: (queryOptions?.enabled ?? true) && queryEnabled,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        queryKey: queryKey,
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<TimeSeriesData> => {
          const loaded = (await getPlugin({
            kind: TIME_SERIES_QUERY_KEY,
            name: definition.spec.plugin.kind,
            version: definition.spec.plugin.metadata?.version,
            registry: definition.spec.plugin.metadata?.registry,
          })) as TimeSeriesQueryPlugin;

          if (batchOn && typeof loaded.getTimeSeriesDataBatch === 'function') {
            const sameKind = definitions.filter((d) => d.spec.plugin.kind === definition.spec.plugin.kind);
            const batchKey = JSON.stringify({
              kind: definition.spec.plugin.kind,
              timeRange: context.timeRange,
              suggestedStepMs: context.suggestedStepMs,
              mode: context.mode,
              specs: sameKind.map((d) => d.spec.plugin.spec),
            });
            let batchPromise = inflightBatches.get(batchKey);
            if (!batchPromise) {
              const specs = sameKind.map((d) => d.spec.plugin.spec);
              batchPromise = loaded
                .getTimeSeriesDataBatch!(specs, context, signal)
                .finally(() => inflightBatches.delete(batchKey));
              inflightBatches.set(batchKey, batchPromise);
            }
            const results = await batchPromise;
            const pos = sameKind.findIndex((d) => d === definition);
            return results[pos] ?? { series: [] };
          }

          return loaded.getTimeSeriesData(definition.spec.plugin.spec, context, signal);
        },
      } as QueryObserverOptions;
    }),
  }) as Array<UseQueryResult<TimeSeriesData>>;
}

/**
 * Build the time series query context object from data available at runtime
 */
function useTimeSeriesQueryContext(): TimeSeriesQueryContext {
  const { absoluteTimeRange } = useTimeRange();
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    timeRange: absoluteTimeRange,
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
