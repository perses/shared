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

import { render, waitFor } from '@testing-library/react';

import { ExploreManager } from './ExploreManager';
import { ExplorerManagerProvider } from './ExplorerManagerProvider';

const pluginLoaderComponent = vi.fn<(props: unknown) => null>(() => null);
const listPluginMetadata = vi.fn();

vi.mock('@perses-dev/plugin-system', () => ({
  PluginLoaderComponent: (props: unknown): null => pluginLoaderComponent(props),
  useListPluginMetadata: (): unknown => listPluginMetadata(),
}));

vi.mock('../ExploreToolbar', () => ({
  ExploreToolbar: (): null => null,
}));

describe('ExploreManager', () => {
  it('should load the explorer plugin with its module version and registry', async () => {
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
      <ExplorerManagerProvider>
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
          },
        }),
      );
    });
  });
});
