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
import { usePlugin, usePlugins } from './plugin-registry';
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
  definition,
  context,
}: {
  plugin?: AnnotationPlugin;
  definition: AnnotationSpec;
  context: AnnotationContext;
}): UseQueryOptions<AnnotationData[]> {
  const { variableState, absoluteTimeRange } = context;
  const dependencies = plugin?.dependsOn?.(definition.plugin.spec, context);
  const filteredVariableState = filterVariableStateMap(variableState, dependencies?.variables);
  const variablesValueKey = getVariableValuesKey(filteredVariableState);
  // Only declared variable dependencies delay the query, like other query plugins.
  const waitToLoad = dependencies?.variables?.some((name) => variableState[name]?.loading) ?? false;

  return {
    // ['annotation', spec] prefix: refreshed by TimeRangeProvider and invalidated by the annotation editor preview.
    queryKey: ['annotation', definition, absoluteTimeRange, variablesValueKey],
    enabled: plugin !== undefined && !waitToLoad,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    queryFn: async ({ signal }): Promise<AnnotationData[]> => {
      if (plugin === undefined) {
        throw new Error('Expected annotation plugin to be loaded');
      }
      const data = await plugin.getAnnotationData(definition.plugin.spec, context, signal);
      return data;
    },
  };
}

/**
 * Resolves annotation specs through the shared query cache. Panels requesting the same spec,
 * absolute time range, and variable values share both in-flight requests and cached data with previews.
 */
export function useAnnotations(definitions: AnnotationSpec[]): Array<UseQueryResult<AnnotationData[]>> {
  const context = useAnnotationContext();

  const pluginLoaderResponse = usePlugins(
    'Annotation',
    definitions.map((d) => ({
      kind: d.plugin.kind,
      version: d.plugin.metadata?.version,
      registry: d.plugin.metadata?.registry,
    })),
  );

  return useQueries({
    queries: definitions.map((definition, index) =>
      getQueryOptions({ context, definition, plugin: pluginLoaderResponse[index]?.data }),
    ),
  });
}

/**
 * Resolves one annotation spec using the same cache and fetch policy as {@link useAnnotations}.
 * Used by annotation previews; also exposes loading, error, and refetch state to individual consumers.
 */
export function useAnnotationData(spec: AnnotationSpec): UseQueryResult<AnnotationData[]> {
  const { data: plugin } = usePlugin(ANNOTATION_KEY, spec.plugin.kind, {
    version: spec.plugin.metadata?.version,
    registry: spec.plugin.metadata?.registry,
  });
  const context = useAnnotationContext();

  return useQuery(getQueryOptions({ plugin, definition: spec, context }));
}
