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

import { SilencesData, QueryDefinition, UnknownSpec } from '@perses-dev/spec';
import { QueryKey, useQueries, UseQueryResult } from '@tanstack/react-query';
import { SilencesQueryContext, SilencesQueryPlugin } from '../model';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import { useAllVariableValues } from './variables';
import { filterVariableStateMap, getVariableValuesKey } from './utils';

export type SilencesQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'SilencesQuery', PluginSpec>;
export const SILENCES_QUERY_KEY = 'SilencesQuery';

/**
 * Run a silences query using a SilencesQuery plugin and return the results.
 * Silences represent current state and are NOT time-range dependent.
 * @param definitions: dashboard definition for a silences query
 */
export function useSilencesQueries(definitions: SilencesQueryDefinition[]): Array<UseQueryResult<SilencesData>> {
  const { getPlugin } = usePluginRegistry();
  const context = useSilencesQueryContext();

  const pluginLoaderResponse = usePlugins(
    'SilencesQuery',
    definitions.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  return useQueries({
    queries: definitions.map((definition, idx) => {
      const plugin = pluginLoaderResponse[idx]?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ context, definition, plugin });
      const silencesQueryKind = definition?.spec?.plugin?.kind;
      return {
        enabled: queryEnabled,
        queryKey: queryKey,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 60_000,
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<SilencesData> => {
          const plugin = await getPlugin(SILENCES_QUERY_KEY, silencesQueryKind);
          const data = await plugin.getSilencesData(definition.spec.plugin.spec, context, signal);
          return data;
        },
      };
    }),
  });
}

function getQueryOptions({
  plugin,
  definition,
  context,
}: {
  plugin?: SilencesQueryPlugin;
  definition: SilencesQueryDefinition;
  context: SilencesQueryContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { variableState } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);
  // Note: no absoluteTimeRange in query key since silences are current state
  const queryKey = ['query', SILENCES_QUERY_KEY, definition, variablesValueKey] as const;

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

function useSilencesQueryContext(): SilencesQueryContext {
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    variableState,
    datasourceStore,
  };
}
