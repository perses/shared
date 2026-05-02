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

import { AlertsData, QueryDefinition, UnknownSpec } from '@perses-dev/spec';
import { QueryKey, useQueries, UseQueryResult } from '@tanstack/react-query';
import { AlertsQueryContext, AlertsQueryPlugin } from '../model';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import { useAllVariableValues } from './variables';
import { filterVariableStateMap, getVariableValuesKey } from './utils';

export type AlertsQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'AlertsQuery', PluginSpec>;
export const ALERTS_QUERY_KEY = 'AlertsQuery';

/**
 * Run an alerts query using an AlertsQuery plugin and return the results.
 * Alerts represent current state and are NOT time-range dependent.
 * @param definitions: dashboard definition for an alerts query
 */
export function useAlertsQueries(definitions: AlertsQueryDefinition[]): Array<UseQueryResult<AlertsData>> {
  const { getPlugin } = usePluginRegistry();
  const context = useAlertsQueryContext();

  const pluginLoaderResponse = usePlugins(
    'AlertsQuery',
    definitions.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  return useQueries({
    queries: definitions.map((definition, idx) => {
      const plugin = pluginLoaderResponse[idx]?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ context, definition, plugin });
      const alertsQueryKind = definition?.spec?.plugin?.kind;
      return {
        enabled: queryEnabled,
        queryKey: queryKey,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 60_000,
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<AlertsData> => {
          const plugin = await getPlugin(ALERTS_QUERY_KEY, alertsQueryKind);
          const data = await plugin.getAlertsData(definition.spec.plugin.spec, context, signal);
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
  plugin?: AlertsQueryPlugin;
  definition: AlertsQueryDefinition;
  context: AlertsQueryContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { variableState } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);
  // Note: no absoluteTimeRange in query key since alerts are current state
  const queryKey = ['query', ALERTS_QUERY_KEY, definition, variablesValueKey] as const;

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

function useAlertsQueryContext(): AlertsQueryContext {
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    variableState,
    datasourceStore,
  };
}
