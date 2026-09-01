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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import type { PluginModuleResource } from '../../model';
import { dynamicImportPluginLoader } from '../../model';
import { usePlugin } from '../../runtime';
import { PluginRegistry } from './PluginRegistry';

const PLUGIN_NAME = 'TestVariable';

/** A plugin module exposing a single Variable plugin, installed under the given version/registry. */
function buildResource(version: string, registry?: string): PluginModuleResource {
  return {
    kind: 'PluginModule',
    metadata: { name: `Module-${registry ?? 'default'}-${version}`, version, registry },
    spec: {
      plugins: [{ kind: 'Variable', spec: { name: PLUGIN_NAME, display: { name: PLUGIN_NAME } } }],
    },
  };
}

/** The plugin implementation carries a marker so tests can tell which module was loaded. */
function buildModule(source: string): Record<string, unknown> {
  return { [PLUGIN_NAME]: { createInitialOptions: () => ({}), source } };
}

function renderConsumer(children: ReactNode, resources: Array<[PluginModuleResource, string]>): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const pluginLoader = dynamicImportPluginLoader(
    resources.map(([resource, source]) => ({
      resource,
      importPlugin: (): Promise<Record<string, unknown>> => Promise.resolve(buildModule(source)),
    })),
  );
  render(
    <QueryClientProvider client={queryClient}>
      <PluginRegistry pluginLoader={pluginLoader}>{children}</PluginRegistry>
    </QueryClientProvider>,
  );
}

function Consumer({ version, registry }: { version?: string; registry?: string }): ReactElement {
  const { data, isLoading, error } = usePlugin('Variable', PLUGIN_NAME, { version, registry });
  if (isLoading) return <div>loading</div>;
  if (error) return <div>error: {error.message}</div>;
  return <div>source: {(data as unknown as { source?: string })?.source}</div>;
}

describe('PluginRegistry version and registry pinning', () => {
  it('resolves a version-only pin even when the plugin is installed under a named registry', async () => {
    // A version-only pin is what the panel editor produces. The plugin only exists in the `corp` registry, so building
    // a synthetic registry-less key would make it look missing.
    renderConsumer(<Consumer version="1.0.0" />, [
      [buildResource('1.0.0', 'corp'), 'corp-1.0.0'],
      [buildResource('2.0.0', 'corp'), 'corp-2.0.0'],
    ]);
    expect(await screen.findByText('source: corp-1.0.0', undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it('never falls back to another version when a version is pinned', async () => {
    renderConsumer(<Consumer version="3.0.0" />, [[buildResource('1.0.0'), 'v1']]);
    expect(await screen.findByText(/^error:/, undefined, { timeout: 3000 })).toHaveTextContent("version '3.0.0'");
  });

  it('never falls back to another registry when a registry is pinned', async () => {
    renderConsumer(<Consumer registry="corp" />, [[buildResource('1.0.0', 'community'), 'community']]);
    expect(await screen.findByText(/^error:/, undefined, { timeout: 3000 })).toHaveTextContent("registry 'corp'");
  });

  it('resolves the latest version inside the pinned registry', async () => {
    renderConsumer(<Consumer registry="corp" />, [
      [buildResource('1.0.0', 'corp'), 'corp-1.0.0'],
      [buildResource('2.0.0', 'corp'), 'corp-2.0.0'],
      [buildResource('9.0.0', 'community'), 'community-9.0.0'],
    ]);
    expect(await screen.findByText('source: corp-2.0.0', undefined, { timeout: 3000 })).toBeInTheDocument();
  });
});
