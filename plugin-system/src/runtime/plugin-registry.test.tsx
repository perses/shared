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
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Profiler } from 'react';

import type { PluginRegistryContextType } from './plugin-registry';
import { PluginRegistryContext, usePlugin, usePlugins } from './plugin-registry';

function PluginName({ hook }: { hook: 'usePlugin' | 'usePlugins' }): ReactElement {
  const single = usePlugin('Panel', 'TimeSeriesChart', { enabled: hook === 'usePlugin' });
  const multiple = usePlugins('Panel', hook === 'usePlugins' ? [{ kind: 'TimeSeriesChart' }] : []);
  const plugin = hook === 'usePlugin' ? single.data : multiple[0]?.data;
  return <span>{plugin ? 'loaded' : 'loading'}</span>;
}

function TestProviders({
  queryClient,
  registry,
  children,
}: {
  queryClient: QueryClient;
  registry: PluginRegistryContextType;
  children: ReactNode;
}): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <PluginRegistryContext.Provider value={registry}>{children}</PluginRegistryContext.Provider>
    </QueryClientProvider>
  );
}

describe.each(['usePlugin', 'usePlugins'] as const)('%s', (hook) => {
  it('does not reload a loaded plugin nor re-render its users when another component uses it', async () => {
    const getPlugin = vi.fn().mockResolvedValue({ PanelComponent: (): null => null });
    const registry = { getPlugin, listPluginMetadata: vi.fn() } as unknown as PluginRegistryContextType;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let firstRenders = 0;
    const wrap = (children: ReactNode): ReactElement => (
      <TestProviders queryClient={queryClient} registry={registry}>
        <Profiler
          id="first"
          onRender={() => {
            firstRenders++;
          }}
        >
          <PluginName hook={hook} />
        </Profiler>
        {children}
      </TestProviders>
    );

    const { rerender } = render(wrap(null));
    await waitFor(() => expect(screen.getByText('loaded')).toBeInTheDocument());
    const rendersBefore = firstRenders;

    rerender(wrap(<PluginName hook={hook} />));
    await waitFor(() => expect(screen.getAllByText('loaded')).toHaveLength(2));

    expect(getPlugin).toHaveBeenCalledTimes(1);
    // The first component only renders again because its parent re-rendered.
    expect(firstRenders - rendersBefore).toBeLessThanOrEqual(1);
  });
});
