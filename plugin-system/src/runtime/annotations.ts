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

import { AnnotationData, AnnotationSpec } from '@perses-dev/spec';
import { QueryKey, useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';
import { AnnotationContext, AnnotationPlugin } from '../model';
import { filterVariableList } from '../components';
import { usePlugin, usePluginRegistry, usePlugins } from './plugin-registry';
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
  definition: AnnotationSpec;
  context: AnnotationContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { variableState, absoluteTimeRange } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.plugin.spec, context) : {};
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

export function useAnnotations(definitions: AnnotationSpec[]): Array<UseQueryResult<AnnotationData[]>> {
  const { getPlugin } = usePluginRegistry();
  const context = useAnnotationContext();

  const pluginLoaderResponse = usePlugins(
    'Annotation',
    definitions.map((d) => ({ kind: d.plugin.kind }))
  );

  // useQueries() handles data fetching from query plugins (e.g. traceQL queries, promQL queries)
  return useQueries({
    queries: definitions.map((definition, idx) => {
      const plugin = pluginLoaderResponse[idx]?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ context, definition, plugin });
      const annotationKind = definition?.plugin?.kind;
      return {
        enabled: queryEnabled,
        queryKey: queryKey,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<AnnotationData[]> => {
          const plugin = await getPlugin(ANNOTATION_KEY, annotationKind);
          const data = await plugin.getAnnotationData(definition.plugin.spec, context, signal);
          return data;
        },
      };
    }),
  });
}

export function useAnnotationData(spec: AnnotationSpec): UseQueryResult<AnnotationData[]> {
  const { data: annotationPlugin } = usePlugin('Annotation', spec.plugin.kind);

  const datasourceStore = useDatasourceStore();
  const allVariables = useAllVariableValues();
  const { absoluteTimeRange: timeRange } = useTimeRange();
  const variablePluginCtx = { absoluteTimeRange: timeRange, datasourceStore, variableState: allVariables };

  let dependsOnVariables: string[] = Object.keys(allVariables); // Default to all variables
  if (annotationPlugin?.dependsOn) {
    const dependencies = annotationPlugin.dependsOn(spec.plugin.spec, variablePluginCtx);
    dependsOnVariables = dependencies.variables ? dependencies.variables : dependsOnVariables;
  }

  const variables = useAllVariableValues(dependsOnVariables);

  let waitToLoad = false;
  if (dependsOnVariables) {
    waitToLoad = dependsOnVariables.some((v) => variables[v]?.loading);
  }

  const variablesValueKey = getVariableValuesKey(variables);

  return useQuery({
    queryKey: ['annotation', spec, timeRange, variablesValueKey],
    queryFn: async ({ signal }) => {
      const resp = await annotationPlugin?.getAnnotationData(
        spec.plugin.spec,
        { ...variablePluginCtx, variableState: variables },
        signal
      );
      if (!resp?.length) {
        return [];
      }
      return resp;
    },
    enabled: !!annotationPlugin || waitToLoad,
  });
}
