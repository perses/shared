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

import { JsonData, QueryDefinition, UnknownSpec } from '@perses-dev/spec';
import { useQueries, UseQueryResult } from '@tanstack/react-query';

import { useDatasourceStore } from './datasources';
import { usePluginRegistry } from './plugin-registry';
import { useVariableValues } from './variables';

export type JsonQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'JsonQuery', PluginSpec>;
export const JSON_QUERY_KEY = 'JsonQuery';

export function useJsonQueries(definitions: JsonQueryDefinition[]): Array<UseQueryResult<JsonData>> {
  const { getPlugin } = usePluginRegistry();
  const datasourceStore = useDatasourceStore();
  const variableValues = useVariableValues();

  const context = {
    variableState: variableValues,
    datasourceStore,
  };

  return useQueries({
    queries: definitions.map((definition) => {
      const queryKey = ['query', JSON_QUERY_KEY, definition, variableValues] as const;
      const jsonQueryKind = definition?.spec?.plugin?.kind;
      return {
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
