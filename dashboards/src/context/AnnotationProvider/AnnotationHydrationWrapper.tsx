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

import { useAnnotations } from '@perses-dev/plugin-system';
import { AnnotationData } from '@perses-dev/spec';
import { UseQueryResult } from '@tanstack/react-query';
import { ReactNode, useEffect } from 'react';

import { useAnnotationActions, useAnnotationSpecs } from './AnnotationProvider';

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
  const annotationSpecs = useAnnotationSpecs();
  const { setAnnotationState } = useAnnotationActions();
  const annotations: Array<UseQueryResult<AnnotationData[]>> = useAnnotations(annotationSpecs);

  useEffect(() => {
    for (const [index, definition] of annotationSpecs.entries()) {
      const query = annotations[index] ?? null;
      if (query) {
        setAnnotationState(definition.display.name, {
          data: query.data ?? null,
          isPending: query.isLoading,
          error: (query?.error as Error) ?? null,
        });
      }
    }
  }, [annotationSpecs, annotations, setAnnotationState]);

  return <>{children}</>;
}
