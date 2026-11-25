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

import type { JsonData, QueryDefinition, UnknownSpec } from '@perses-dev/spec';
import type { QueryObserverOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';

import type { JsonQueryContext } from '../model/json-queries';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry } from './plugin-registry';
import { useVariableValues } from './variables';

export type JsonQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'JsonQuery', PluginSpec>;
export const JSON_QUERY_KEY = 'JsonQuery';

/**
 * Run a json query using a JsonQuery plugin and return the results.
 * A json query returns an arbitrary JSON payload and is NOT time-range dependent.
 * @param definitions: dashboard definitions for the json queries to run
 * @param queryOptions: set `enabled` to false to prevent the queries from running
 */
export function useJsonQueries(
  definitions: JsonQueryDefinition[],
  queryOptions?: Pick<QueryObserverOptions, 'enabled'>,
): Array<UseQueryResult<JsonData>> {
  const { getPlugin } = usePluginRegistry();
  const datasourceStore = useDatasourceStore();
  const variableValues = useVariableValues();

  const context: JsonQueryContext = {
    variableState: variableValues,
    datasourceStore,
  };

  return useQueries({
    queries: definitions.map((definition) => {
      const queryKey = ['query', JSON_QUERY_KEY, definition, variableValues] as const;
      const jsonQueryKind = definition?.spec?.plugin?.kind;
      return {
        enabled: queryOptions?.enabled ?? true,
        queryKey,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<JsonData> => {
          const plugin = await getPlugin({ kind: JSON_QUERY_KEY, name: jsonQueryKind });
          return plugin.getJsonData(definition.spec.plugin.spec, context, signal);
        },
        structuralSharing: false,
      };
    }),
  });
}
