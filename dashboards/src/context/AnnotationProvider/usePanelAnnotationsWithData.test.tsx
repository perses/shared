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

import {
  AnnotationProvider,
  useAnnotationActions,
  useAnnotationSpecs,
  useAnnotationSpecAndState,
  useAnnotationsWithData,
  usePanelAnnotationsWithData,
} from '@perses-dev/dashboards';
import type * as PluginSystemModule from '@perses-dev/plugin-system';
import type { AnnotationData, AnnotationSpec } from '@perses-dev/spec';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

const { resolveAnnotations } = vi.hoisted(() => ({
  resolveAnnotations: vi.fn<
    (definitions: AnnotationSpec[]) => Array<{
      data?: AnnotationData[];
      isLoading?: boolean;
      error?: Error;
    }>
  >(),
}));

vi.mock('@perses-dev/plugin-system', async () => {
  const actual = await vi.importActual<typeof PluginSystemModule>('@perses-dev/plugin-system');
  return { ...actual, useAnnotations: resolveAnnotations };
});

beforeEach(() => {
  // Like react-query, keep the same `data` reference for a given annotation across renders.
  const dataByName = new Map<string, AnnotationData[]>();
  resolveAnnotations.mockReset().mockImplementation((definitions) =>
    definitions.map((definition) => {
      const name = definition.display.name;
      const data = dataByName.get(name) ?? [{ start: 1, title: name }];
      dataByName.set(name, data);
      return { data };
    }),
  );
});

const dashboardDefinition: AnnotationSpec = {
  display: { name: 'Deploys' },
  plugin: { kind: 'FirstAnnotation', spec: {} },
};

const panelDefinition: AnnotationSpec = {
  display: { name: 'Incidents' },
  plugin: { kind: 'FirstAnnotation', spec: {} },
};

const dashboardDefinitions = [dashboardDefinition];

const hiddenDashboardDefinition: AnnotationSpec = {
  display: { name: 'Maintenance', hidden: true },
  plugin: { kind: 'FirstAnnotation', spec: {} },
};

const hiddenPanelDefinition: AnnotationSpec = {
  display: { name: 'Alerts', hidden: true },
  plugin: { kind: 'FirstAnnotation', spec: {} },
};

const dashboardDefinitionsWithHidden = [dashboardDefinition, hiddenDashboardDefinition];

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return <AnnotationProvider initialAnnotationSpecs={dashboardDefinitions}>{children}</AnnotationProvider>;
}

function wrapperWithHidden({ children }: { children: ReactNode }): ReactElement {
  return <AnnotationProvider initialAnnotationSpecs={dashboardDefinitionsWithHidden}>{children}</AnnotationProvider>;
}

function getRequestedNames(): string[] {
  return resolveAnnotations.mock.calls.flatMap(([definitions]) =>
    definitions.map((definition) => definition.display.name),
  );
}

