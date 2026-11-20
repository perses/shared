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

import type { QueryDefinition, UnknownSpec, JsonData } from '@perses-dev/spec';
import type { QueryKey, UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';

import type { JsonQueryContext, JsonQueryPlugin } from '../model';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import { filterVariableStateMap, getVariableValuesKey } from './utils';
import { useAllVariableValues } from './variables';

export type JsonQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'JsonQuery', PluginSpec>;
export const JSON_QUERY_KEY = 'JsonQuery';

/**
 * Run a json query using a JsonQuery plugin and return the results.
 * A json query returns an arbitrary JSON payload and is NOT time-range dependent.
 * @param definitions: dashboard definitions for the json queries to run
 */
export function useJsonQueries(definitions: JsonQueryDefinition[]): Array<UseQueryResult<JsonData>> {
  const { getPlugin } = usePluginRegistry();
  const context = useJsonQueryContext();

  const pluginLoaderResponse = usePlugins(
    JSON_QUERY_KEY,
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
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<JsonData> => {
          const queryPlugin = await getPlugin({
            kind: JSON_QUERY_KEY,
            name: definition.spec.plugin.kind,
            version: definition.spec.plugin.metadata?.version,
            registry: definition.spec.plugin.metadata?.registry,
          });
          return queryPlugin.getJsonData(definition.spec.plugin.spec, context, signal);
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
  plugin?: JsonQueryPlugin;
  pluginLoadFailed: boolean;
  definition: JsonQueryDefinition;
  context: JsonQueryContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { variableState } = context;
  const dependencies = plugin?.dependsOn?.(definition.spec.plugin.spec, context);
  const variableDependencies = dependencies?.variables;
  const filteredVariableState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariableState);
  const queryKey = ['query', JSON_QUERY_KEY, definition, variablesValueKey] as const;
  // Only declared dependencies delay the query; undeclared ones still rerun it through the cache key.
  const waitToLoad = variableDependencies?.some((name) => variableState[name]?.loading) ?? false;
  // Let the query function surface plugin loading errors once variable dependencies are ready.
  const queryEnabled = (plugin !== undefined || pluginLoadFailed) && !waitToLoad;

  return {
    queryKey,
    queryEnabled,
  };
}

function useJsonQueryContext(): JsonQueryContext {
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    variableState,
    datasourceStore,
  };
}
