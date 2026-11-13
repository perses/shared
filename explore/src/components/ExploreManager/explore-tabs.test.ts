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

import type { PluginMetadataWithModule } from '@perses-dev/plugin-system';

import { resolveExploreTabs } from './explore-tabs';

function explorer(moduleName: string, name: string, displayName: string): PluginMetadataWithModule {
  return {
    kind: 'Explore',
    spec: { name, display: { name: displayName } },
    module: { name: moduleName, version: '1.0.0' },
  };
}

const prometheus = explorer('Prometheus', 'PrometheusExplorer', 'Prometheus Explorer');
const tempo = explorer('Tempo', 'TempoExplorer', 'Tempo Explorer');
const custom = explorer('Custom', 'CustomExplorer', 'Custom Explorer');

describe('resolveExploreTabs', () => {
  it('has a tab per plugin without tab definitions', () => {
    expect(resolveExploreTabs([prometheus, tempo], undefined)).toEqual([
      { key: 'Prometheus-PrometheusExplorer', label: 'Prometheus Explorer', plugin: prometheus },
      { key: 'Tempo-TempoExplorer', label: 'Tempo Explorer', plugin: tempo },
    ]);
  });

  it('follows the tab definitions, then adds the plugins they do not refer to', () => {
    const tabs = resolveExploreTabs(
      [prometheus, tempo, custom],
      [
        { id: 'traces', label: 'Traces', explorerPluginName: 'TempoExplorer' },
        { id: 'metrics', label: 'Metrics', explorerPluginName: 'PrometheusExplorer' },
      ],
    );
    expect(tabs.map((tab) => [tab.key, tab.label])).toEqual([
      ['Tempo-TempoExplorer', 'Traces'],
      ['Prometheus-PrometheusExplorer', 'Metrics'],
      ['Custom-CustomExplorer', 'Custom Explorer'],
    ]);
  });

  it('keeps custom content and reports missing plugins', () => {
    const tabs = resolveExploreTabs(
      [prometheus],
      [
        { id: 'metrics', label: 'Metrics', explorerPluginName: 'PrometheusExplorer', content: 'custom metrics' },
        { id: 'logs', label: 'Logs', content: 'custom logs' },
        { id: 'profiles', label: 'Profiling', explorerPluginName: 'PyroscopeExplorer' },
      ],
    );
    expect(tabs).toEqual([
      {
        key: 'Prometheus-PrometheusExplorer',
        label: 'Metrics',
        plugin: prometheus,
        content: 'custom metrics',
        missingPluginName: undefined,
      },
      { key: 'tab-logs', label: 'Logs', plugin: undefined, content: 'custom logs', missingPluginName: undefined },
      {
        key: 'tab-profiles',
        label: 'Profiling',
        plugin: undefined,
        content: undefined,
        missingPluginName: 'PyroscopeExplorer',
      },
    ]);
  });
});
