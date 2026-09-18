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

import { loadPlugin } from './PluginRuntime';
import { remotePluginLoader } from './remotePluginLoader';

const registerRemotes = vi.fn();
const loadRemote = vi.fn().mockResolvedValue({});

vi.mock('@module-federation/enhanced/runtime', () => ({
  createInstance: vi.fn(() => ({ options: { remotes: [] }, registerRemotes, loadRemote })),
}));

describe('loadPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use the plugin baseURL when provided', async () => {
    remotePluginLoader({ baseURL: '/perses', apiPrefix: '/perses' });

    await loadPlugin({
      moduleName: 'Tempo',
      pluginName: 'TempoExplorer',
      version: '0.59.0',
      baseURL: 'https://cdn.example.com/plugins',
    });

    expect(registerRemotes).toHaveBeenCalledWith([
      expect.objectContaining({ entry: 'https://cdn.example.com/plugins/Tempo~0.59.0/mf-manifest.json' }),
    ]);
  });

  it('should fall back to /plugins when the loader has no base URL', async () => {
    remotePluginLoader();

    await loadPlugin({ moduleName: 'Tempo', pluginName: 'TempoExplorer', version: '0.59.0' });

    expect(registerRemotes).toHaveBeenCalledWith([
      expect.objectContaining({ entry: '/plugins/Tempo~0.59.0/mf-manifest.json' }),
    ]);
  });

  it('should fall back to the base URL configured on the loader when the plugin has none', async () => {
    remotePluginLoader({ baseURL: '/perses', apiPrefix: '/perses' });

    await loadPlugin({ moduleName: 'Tempo', pluginName: 'TempoExplorer', version: '0.59.0' });

    expect(registerRemotes).toHaveBeenCalledWith([
      expect.objectContaining({ entry: '/perses/plugins/Tempo~0.59.0/mf-manifest.json' }),
    ]);
  });
});
