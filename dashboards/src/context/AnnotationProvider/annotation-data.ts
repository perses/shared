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
import type { UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';

import type { AnnotationSpecWithData } from './AnnotationProvider';

// Shared so that consumers keep the same array while no annotation has data, e.g. on dashboards without annotations.
const NO_ANNOTATIONS: AnnotationSpecWithData[] = [];

/** Pairs annotation specs with their available query data, omitting specs without data yet. */
export function getAnnotationSpecsWithData(
  definitions: AnnotationSpec[],
  queries: Array<UseQueryResult<AnnotationData[]>>,
): AnnotationSpecWithData[] {
  const annotations = definitions.flatMap((definition, index) => {
    const data = queries[index]?.data;
    return data ? [{ definition, data }] : [];
  });
  return annotations.length > 0 ? annotations : NO_ANNOTATIONS;
}

// Callers may rebuild specs on every render (e.g. `.map()`): compare by value, otherwise the state update below never settles.
function isSameDefinition(previous: AnnotationSpec, next: AnnotationSpec): boolean {
  return previous === next || JSON.stringify(previous) === JSON.stringify(next);
}

function isSameAnnotations(previous: AnnotationSpecWithData[], next: AnnotationSpecWithData[]): boolean {
  return (
    previous.length === next.length &&
    next.every((annotation, index) => {
      const previousAnnotation = previous[index];
      return (
        previousAnnotation !== undefined &&
        previousAnnotation.data === annotation.data &&
        isSameDefinition(previousAnnotation.definition, annotation.definition)
      );
    })
  );
}

/**
 * Returns the previous annotations while their specs and data are unchanged.
 * `useQueries` returns new arrays and result objects on every render, only `data` keeps its reference.
 */
export function useStableAnnotations(annotations: AnnotationSpecWithData[]): AnnotationSpecWithData[] {
  const [stableAnnotations, setStableAnnotations] = useState(annotations);
  if (isSameAnnotations(stableAnnotations, annotations)) {
    return stableAnnotations;
  }
  setStableAnnotations(annotations);
  return annotations;
}
