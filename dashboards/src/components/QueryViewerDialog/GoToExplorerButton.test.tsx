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
  DefaultPluginKinds,
  MockPlugin,
  mockPluginRegistry,
  PluginLoader,
  PluginModuleResource,
  PluginRegistry,
  PluginType,
  ReactRouterProvider,
  useListPluginMetadata,
} from '@perses-dev/plugin-system';
import { QueryDefinition } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { GoToExplorerButton } from './GoToExplorerButton';

const PROM_QUERY: QueryDefinition = {
  kind: 'TimeSeriesQuery',
  spec: { plugin: { kind: 'PrometheusTimeSeriesQuery', spec: { query: 'up' } } },
};

const MOCK_PROM_QUERY_PLUGIN: MockPlugin = {
  kind: 'TimeSeriesQuery',
  spec: { name: 'PrometheusTimeSeriesQuery' },
  plugin: {
    createInitialOptions: () => ({}),
    getTimeSeriesData: () => Promise.resolve({ series: [] }),
  },
};

const MOCK_PROM_EXPLORE_PLUGIN: MockPlugin = {
  kind: 'Explore',
  spec: { name: 'PrometheusExplorer' },
  plugin: {
    createInitialOptions: () => ({}),
    ExploreComponent: () => <div>Prometheus explorer</div>,
  },
};

const QUERY_TYPES: PluginType[] = ['TimeSeriesQuery'];
const INITIAL_ENTRIES = ['/dashboard'];
const DEFAULT_PLUGIN_KINDS: DefaultPluginKinds = { TimeSeriesQuery: 'PrometheusTimeSeriesQuery' };

/**
 * The button renders nothing until plugin metadata arrives, so asserting its absence is
 * only meaningful once that has happened. This waits on the same queries the button
 * depends on, which react-query serves from the same cache entries.
 */
function MetadataLoaded(): ReactElement | null {
  const explorers = useListPluginMetadata(['Explore']);
  const queries = useListPluginMetadata(QUERY_TYPES);
  return explorers.data && queries.data ? <span data-testid="metadata-loaded" /> : null;
}

function renderWithLoader(queries: QueryDefinition[], pluginLoader: PluginLoader): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const Wrapper = (): ReactElement => (
    <MemoryRouter initialEntries={INITIAL_ENTRIES}>
      <QueryClientProvider client={queryClient}>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <PluginRegistry pluginLoader={pluginLoader} defaultPluginKinds={DEFAULT_PLUGIN_KINDS}>
            <ReactRouterProvider>
              <GoToExplorerButton queryDefinitions={queries} />
              <MetadataLoaded />
            </ReactRouterProvider>
          </PluginRegistry>
        </QueryParamProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  render(<Wrapper />);
}

function renderButton(queries: QueryDefinition[], plugins: MockPlugin[]): void {
  renderWithLoader(queries, mockPluginRegistry(...plugins).pluginLoader);
}

/**
 * mockPluginRegistry declares a single module, so it cannot express a query plugin and
 * an explorer living in different modules. This loader can.
 */
function twoModuleLoader(): PluginLoader {
  const modules: PluginModuleResource[] = [
    {
      kind: 'PluginModule',
      metadata: { name: 'Prometheus', version: '1.0.0' },
      spec: {
        plugins: [
          {
            kind: 'TimeSeriesQuery',
            spec: { name: 'PrometheusTimeSeriesQuery', display: { name: 'Prometheus Time Series Query' } },
          },
        ],
      },
    },
    {
      kind: 'PluginModule',
      metadata: { name: 'Tempo', version: '1.0.0' },
      spec: {
        plugins: [{ kind: 'Explore', spec: { name: 'TempoExplorer', display: { name: 'Tempo Explorer' } } }],
      },
    },
  ];

  return {
    getInstalledPlugins: () => Promise.resolve(modules),
    importPluginModule: () => Promise.resolve({}),
  };
}

async function expectNoExplorerLink(): Promise<void> {
  await screen.findByTestId('metadata-loaded');
  expect(screen.queryByRole('link', { name: /go to explorer/i })).not.toBeInTheDocument();
}

describe('GoToExplorerButton', () => {
  it('links to the explorer from the query plugin module, carrying the queries', async () => {
    renderButton([PROM_QUERY], [MOCK_PROM_QUERY_PLUGIN, MOCK_PROM_EXPLORE_PLUGIN]);

    const link = await screen.findByRole('link', { name: /go to explorer/i });
    const href = link.getAttribute('href') ?? '';
    const params = new URLSearchParams(href.slice(href.indexOf('?')));

    expect(href.startsWith('/explore?')).toBe(true);
    // mockPluginRegistry puts every mock plugin in one module, so the explorer key is
    // that module paired with the explore plugin it found there.
    expect(params.get('explorer')).toBe('Fake Plugin Module for Tests-PrometheusExplorer');
    expect(JSON.parse(params.get('data') ?? '{}')).toEqual({ queries: [PROM_QUERY] });
  });

  it('renders nothing when the query plugin module ships no explorer', async () => {
    renderButton([PROM_QUERY], [MOCK_PROM_QUERY_PLUGIN]);
    await expectNoExplorerLink();
  });

  it('renders nothing when there are no queries to explore', async () => {
    renderButton([], [MOCK_PROM_QUERY_PLUGIN, MOCK_PROM_EXPLORE_PLUGIN]);
    await expectNoExplorerLink();
  });

  it('does not offer an explorer belonging to a different plugin module', async () => {
    renderWithLoader([PROM_QUERY], twoModuleLoader());
    await expectNoExplorerLink();
  });
});
