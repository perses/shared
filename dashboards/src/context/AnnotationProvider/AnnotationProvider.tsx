import { createContext, ReactNode, useContext, useMemo } from 'react';
import {
  AnnotationData,
  AnnotationDefinition,
  VariableDefinition,
} from '@perses-dev/spec';
import { useAnnotations } from '@perses-dev/plugin-system';
import { UseQueryResult } from '@tanstack/react-query';

export type AnnotationState = {
  definition: AnnotationDefinition;
  data: AnnotationData | null;
  isPending: boolean;
  error?: unknown | null;
};

export type AnnotationStateMap = {
  [name: string]: AnnotationState;
};

export function useHydrateAnnotationDefinitions(definitions: AnnotationDefinition[]): AnnotationStateMap {
  const annotations: Array<UseQueryResult<AnnotationData>> = useAnnotations(definitions);

  return useMemo(() => {
    const result: AnnotationStateMap = {};

    for (const [index, definition] of definitions.entries()) {
      const query = annotations[index] ?? null;
      if (query) {
        result[definition.spec.display.name] = {
          definition,
          data: query.data ?? null,
          isPending: query.isLoading,
          error: query?.error ?? null,
        };
      }
    }

    return result;
  }, [annotations, definitions]);
}

const AnnotationDefinitionContext = createContext<AnnotationStateMap | undefined>(undefined);

export interface AnnotationProviderProps {
  children: ReactNode;
  initialAnnotations?: AnnotationDefinition[];
}

export function AnnotationRuntimeProvider({ children, initialAnnotations = [] }: AnnotationProviderProps): ReactNode {
  // TODO: will be used for hydrating store states
  // executing useQuery here on annotations
  // infinite refresh loop ?
  //
  const state: AnnotationStateMap = useHydrateAnnotationDefinitions(initialAnnotations);

  return <AnnotationDefinitionContext.Provider value={state}>{children}</AnnotationDefinitionContext.Provider>;
}

export function AnnotationProvider({ children, initialAnnotations = [] }: AnnotationProviderProps): ReactNode {
  // TODO: refactor to use a store
  const state: AnnotationStateMap = useHydrateAnnotationDefinitions(initialAnnotations);

  return <AnnotationDefinitionContext.Provider value={state}>{children}</AnnotationDefinitionContext.Provider>;
}

export function useAnnotationStateMap(): AnnotationStateMap {
  const ctx = useContext(AnnotationDefinitionContext);
  if (ctx === undefined) {
    throw new Error('No AnnotationDefinitionContext found. Did you forget a provider?');
  }
  return ctx;
}

export function setAnnotationDefinitions(definitions: VariableDefinition[]): void {
  const newAnnotations = useHydrateAnnotationDefinitions(definitions);
}
