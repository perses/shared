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

import type { AnnotationPlugin } from '@perses-dev/plugin-system';
import { mockPluginRegistry, PluginRegistry, TimeRangeProviderBasic } from '@perses-dev/plugin-system';
import type { AnnotationSpec, TimeRangeValue } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { defaultDatasourceProps } from '../../test';
import { DatasourceStoreProvider } from '../DatasourceStoreProvider';
import { VariableProvider } from '../VariableProvider';
import { AnnotationProvider } from './AnnotationProvider';
import { usePanelAnnotationsWithData } from './usePanelAnnotationsWithData';

const dashboardDefinition: AnnotationSpec = {
  display: { name: 'Deploys' },
  plugin: { kind: 'TestAnnotation', spec: { query: 'deploys' } },
};
const panelDefinition: AnnotationSpec = {
  display: { name: 'Incidents' },
  plugin: { kind: 'TestAnnotation', spec: { query: 'incidents' } },
};
const dashboardDefinitions = [dashboardDefinition];
const timeRange: TimeRangeValue = { pastDuration: '30m' };
const getAnnotationData = vi.fn<AnnotationPlugin['getAnnotationData']>();
const registryProps = mockPluginRegistry({
  kind: 'Annotation',
  spec: { name: 'TestAnnotation' },
  plugin: { createInitialOptions: () => ({}), getAnnotationData },
});
let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <PluginRegistry {...registryProps}>
        <DatasourceStoreProvider {...defaultDatasourceProps}>
          <TimeRangeProviderBasic initialRefreshInterval="0s" initialTimeRange={timeRange}>
            <VariableProvider>
              <AnnotationProvider initialAnnotationSpecs={dashboardDefinitions}>{children}</AnnotationProvider>
            </VariableProvider>
          </TimeRangeProviderBasic>
        </DatasourceStoreProvider>
      </PluginRegistry>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let start = 0;
  getAnnotationData.mockReset().mockImplementation(() => {
    start += 1;
    return Promise.resolve([{ start, title: 'Event' }]);
  });
});
afterEach(() => queryClient.clear());

describe('usePanelAnnotationsWithData with the query cache', () => {
  it('keeps its result across renders until the queries resolve new data', async () => {
    const { result, rerender } = renderHook(() => usePanelAnnotationsWithData([panelDefinition]), { wrapper });
    await waitFor(() => expect(result.current).toHaveLength(2));
    const annotations = result.current;
    rerender();
    expect(result.current).toBe(annotations);
    expect(getAnnotationData).toHaveBeenCalledTimes(2);

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['annotation'] });
    });
    await waitFor(() => expect(result.current).not.toBe(annotations));
    expect(getAnnotationData).toHaveBeenCalledTimes(4);
  });
});
