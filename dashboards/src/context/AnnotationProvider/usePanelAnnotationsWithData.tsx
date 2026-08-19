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
import { AnnotationSpec } from '@perses-dev/spec';
import { useMemo } from 'react';

import { AnnotationSpecWithData, useAnnotationsWithData } from './AnnotationProvider';

/**
 * Returns the annotations to display on a single panel:
 *  - the dashboard-level annotations from the store (every panel receives these)
 *  - the panel-local annotations, resolved on the fly through the same runtime hook that
 *    hydrates dashboard annotations
 */
export function usePanelAnnotationsWithData(panelAnnotations?: AnnotationSpec[]): AnnotationSpecWithData[] {
  const dashboardAnnotations = useAnnotationsWithData();

  const localDefinitions = useMemo(() => panelAnnotations ?? [], [panelAnnotations]);
  const localResults = useAnnotations(localDefinitions);

  return useMemo(() => {
    const result: AnnotationSpecWithData[] = [...dashboardAnnotations];
    localDefinitions.forEach((definition, index) => {
      const data = localResults[index]?.data;
      if (data) {
        result.push({ definition, data });
      }
    });
    return result;
  }, [dashboardAnnotations, localDefinitions, localResults]);
}
