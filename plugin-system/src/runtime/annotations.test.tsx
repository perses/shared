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

import type { AbsoluteTimeRange, AnnotationData, AnnotationSpec } from '@perses-dev/spec';
import type { UseQueryResult } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { PluginRegistry } from '../components/PluginRegistry';
import type { AnnotationPlugin } from '../model';
import { mockPluginRegistry } from '../test-utils';
import { useAnnotationData, useAnnotations } from './annotations';
import type { VariableStateMap } from './variables';

const runtime = vi.hoisted(() => ({
  variables: {} as VariableStateMap,
  timeRange: { start: new Date('2026-01-01'), end: new Date('2026-01-02') } as AbsoluteTimeRange,
}));
vi.mock('./variables', () => ({ useAllVariableValues: (): VariableStateMap => runtime.variables }));
vi.mock('./TimeRangeProvider', () => ({
  useTimeRange: (): { absoluteTimeRange: AbsoluteTimeRange } => ({ absoluteTimeRange: runtime.timeRange }),
}));
vi.mock('./datasources', () => ({ useDatasourceStore: (): Record<string, never> => ({}) }));

const definition: AnnotationSpec = {
  display: { name: 'Deploys' },
  plugin: { kind: 'TestAnnotation', spec: {} },
};
const definitionWithoutDependsOn: AnnotationSpec = {
  display: { name: 'Incidents' },
  plugin: { kind: 'PlainAnnotation', spec: {} },
};
const data: AnnotationData[] = [{ start: 1, title: 'Deployment' }];
const getAnnotationData = vi.fn<AnnotationPlugin['getAnnotationData']>();
const dependsOn = vi.fn<NonNullable<AnnotationPlugin['dependsOn']>>();
const plugin: AnnotationPlugin = { createInitialOptions: () => ({}), getAnnotationData, dependsOn };
const pluginWithoutDependsOn: AnnotationPlugin = { createInitialOptions: () => ({}), getAnnotationData };
const registryProps = mockPluginRegistry(
  { kind: 'Annotation', spec: { name: 'TestAnnotation' }, plugin },
  { kind: 'Annotation', spec: { name: 'PlainAnnotation' }, plugin: pluginWithoutDependsOn },
);
let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <PluginRegistry {...registryProps}>{children}</PluginRegistry>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  runtime.variables = {};
  runtime.timeRange = { start: new Date('2026-01-01'), end: new Date('2026-01-02') };
  getAnnotationData.mockReset().mockResolvedValue(data);
  dependsOn.mockReset().mockReturnValue({});
});
afterEach(() => queryClient.clear());

