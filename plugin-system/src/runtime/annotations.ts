// Copyright 2024 The Perses Authors
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

import { AnnotationData, AnnotationDefinition } from '@perses-dev/spec';
import { QueryKey, useQueries, UseQueryResult } from '@tanstack/react-query';
import { AnnotationContext, AnnotationPlugin } from '../model/annotations';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
import { useAllVariableValues } from './variables';
import { useDatasourceStore } from './datasources';
import { filterVariableStateMap, getVariableValuesKey } from './utils';

export const ANNOTATION_KEY = 'Annotation';

function useAnnotationContext(): AnnotationContext {
  const { absoluteTimeRange } = useTimeRange();
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    variableState,
    datasourceStore,
    absoluteTimeRange,
  };
}

function getQueryOptions({
  plugin,
  definition,
  context,
}: {
  plugin?: AnnotationPlugin;
  definition: AnnotationDefinition;
  context: AnnotationContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { variableState, absoluteTimeRange } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);
  const queryKey = [ANNOTATION_KEY, definition, absoluteTimeRange, variablesValueKey] as const;

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

export function useAnnotations(definitions: AnnotationDefinition[]): Array<UseQueryResult<AnnotationData[]>> {
  const { getPlugin } = usePluginRegistry();
  const context = useAnnotationContext();

  const pluginLoaderResponse = usePlugins(
    'Annotation',
    definitions.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  // useQueries() handles data fetching from query plugins (e.g. traceQL queries, promQL queries)
  return useQueries({
    queries: definitions.map((definition, idx) => {
      const plugin = pluginLoaderResponse[idx]?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ context, definition, plugin });
      const annotationKind = definition?.spec?.plugin?.kind;
      return {
        enabled: queryEnabled,
        queryKey: queryKey,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<AnnotationData[]> => {
          const plugin = await getPlugin(ANNOTATION_KEY, annotationKind);
          const data = await plugin.getAnnotationData(definition.spec.plugin.spec, context, signal);
          return data;
        },
      };
    }),
  });
}
