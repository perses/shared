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

import type { QueryDefinition, UnknownSpec } from '@perses-dev/spec';
import type { QueryKey, UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';

import type { LogQueryContext, LogQueryPlugin, LogQueryResult } from '../model';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
import { filterVariableStateMap, getVariableValuesKey } from './utils';
import { useAllVariableValues } from './variables';

export type LogQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'LogQuery', PluginSpec>;
export const LOG_QUERY_KEY = 'LogQuery';

/**
 * Run log queries using LogQuery plugins and return the results.
 */
export function useLogQueries(definitions: LogQueryDefinition[]): Array<UseQueryResult<LogQueryResult>> {
  const { getPlugin } = usePluginRegistry();
  const context = useLogQueryContext();

  const pluginLoaderResponse = usePlugins(
    LOG_QUERY_KEY,
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
        enabled: queryEnabled,
        queryKey,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        structuralSharing: false,
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<LogQueryResult> => {
          const queryPlugin = await getPlugin({
            kind: LOG_QUERY_KEY,
            name: definition.spec.plugin.kind,
            version: definition.spec.plugin.metadata?.version,
            registry: definition.spec.plugin.metadata?.registry,
          });
          return queryPlugin.getLogData(definition.spec.plugin.spec, context, signal);
        },
      };
    }),
  });
}

function getQueryOptions({
  plugin,
  pluginLoadFailed,
  definition,
  context,
}: {
  plugin?: LogQueryPlugin;
  pluginLoadFailed: boolean;
  definition: LogQueryDefinition;
  context: LogQueryContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { variableState, absoluteTimeRange } = context;
  const dependencies = plugin?.dependsOn?.(definition.spec.plugin.spec, context);
  const variableDependencies = dependencies?.variables;
  const filteredVariableState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariableState);
  const queryKey = ['query', LOG_QUERY_KEY, definition, absoluteTimeRange, variablesValueKey] as const;
  // Only declared dependencies delay the query; undeclared ones still rerun it through the cache key.
  const waitToLoad = variableDependencies?.some((name) => variableState[name]?.loading) ?? false;
  // Let the query function surface plugin loading errors once variable dependencies are ready.
  const queryEnabled = (plugin !== undefined || pluginLoadFailed) && !waitToLoad;

  return {
    queryKey,
    queryEnabled,
  };
}

function useLogQueryContext(): LogQueryContext {
  const { absoluteTimeRange } = useTimeRange();
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    variableState,
    datasourceStore,
    absoluteTimeRange,
  };
}
