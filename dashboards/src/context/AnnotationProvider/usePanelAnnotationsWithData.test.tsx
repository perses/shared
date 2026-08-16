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

import { ReactElement, ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { AnnotationSpec } from '@perses-dev/spec';
import { AnnotationProvider, usePanelAnnotationsWithData } from '@perses-dev/dashboards';

// Resolve every annotation definition to a single data point derived from its name, so both the
// dashboard hydration and the panel-local resolution go through the same predictable stub.
jest.mock('@perses-dev/plugin-system', () => {
  const actual = jest.requireActual('@perses-dev/plugin-system');
  return {
    ...actual,
    useAnnotations: (definitions: AnnotationSpec[]): Array<{ data: Array<{ start: number; title: string }> }> =>
      definitions.map((d) => ({ data: [{ start: 1, title: d.display.name }] })),
  };
});

const dashboardDefinition: AnnotationSpec = {
  display: { name: 'Deploys' },
  plugin: { kind: 'FirstAnnotation', spec: {} },
};

const panelDefinition: AnnotationSpec = {
  display: { name: 'Incidents' },
  plugin: { kind: 'FirstAnnotation', spec: {} },
};

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return <AnnotationProvider initialAnnotationSpecs={[dashboardDefinition]}>{children}</AnnotationProvider>;
}

function renderPanelHook(panelAnnotations?: AnnotationSpec[]): { current: string[] } {
  const { result } = renderHook(
    () => usePanelAnnotationsWithData(panelAnnotations).map((a) => a.definition.display.name),
    {
      wrapper,
    }
  );
  return result;
}

describe('usePanelAnnotationsWithData', () => {
  it('returns dashboard annotations when the panel has no annotations', async () => {
    const result = renderPanelHook(undefined);
    await waitFor(() => expect(result.current).toEqual(['Deploys']));
  });

  it('returns dashboard annotations when the panel annotations list is empty', async () => {
    const result = renderPanelHook([]);
    await waitFor(() => expect(result.current).toEqual(['Deploys']));
  });

  it('merges dashboard annotations with panel-local annotations', async () => {
    const result = renderPanelHook([panelDefinition]);
    await waitFor(() => expect(result.current).toEqual(['Deploys', 'Incidents']));
  });
});
