import { ReactNode, useMemo } from 'react';
import { AnnotationData } from '@perses-dev/spec';
import { AnnotationStateMap, useAnnotationActions, useAnnotationDefinitions } from '@perses-dev/dashboards';
import { useAnnotations } from '@perses-dev/plugin-system';
import { UseQueryResult } from '@tanstack/react-query';

// export function useHydrateAnnotationDefinitions(definitions: AnnotationDefinition[]): AnnotationStateMap {
//   const annotations: Array<UseQueryResult<AnnotationData[]>> = useAnnotations(definitions);
//
//   return useMemo(() => {
//     const result: AnnotationStateMap = {};
//
//     for (const [index, definition] of definitions.entries()) {
//       const query = annotations[index] ?? null;
//       if (query) {
//         result[definition.spec.display.name] = {
//           data: query.data ?? null,
//           isPending: query.isLoading,
//           error: (query?.error as Error) ?? null,
//         };
//       }
//     }
//
//     return result;
//   }, [annotations, definitions]);
// }

interface AnnotationHydrationWrapperProps {
  children: ReactNode;
}

/*
 * This component is responsible for hydrating the annotation states in the store.
 * It should be used inside the AnnotationProvider, and will fetch the annotations data and update the store accordingly.
 *
 * Contrary to VariableProvider that is hydrating variable state at input component level, annotations don't have component
 * that can trigger the hydration manually, so we need to do it at provider level.
 */
export function AnnotationHydrationWrapper({ children }: AnnotationHydrationWrapperProps): ReactNode {
  const annotationDefinitions = useAnnotationDefinitions();
  const { setAnnotationState } = useAnnotationActions();
  const annotations: Array<UseQueryResult<AnnotationData[]>> = useAnnotations(annotationDefinitions);

  useMemo(() => {
    const result: AnnotationStateMap = {};

    for (const [index, definition] of annotationDefinitions.entries()) {
      const query = annotations[index] ?? null;
      if (query) {
        setAnnotationState(definition.spec.display.name, {
          data: query.data ?? null,
          isPending: query.isLoading,
          error: (query?.error as Error) ?? null,
        });
      }
    }

    return result;
  }, [annotationDefinitions, annotations, setAnnotationState]);

  return <>{children}</>;
}