function renderPanelHook(panelAnnotations?: AnnotationSpec[]): { current: string[] } {
  const { result } = renderHook(
    () => usePanelAnnotationsWithData(panelAnnotations).map((a) => a.definition.display.name),
    {
      wrapper,
    },
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

  it('does not fetch annotations when only specs are consumed', () => {
    const { result } = renderHook(() => useAnnotationSpecs(), { wrapper });
    expect(result.current).toEqual([dashboardDefinition]);
    expect(resolveAnnotations).not.toHaveBeenCalled();
  });

  it('returns panel-local specs and data without a dashboard provider', () => {
    const { result } = renderHook(() => usePanelAnnotationsWithData([panelDefinition]));
    expect(result.current).toEqual([{ definition: panelDefinition, data: [{ start: 1, title: 'Incidents' }] }]);
  });

  it('resolves updated dashboard specs without retaining removed annotations', () => {
    const { result } = renderHook(
      () => ({
        annotations: usePanelAnnotationsWithData(),
        actions: useAnnotationActions(),
      }),
      { wrapper },
    );
    act(() => result.current.actions.setAnnotationSpecs([panelDefinition]));
    expect(result.current.annotations).toEqual([
      { definition: panelDefinition, data: [{ start: 1, title: 'Incidents' }] },
    ]);
  });

  it('preserves empty results and omits annotations with no data yet', () => {
    resolveAnnotations.mockImplementation((definitions) =>
      definitions.map((definition) => (definition.display.name === 'Deploys' ? { isLoading: true } : { data: [] })),
    );
    const { result } = renderHook(() => usePanelAnnotationsWithData([panelDefinition]), { wrapper });
    expect(result.current).toEqual([{ definition: panelDefinition, data: [] }]);
  });

  it('keeps the same empty array across renders while no annotation has data', () => {
    resolveAnnotations.mockImplementation((definitions) => definitions.map(() => ({ isLoading: true })));
    const { result, rerender } = renderHook(() => usePanelAnnotationsWithData([panelDefinition]), { wrapper });
    const firstResult = result.current;
    expect(firstResult).toEqual([]);
    rerender();
    expect(result.current).toBe(firstResult);
  });

  it('keeps the same array across renders while specs and data are unchanged', () => {
    const { result, rerender } = renderHook(() => usePanelAnnotationsWithData([panelDefinition]), { wrapper });
    const firstResult = result.current;
    expect(firstResult).toHaveLength(2);
    rerender();
    expect(result.current).toBe(firstResult);
  });

  it('neither fetches nor returns hidden annotations', () => {
    const panelDefinitions = [panelDefinition, hiddenPanelDefinition];
    const { result } = renderHook(
      () => ({
        names: usePanelAnnotationsWithData(panelDefinitions).map((annotation) => annotation.definition.display.name),
        actions: useAnnotationActions(),
      }),
      { wrapper: wrapperWithHidden },
    );
    expect(result.current.names).toEqual(['Deploys', 'Incidents']);
    expect(getRequestedNames()).not.toContain('Maintenance');
    expect(getRequestedNames()).not.toContain('Alerts');

    act(() =>
      result.current.actions.setAnnotationSpecs([
        dashboardDefinition,
        { ...hiddenDashboardDefinition, display: { name: 'Maintenance', hidden: false } },
      ]),
    );
    expect(result.current.names).toEqual(['Deploys', 'Maintenance', 'Incidents']);
    expect(getRequestedNames()).toContain('Maintenance');
  });

  it('reads loading and error states directly from the query results', () => {
    resolveAnnotations.mockImplementation(() => [{ isLoading: true }]);
    const { result, rerender } = renderHook(() => useAnnotationSpecAndState('Deploys'), { wrapper });
    expect(result.current).toEqual({ definition: dashboardDefinition, state: { data: null, isPending: true } });

    const error = new Error('Request failed');
    resolveAnnotations.mockImplementation(() => [{ isLoading: false, error }]);
    rerender();
    expect(result.current.state).toEqual({ data: null, isPending: false, error });
  });

  it('does not loop when panel specs are rebuilt on every render', () => {
    const { result, rerender } = renderHook(
      () =>
        usePanelAnnotationsWithData([{ display: { name: 'Inline' }, plugin: { kind: 'FirstAnnotation', spec: {} } }]),
      { wrapper },
    );
    const firstResult = result.current;
    expect(firstResult).toHaveLength(2);
    rerender();
    expect(result.current).toBe(firstResult);
  });
});

describe('useAnnotationsWithData', () => {
  it('keeps the same array across renders, including hidden annotations, while specs and data are unchanged', () => {
    const { result, rerender } = renderHook(() => useAnnotationsWithData(), { wrapper: wrapperWithHidden });
    const firstResult = result.current;
    expect(firstResult.map((annotation) => annotation.definition.display.name)).toEqual(['Deploys', 'Maintenance']);
    rerender();
    expect(result.current).toBe(firstResult);
  });
});
