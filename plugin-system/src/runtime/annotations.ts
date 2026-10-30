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

import type { AnnotationData, AnnotationSpec } from '@perses-dev/spec';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries, useQuery } from '@tanstack/react-query';

import type { AnnotationContext, AnnotationPlugin } from '../model';
import { useDatasourceStore } from './datasources';
import type { PluginRegistryContextType } from './plugin-registry';
import { usePlugin, usePluginRegistry, usePlugins } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
import { filterVariableStateMap, getVariableValuesKey } from './utils';
import { useAllVariableValues } from './variables';

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
  pluginLoadFailed,
  getPlugin,
  definition,
  context,
}: {
  plugin?: AnnotationPlugin;
  pluginLoadFailed: boolean;
  getPlugin: PluginRegistryContextType['getPlugin'];
  definition: AnnotationSpec;
  context: AnnotationContext;
}): UseQueryOptions<AnnotationData[]> {
  const { variableState, absoluteTimeRange } = context;
  const dependencies = plugin?.dependsOn?.(definition.plugin.spec, context);
  const variableDependencies = dependencies?.variables;
  const filteredVariableState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariableState);
  // ['annotation', spec] prefix: refreshed by TimeRangeProvider and invalidated by the annotation editor preview.
  const queryKey = ['annotation', definition, absoluteTimeRange, variablesValueKey] as const;
  // Only declared dependencies delay the query; undeclared ones still rerun it through the cache key.
  const waitToLoad = variableDependencies?.some((name) => variableState[name]?.loading) ?? false;
  // Let the query function surface plugin loading errors once variable dependencies are ready.
  const queryEnabled = (plugin !== undefined || pluginLoadFailed) && !waitToLoad;

  return {
    queryKey,
    enabled: queryEnabled,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    structuralSharing: false,
    queryFn: async ({ signal }): Promise<AnnotationData[]> => {
      const queryPlugin = await getPlugin({
        kind: ANNOTATION_KEY,
        name: definition.plugin.kind,
        version: definition.plugin.metadata?.version,
        registry: definition.plugin.metadata?.registry,
      });
      return queryPlugin.getAnnotationData(definition.plugin.spec, context, signal);
    },
  };
}

/**
 * Resolves annotation specs through the shared query cache. Panels requesting the same spec,
 * absolute time range, and variable values share both in-flight requests and cached data with previews.
 */
export function useAnnotations(definitions: AnnotationSpec[]): Array<UseQueryResult<AnnotationData[]>> {
  const { getPlugin } = usePluginRegistry();
  const context = useAnnotationContext();

  const pluginLoaderResponse = usePlugins(
    ANNOTATION_KEY,
    definitions.map(({ plugin }) => ({
      kind: plugin.kind,
      version: plugin.metadata?.version,
      registry: plugin.metadata?.registry,
    })),
  );

  return useQueries({
    queries: definitions.map((definition, index) => {
      const plugin = pluginLoaderResponse[index]?.data;
      const pluginLoadFailed = pluginLoaderResponse[index]?.isError ?? false;
      return getQueryOptions({ plugin, pluginLoadFailed, getPlugin, definition, context });
    }),
  });
}

/**
 * Resolves one annotation spec using the same cache and fetch policy as {@link useAnnotations}.
 * Used by annotation previews; also exposes loading, error, and refetch state to individual consumers.
 */
export function useAnnotationData(spec: AnnotationSpec): UseQueryResult<AnnotationData[]> {
  const { getPlugin } = usePluginRegistry();
  const { data: plugin, isError: pluginLoadFailed } = usePlugin(ANNOTATION_KEY, spec.plugin.kind, {
    version: spec.plugin.metadata?.version,
    registry: spec.plugin.metadata?.registry,
  });
  const context = useAnnotationContext();

  return useQuery(getQueryOptions({ plugin, pluginLoadFailed, getPlugin, definition: spec, context }));
}