describe('annotation query cache', () => {
  it('shares an in-flight request between panels and the preview', async () => {
    let resolveData: ((data: AnnotationData[]) => void) | undefined;
    const response = new Promise<AnnotationData[]>((resolve) => {
      resolveData = resolve;
    });
    getAnnotationData.mockReturnValue(response);
    const { result } = renderHook(
      () => ({
        firstPanel: useAnnotations([definition])[0],
        secondPanel: useAnnotations([definition])[0],
        preview: useAnnotationData(definition),
      }),
      { wrapper },
    );

    await waitFor(() => expect(getAnnotationData).toHaveBeenCalledTimes(1));
    await act(async () => resolveData?.(data));
    await waitFor(() => {
      expect(result.current.firstPanel?.data).toEqual(data);
      expect(result.current.secondPanel?.data).toBe(result.current.firstPanel?.data);
      expect(result.current.preview.data).toBe(result.current.firstPanel?.data);
    });
    expect(getAnnotationData).toHaveBeenCalledTimes(1);
  });

  it.each(['panel', 'preview'])('reuses data after the first %s unmounts', async (firstConsumer) => {
    const first = renderHook(
      firstConsumer === 'panel'
        ? (): UseQueryResult<AnnotationData[]> | undefined => useAnnotations([definition])[0]
        : (): UseQueryResult<AnnotationData[]> => useAnnotationData(definition),
      { wrapper },
    );
    await waitFor(() => expect(first.result.current?.data).toEqual(data));
    first.unmount();

    const next = renderHook(
      () => ({
        panel: useAnnotations([definition])[0],
        preview: useAnnotationData(definition),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(next.result.current.panel?.data).toEqual(data);
      expect(next.result.current.preview.data).toEqual(data);
    });
    expect(getAnnotationData).toHaveBeenCalledTimes(1);
  });

  it('waits for the plugin and dependent variables in both hooks', async () => {
    dependsOn.mockReturnValue({ variables: ['cluster'] });
    runtime.variables = { cluster: { value: 'prod', loading: true } };
    const { result, rerender } = renderHook(
      () => ({
        panel: useAnnotations([definition])[0],
        preview: useAnnotationData(definition),
      }),
      { wrapper },
    );
    expect(getAnnotationData).not.toHaveBeenCalled();
    await waitFor(() => expect(dependsOn).toHaveBeenCalled());
    expect(getAnnotationData).not.toHaveBeenCalled();

    runtime.variables = { cluster: { value: 'prod', loading: false } };
    rerender();
    await waitFor(() => expect(result.current.preview.data).toEqual(data));
    expect(getAnnotationData).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['declares no variables', definition],
    ['has no dependsOn', definitionWithoutDependsOn],
  ])('does not wait for variables when the plugin %s', async (_, spec) => {
    runtime.variables = { cluster: { value: 'prod', loading: true } };
    const { result } = renderHook(
      () => ({
        panel: useAnnotations([spec])[0],
        preview: useAnnotationData(spec),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.panel?.data).toEqual(data);
      expect(result.current.preview.data).toEqual(data);
    });
    expect(getAnnotationData).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated variables and refetches for changed dependencies, specs, and time ranges', async () => {
    dependsOn.mockReturnValue({ variables: ['cluster'] });
    runtime.variables = { cluster: { value: 'prod', loading: false }, unrelated: { value: 'a', loading: true } };
    const { result, rerender } = renderHook((spec) => useAnnotationData(spec), { wrapper, initialProps: definition });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    runtime.variables = { ...runtime.variables, unrelated: { value: 'b', loading: false } };
    rerender(definition);
    expect(getAnnotationData).toHaveBeenCalledTimes(1);

    runtime.variables = { ...runtime.variables, cluster: { value: 'staging', loading: false } };
    rerender(definition);
    await waitFor(() => expect(getAnnotationData).toHaveBeenCalledTimes(2));
    runtime.timeRange = { ...runtime.timeRange, end: new Date('2026-01-03') };
    rerender(definition);
    await waitFor(() => expect(getAnnotationData).toHaveBeenCalledTimes(3));
    rerender({ ...definition, plugin: { ...definition.plugin, spec: { query: 'new query' } } });
    await waitFor(() => expect(getAnnotationData).toHaveBeenCalledTimes(4));
  });

  it('participates in dashboard query refresh and updates every consumer', async () => {
    const { result } = renderHook(
      () => ({
        panel: useAnnotations([definition])[0],
        preview: useAnnotationData(definition),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.preview.data).toEqual(data));
    const refreshed = [{ start: 2, title: 'New deployment' }];
    getAnnotationData.mockResolvedValue(refreshed);
    await act(async () => {
      // Invalidated by TimeRangeProvider on dashboard refresh.
      await queryClient.invalidateQueries({ queryKey: ['annotation'] });
    });
    await waitFor(() => {
      expect(result.current.panel?.data).toEqual(refreshed);
      expect(result.current.preview.data).toEqual(refreshed);
    });
    expect(getAnnotationData).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryCache().findAll({ queryKey: ['annotation'] })).toHaveLength(1);
  });

  it('refetches only the matching annotation when invalidated with its spec (preview re-run)', async () => {
    const otherDefinition: AnnotationSpec = { ...definition, display: { name: 'Incidents' } };
    const { result } = renderHook(() => useAnnotations([definition, otherDefinition]), { wrapper });
    await waitFor(() => expect(result.current.every((query) => query.isSuccess)).toBe(true));
    expect(getAnnotationData).toHaveBeenCalledTimes(2);

    await act(async () => {
      // Same key as the annotation editor preview "run query" (AnnotationEditorForm).
      await queryClient.invalidateQueries({ queryKey: ['annotation', { ...definition }] });
    });
    expect(getAnnotationData).toHaveBeenCalledTimes(3);
  });

  it('exposes the same request error to panels and previews', async () => {
    const error = new Error('Annotation request failed');
    getAnnotationData.mockRejectedValue(error);
    const { result } = renderHook(
      () => ({
        panel: useAnnotations([definition])[0],
        preview: useAnnotationData(definition),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.panel?.error).toBe(error);
      expect(result.current.preview.error).toBe(error);
    });
    expect(getAnnotationData).toHaveBeenCalledTimes(1);
  });
});
