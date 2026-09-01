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

/** Builds a plugin module resource exposing a single Variable plugin, tagged as dev or installed. */
function buildResource(version: string, inDev: boolean): PluginModuleResource {
  return {
    kind: 'PluginModule',
    metadata: { name: `Module-${version}`, version },
    ...(inDev ? { status: { isLoaded: true, inDev: true } } : {}),
    spec: {
      plugins: [
        {
          kind: 'Variable',
          spec: { name: PLUGIN_NAME, display: { name: PLUGIN_NAME } },
        },
      ],
    },
  };
}

/** The plugin implementation carries a marker so tests can tell which module was loaded. */
function buildModule(source: string): Record<string, unknown> {
  return { [PLUGIN_NAME]: { createInitialOptions: () => ({}), source } };
}

// A dev plugin on an OLDER version than the installed one: this is the `percli plugin start` case where the
// plugin's package.json version is behind the installed archives.
const devResource = buildResource('1.0.0', true);
const installedResource = buildResource('2.0.0', false);

function renderWithLoader(children: ReactNode): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: installedResource,
      importPlugin: (): Promise<Record<string, unknown>> => Promise.resolve(buildModule('installed')),
    },
    {
      resource: devResource,
      importPlugin: (): Promise<Record<string, unknown>> => Promise.resolve(buildModule('dev')),
    },
  ]);
  render(
    <QueryClientProvider client={queryClient}>
      <PluginRegistry pluginLoader={pluginLoader}>{children}</PluginRegistry>
    </QueryClientProvider>,
  );
}

function Consumer({ version }: { version?: string }): ReactElement {
  const { data, isLoading, error } = usePlugin('Variable', PLUGIN_NAME, version ? { version } : undefined);
  if (isLoading) return <div>loading</div>;
  if (error) return <div>error: {error.message}</div>;
  return <div>source: {(data as unknown as { source?: string })?.source}</div>;
}

describe('PluginRegistry dev plugin precedence', () => {
  it('prefers a plugin served in dev over a newer installed one when no version is pinned', async () => {
    renderWithLoader(<Consumer />);
    expect(await screen.findByText('source: dev', undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it('still honors an explicitly pinned version instead of the dev plugin', async () => {
    renderWithLoader(<Consumer version="2.0.0" />);
    expect(await screen.findByText('source: installed', undefined, { timeout: 3000 })).toBeInTheDocument();
  });
});
