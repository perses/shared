import { createContext, ReactNode, useContext, useMemo } from 'react';
import { AnnotationData, AnnotationDefinition } from '@perses-dev/core';
import { useAnnotations } from '@perses-dev/plugin-system';

// type AnnotationDefinitionStore = {
//   annotationDefinitions: AnnotationDefinition[];
//   setAnnotationDefinitions: (annotations: AnnotationDefinition[]) => void;
//   annotationState: AnnotationStoreStateMap;
//   setAnnotationLoading: (name: string, loading: boolean) => void;
//   setAnnotationValue: (name: string, loading: boolean) => void;
// };
//
// const AnnotationDefinitionStoreContext = createContext<StoreApi<AnnotationDefinitionStore> | undefined>(undefined);

// interface AnnotationDefinitionStoreArgs {
//   initialAnnotations: AnnotationDefinition[];
// }
//
// function createAnnotationStore({
//   initialAnnotations,
// }: AnnotationDefinitionStoreArgs): StoreApi<AnnotationDefinitionStore> {
//   const store = createStore<AnnotationDefinitionStore>()(
//     devtools(
//       immer((set) => ({
//         annotationDefinitions: initialAnnotations,
//         annotationState: hydrateAnnotationDefinitionStates(initialAnnotations),
//         setAnnotationDefinitions(definitions: AnnotationDefinition[]): void {
//           set(
//             (state) => {
//               state.annotationDefinitions = definitions;
//               state.annotationState = hydrateAnnotationDefinitionStates(definitions);
//             },
//             false,
//             '[Annotations] setAnnotationDefinitions' // Used for action name in Redux devtools
//           );
//         },
//         setAnnotationLoading(name: string, loading: boolean): void {
//           set(
//             (state) => {
//               const annoState = state.annotationState.get({ name });
//               if (!annoState) {
//                 return;
//               }
//               annoState.loading = loading;
//             },
//             false,
//             '[Annotations] setAnnotationLoading'
//           );
//         },
//         setAnnotationValue: (name: string, value: AnnotationValue): void =>
//           set(
//             (state) => {
//               const varState = state.annotationState.get({ name });
//               if (!varState) {
//                 return;
//               }
//
//               varState.value = value;
//             },
//             false,
//             '[Annotations] setAnnotationValue'
//           ),
//       }))
//     )
//   );
//   return store satisfies StoreApi<AnnotationDefinitionStore>;
// }

// function getQueryOptions({plugin, defintion, context}: {plugin?: AnnotationPlugin; definition: AnnotationDefinition; context: AnnotationContext}): {
//   queryKey: QueryKey;
//   queryEnabled: boolean;
// } {
//
//
//
//  return { queryKey: [], queryEnabled: false };
// }
//
// export function useAnnotationState(definitions: AnnotationDefinition[]): AnnotationStateMap {
//   const pluginLoaderResponse = usePlugins('Annotation', definitions.map(definition => ({ kind: definition.spec.plugin.kind })));
//
//   return useQueries({
//     queries: definitions.map((definition, idx) => {
//       const plugin = pluginLoaderResponse[idx]?.data;
//       const { queryEnabled, queryKey } = getQueryOptions({ definition, plugin });
//       const annotationKind = definition?.spec?.plugin?.kind;
//       return {
//         enabled: queryEnabled,
//         queryKey: queryKey,
//         refetchOnMount: false,
//         refetchOnWindowFocus: false,
//         refetchOnReconnect: false,
//         staleTime: Infinity,
//         queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<AnnotationData> => {
//           const plugin = await getPlugin(ANNOTATION_KEY, annotationKind);
//           const data = await plugin.getAnnotationData(definition.spec.plugin.spec, context, signal);
//           return data;
//         },
//     }
//   })})
//
//   const annotationValues = useQueries({
//     queries: definitions.map((definition) => {
//       return {
//         queryKey: ['annotationData', definition.spec.display.name], // todo: check key
//         queryFn: async (): Promise<AnnotationData> => {
//           const resp = await variablePlugin?.getVariableOptions(spec, { datasourceStore, variables, timeRange }, signal);
//           if (!resp?.data?.length) {
//             return [];
//           }
//         },
//       };
//     }),
//   });
//
//   const state: AnnotationStateMap = useMemo(() => {
//     const stateMap: AnnotationStateMap = {};
//
//     for (const annotationQuery of annotationValues) {
//       const definition = definitions.find((def => def.spec.display.name === annotationQuery.queryKey[1]);
//       if (definition === undefined) {
//         continue;
//       }
//       const name = definition.spec.display.name;
//       const annotationState: AnnotationState = {
//         value: annotationQuery.data ?? null,
//         loading: annotationQuery.isLoading,
//       };
//       stateMap[name] = annotationState;
//     }
//
//     return stateMap;
//   }, [definitions, annotationValues]);
// }

export type AnnotationState = {
  definition: AnnotationDefinition;
  data: AnnotationData | null;
  isPending: boolean;
  error?: Error | null;
};

export type AnnotationStateMap = {
  [name: string]: AnnotationState;
};

const AnnotationDefinitionContext = createContext<AnnotationStateMap | undefined>(undefined);

export interface AnnotationProviderProps {
  children: ReactNode;
  initialAnnotations?: AnnotationDefinition[];
}

export function AnnotationProvider({ children, initialAnnotations = [] }: AnnotationProviderProps): ReactNode {
  const annotations = useAnnotations(initialAnnotations);

  // TODO: check if it is better to create state in provider or in a custom hook?
  const state: AnnotationStateMap = useMemo(() => {
    const result: AnnotationStateMap = {};

    for (const [index, definition] of initialAnnotations.entries()) {
      const query = annotations[index] ?? null;
      if (query) {
        result[definition.spec.display.name] = {
          definition,
          data: query.data ?? null,
          isPending: query.isLoading,
          error: query.error ?? null,
        };
      }
    }

    return result;
  }, [annotations, initialAnnotations]);

  return <AnnotationDefinitionContext.Provider value={state}>{children}</AnnotationDefinitionContext.Provider>;
}

export function useAnnotationStateMap(): AnnotationStateMap {
  const ctx = useContext(AnnotationDefinitionContext);
  if (ctx === undefined) {
    throw new Error('No AnnotationDefinitionContext found. Did you forget a provider?');
  }
  return ctx;
}
