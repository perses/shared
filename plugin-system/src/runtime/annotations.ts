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

import { AnnotationData, AnnotationDefinition } from '@perses-dev/core';
import { QueryKey, useQueries, UseQueryResult } from '@tanstack/react-query';
import { AnnotationContext, AnnotationPlugin } from '../model/annotations';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
import { useAllVariableValues } from './variables';
import { useDatasourceStore } from './datasources';
import { filterVariableStateMap, getVariableValuesKey } from './utils';
//
// export type AnnotationState = {
//   value: AnnotationData | null;
//   loading: boolean;
//   error?: Error;
// };
//
// export type AnnotationStateMap = Record<string, AnnotationState>;
//
// /**
//  * Structure used as key in the {@link AnnotationStoreStateMap}.
//  */
// export type AnnotationStateKey = {
//   /**
//    * name of the annotation we want to access in the state.
//    */
//   name: string;
// };

// /**
//  * A state map with two entry keys, materialized by {@link AnnotationStateKey} structure.
//  */
// export class AnnotationStoreStateMap {
//   /**
//    * "Immerable" is mandatory to be able to use this class in an immer context.
//    * Ref: https://docs.pmnd.rs/zustand/integrations/immer-middleware#gotchas
//    */
//   [immerable] = true;
//
//   private readonly _state: Record<string, AnnotationState> = {};
//
//   /**
//    * Get annotation state by key.
//    * @param key
//    */
//   get(key: AnnotationStateKey): AnnotationState | undefined {
//     return this._state[key.name];
//   }
//
//   /**
//    * Set annotation state by key.
//    * @param key
//    * @param value
//    */
//   set(key: AnnotationStateKey, value: AnnotationState): AnnotationState | undefined {
//     this._state[key.name] = value;
//     return value;
//   }
//
//   /**
//    * Check presence of annotation state by key.
//    * @param key
//    */
//   has(key: AnnotationStateKey): boolean {
//     return this._state[key.name] !== undefined;
//   }
//
//   /**
//    * Delete annotation state by key.
//    * @param key
//    */
//   delete(key: AnnotationStateKey): boolean {
//     const result = this.has(key);
//     // Delete source state from state if empty
//     delete this._state[key.name];
//
//     return result;
//   }
// }
//
// export type AnnotationSrv = {
//   state: AnnotationStateMap;
// };
//
// export const AnnotationContext = createContext<AnnotationSrv | undefined>(undefined);
//
// function useAnnotationContext(): AnnotationSrv {
//   const ctx = useContext(AnnotationContext);
//   if (ctx === undefined) {
//     throw new Error('No AnnotationContext found. Did you forget a Provider?');
//   }
//   return ctx;
// }
//
// export function useAnnotationValues(names?: string[]): AnnotationStateMap {
//   const { state } = useAnnotationContext();
//
//   const values = useMemo(() => {
//     const values: AnnotationStateMap = {};
//     names?.forEach((name) => {
//       const s = state[name];
//       if (s) {
//         values[name] = s;
//       }
//     });
//     return values;
//   }, [state, names]);
//
//   if (names === undefined) {
//     return state;
//   }
//
//   return values;
// }

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
        queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<AnnotationData> => {
          const plugin = await getPlugin(ANNOTATION_KEY, annotationKind);
          const data = await plugin.getAnnotationData(definition.spec.plugin.spec, context, signal);
          return data;
        },
      };
    }),
  });
}
