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

import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useResizeObserver } from 'use-resize-observer';

import { loadPlugin } from './PluginRuntime';

type SharedModuleConfig = {
  version: string;
  lib?: () => unknown;
  get?: () => Promise<() => Record<string, unknown>>;
  shareConfig?: { requiredVersion?: string };
};

let runtimeShared: Record<string, SharedModuleConfig> = {};
const registerRemotes = vi.fn();
const loadRemote = vi.fn().mockResolvedValue({});

vi.mock('@module-federation/enhanced/runtime', () => ({
  createInstance: vi.fn((options: { shared: Record<string, SharedModuleConfig> }) => {
    runtimeShared = options.shared;
    return { options: { remotes: [] }, registerRemotes, loadRemote };
  }),
}));

describe('loadPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use the plugin baseURL when provided', async () => {
    await loadPlugin({
      moduleName: 'Tempo',
      pluginName: 'TempoExplorer',
      version: '0.59.0',
      baseURL: '/perses/plugins',
    });

    expect(registerRemotes).toHaveBeenCalledWith([
      expect.objectContaining({ entry: '/perses/plugins/Tempo~0.59.0/mf-manifest.json' }),
    ]);
  });

  it('should fall back to /plugins when no baseURL is provided', async () => {
    await loadPlugin({ moduleName: 'Tempo', pluginName: 'TempoExplorer', version: '0.59.0' });

    expect(registerRemotes).toHaveBeenCalledWith([
      expect.objectContaining({ entry: '/plugins/Tempo~0.59.0/mf-manifest.json' }),
    ]);
  });

  it('should resolve plugins from the site root when baseURL is an empty string', async () => {
    await loadPlugin({ moduleName: 'Tempo', pluginName: 'TempoExplorer', version: '0.59.0', baseURL: '' });

    expect(registerRemotes).toHaveBeenCalledWith([
      expect.objectContaining({ entry: '/Tempo~0.59.0/mf-manifest.json' }),
    ]);
  });
});

describe('shared modules', () => {
  beforeAll(async () => {
    await loadPlugin({ moduleName: 'Tempo', pluginName: 'TempoExplorer', version: '0.59.0' });
  });

  it('should share the react-dom version provided by the host', () => {
    expect(runtimeShared['react-dom']?.version).toBe(ReactDOM.version);
  });

  it('should share the JSX runtime of the host React version', () => {
    const jsxRuntime = runtimeShared['react/jsx-runtime'];

    expect(jsxRuntime?.version).toBe(React.version);
    expect(jsxRuntime?.shareConfig?.requiredVersion).toBe(`^${React.version}`);
    expect(jsxRuntime?.lib?.()).toBe(ReactJSXRuntime);
  });

  it('should share use-resize-observer v10 and its named export', async () => {
    expect(runtimeShared['use-resize-observer']?.shareConfig?.requiredVersion).toBe('^10.0.0');

    const getModule = await runtimeShared['use-resize-observer']?.get?.();
    const sharedModule = getModule?.();

    expect(sharedModule?.useResizeObserver).toBe(useResizeObserver);
    expect(sharedModule).not.toHaveProperty('default');
  });
});
