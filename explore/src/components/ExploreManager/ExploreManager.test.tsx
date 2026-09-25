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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ExploreManager } from './ExploreManager';
import { ExplorerManagerProvider } from './ExplorerManagerProvider';

const pluginLoaderComponent = vi.fn<(props: unknown) => null>(() => null);
const listPluginMetadata = vi.fn();

vi.mock('@perses-dev/plugin-system', () => ({
  PluginLoaderComponent: (props: unknown): null => pluginLoaderComponent(props),
  useListPluginMetadata: (): unknown => listPluginMetadata(),
  usePluginRegistry: (): unknown => ({ pluginsBaseURL: '/perses/plugins' }),
}));

vi.mock('../ExploreToolbar', () => ({
  ExploreToolbar: (): null => null,
}));

describe('ExploreManager', () => {
  it('should load the explorer plugin with its module version, registry and the configured base URL', async () => {
    listPluginMetadata.mockReturnValue({
      data: [
        {
          kind: 'Explore',
          spec: { name: 'TempoExplorer', display: { name: 'Tempo' } },
          module: { name: 'Tempo', version: '0.59.0', registry: 'perses' },
        },
      ],
    });

    render(
      <ExplorerManagerProvider defaultExplorer="Tempo-TempoExplorer">
        <ExploreManager />
      </ExplorerManagerProvider>,
    );

    await waitFor(() => {
      expect(pluginLoaderComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          plugin: {
            name: 'TempoExplorer',
            moduleName: 'Tempo',
            version: '0.59.0',
            registry: 'perses',
            baseURL: '/perses/plugins',
          },
        }),
      );
    });
  });
});

it('preserves plugin URLs and module identities when switching sorted explorer tabs', () => {
  listPluginMetadata.mockReturnValue({
    data: [
      {
        kind: 'Explore',
        spec: { name: 'MetricsExplorer', display: { name: 'Metrics' } },
        module: { name: 'metrics', version: '1.2.3', registry: 'private' },
      },
      {
        kind: 'Explore',
        spec: { name: 'LogsExplorer', display: { name: 'Logs' } },
        module: { name: 'logs', version: '2.3.4', registry: 'community' },
      },
    ],
  });
  render(
    <ExplorerManagerProvider defaultExplorer="metrics-MetricsExplorer">
      <ExploreManager />
    </ExplorerManagerProvider>,
  );
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Logs', 'Metrics']);
  expect(pluginLoaderComponent).toHaveBeenLastCalledWith(
    expect.objectContaining({
      plugin: {
        name: 'MetricsExplorer',
        moduleName: 'metrics',
        version: '1.2.3',
        registry: 'private',
        baseURL: '/perses/plugins',
      },
    }),
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
  expect(pluginLoaderComponent).toHaveBeenLastCalledWith(
    expect.objectContaining({
      plugin: {
        name: 'LogsExplorer',
        moduleName: 'logs',
        version: '2.3.4',
        registry: 'community',
        baseURL: '/perses/plugins',
      },
    }),
  );
});
