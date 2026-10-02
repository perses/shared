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
import type { AnnotationSpec } from '@perses-dev/spec';
import { useMemo } from 'react';

import { getAnnotationSpecsWithData } from './annotation-data';
import type { AnnotationSpecWithData } from './AnnotationProvider';
import { useAnnotationSpecs } from './AnnotationProvider';

/** Resolves the visible annotations among the given specs. Hidden annotations are not fetched. */
function useVisibleAnnotationsWithData(definitions: AnnotationSpec[] | undefined): AnnotationSpecWithData[] {
  const visibleDefinitions = (definitions ?? []).filter((definition) => !definition.display.hidden);
  const queries = useAnnotations(visibleDefinitions);
  return getAnnotationSpecsWithData(visibleDefinitions, queries);
}

/**
 * Returns the annotations to display on a single panel:
 *  - dashboard-level annotations (every panel receives these)
 *  - panel-local annotations from `PanelProps.definition?.spec.annotations`
 *
 * Hidden annotations (`display.hidden`) are skipped and never fetched.
 * Data is fetched on demand through the shared query cache, including annotation previews.
 * Each result pairs the complete annotation spec (`definition`) with its available `data`.
 */
export function usePanelAnnotationsWithData(panelAnnotations?: AnnotationSpec[]): AnnotationSpecWithData[] {
  const dashboardDefinitions = useAnnotationSpecs();
  const dashboardAnnotations = useVisibleAnnotationsWithData(dashboardDefinitions);
  const localAnnotations = useVisibleAnnotationsWithData(panelAnnotations);
  return useMemo(() => [...dashboardAnnotations, ...localAnnotations], [dashboardAnnotations, localAnnotations]);
}
