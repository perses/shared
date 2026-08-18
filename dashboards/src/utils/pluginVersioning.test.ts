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

import { DashboardResource } from '@perses-dev/client';
import { PluginMetadataWithModule } from '@perses-dev/plugin-system';
import {
  applyPluginVersions,
  buildAvailablePluginVersions,
  buildLatestPluginVersions,
  compareVersions,
  findInvalidPinnedVersions,
  findOutdatedPlugins,
  getOutdatedPluginId,
  isDashboardLocked,
  removePluginVersions,
  updatePluginVersions,
} from './pluginVersioning';

function buildMetadata(
  kind: string,
  name: string,
  moduleVersion: string,
  pluginVersion?: string
): PluginMetadataWithModule {
  return {
    kind,
    metadata: pluginVersion ? { version: pluginVersion } : undefined,
    spec: { name, display: { name } },
    module: { name: `${name}-module`, version: moduleVersion },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function buildDashboard(): DashboardResource {
  return {
    kind: 'Dashboard',
    metadata: { name: 'test', project: 'perses', version: 0, createdAt: '', updatedAt: '' },
    spec: {
      duration: '1h',
      variables: [
        {
          kind: 'ListVariable',
          spec: {
            name: 'foo',
            allowMultiple: false,
            allowAllValue: false,
            plugin: { kind: 'PrometheusLabelValuesVariable', spec: {} },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {
          kind: 'TextVariable',
          spec: { name: 'bar', value: 'baz' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
      layouts: [],
      panels: {
        panel1: {
          kind: 'Panel',
          spec: {
            display: { name: 'Panel 1' },
            plugin: { kind: 'TimeSeriesChart', spec: {} },
            queries: [
              {
                kind: 'TimeSeriesQuery',
                spec: { plugin: { kind: 'PrometheusTimeSeriesQuery', spec: {} } },
              },
            ],
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      datasources: {
        ds1: {
          default: true,
          plugin: { kind: 'PrometheusDatasource', spec: {} },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      annotations: [
        {
          display: { name: 'anno' },
          plugin: { kind: 'TempoAnnotation', spec: {} },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    },
  };
}

describe('compareVersions', () => {
  test.each([
    ['1.0.0', '1.0.0', 0],
    ['1.2.0', '1.1.9', 1],
    ['1.1.0', '1.2.0', -1],
    ['v2.0.0', '1.9.9', 1],
    ['0.10.0', '0.9.0', 1],
  ])('compareVersions(%s, %s)', (a, b, expected) => {
    expect(Math.sign(compareVersions(a as string, b as string))).toBe(expected);
  });
});

describe('buildLatestPluginVersions', () => {
  test('keeps the highest version per plugin name and prefers plugin-level version', () => {
    const metadata: PluginMetadataWithModule[] = [
      buildMetadata('Panel', 'TimeSeriesChart', '0.1.0'),
      buildMetadata('Panel', 'TimeSeriesChart', '0.3.0'),
      buildMetadata('Panel', 'TimeSeriesChart', '0.2.0'),
      buildMetadata('TimeSeriesQuery', 'PrometheusTimeSeriesQuery', '1.0.0', '2.0.0'),
    ];
    const versions = buildLatestPluginVersions(metadata);
    expect(versions.get('TimeSeriesChart')).toBe('0.3.0');
    // plugin-level version wins over module version
    expect(versions.get('PrometheusTimeSeriesQuery')).toBe('2.0.0');
  });
});

describe('applyPluginVersions / removePluginVersions / isDashboardLocked', () => {
  const versions = new Map<string, string>([
    ['TimeSeriesChart', '1.0.0'],
    ['PrometheusTimeSeriesQuery', '1.1.0'],
    ['PrometheusLabelValuesVariable', '1.2.0'],
    ['PrometheusDatasource', '1.3.0'],
    ['TempoAnnotation', '1.4.0'],
  ]);

  test('a fresh dashboard is not locked', () => {
    expect(isDashboardLocked(buildDashboard())).toBe(false);
  });

  test('applies versions to every plugin definition and marks the dashboard as locked', () => {
    const dashboard = buildDashboard();
    const locked = applyPluginVersions(dashboard, versions);

    // original is untouched (deep clone)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((dashboard.spec.panels.panel1 as any).spec.plugin.metadata).toBeUndefined();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((locked.spec.panels.panel1 as any).spec.plugin.metadata.version).toBe('1.0.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((locked.spec.panels.panel1 as any).spec.queries[0].spec.plugin.metadata.version).toBe('1.1.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((locked.spec.variables[0] as any).spec.plugin.metadata.version).toBe('1.2.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((locked.spec.datasources!.ds1 as any).plugin.metadata.version).toBe('1.3.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((locked.spec.annotations![0] as any).plugin.metadata.version).toBe('1.4.0');
    expect(isDashboardLocked(locked)).toBe(true);
  });

  test('removePluginVersions reverts the lock', () => {
    const dashboard = buildDashboard();
    const locked = applyPluginVersions(dashboard, versions);
    const unlocked = removePluginVersions(locked);

    expect(isDashboardLocked(unlocked)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((unlocked.spec.panels.panel1 as any).spec.plugin.metadata).toBeUndefined();
  });

  test('plugins without an available version are left unpinned', () => {
    const dashboard = buildDashboard();
    const partial = applyPluginVersions(dashboard, new Map([['TimeSeriesChart', '1.0.0']]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((partial.spec.panels.panel1 as any).spec.plugin.metadata.version).toBe('1.0.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((partial.spec.datasources!.ds1 as any).plugin.metadata).toBeUndefined();
  });
});

describe('buildAvailablePluginVersions / findInvalidPinnedVersions', () => {
  const available = buildAvailablePluginVersions([
    buildMetadata('Panel', 'TimeSeriesChart', '1.0.0'),
    buildMetadata('Panel', 'TimeSeriesChart', '2.0.0'),
    buildMetadata('TimeSeriesQuery', 'PrometheusTimeSeriesQuery', '1.1.0'),
    buildMetadata('Variable', 'PrometheusLabelValuesVariable', '1.2.0'),
    buildMetadata('Datasource', 'PrometheusDatasource', '1.3.0'),
    buildMetadata('Annotation', 'TempoAnnotation', '1.4.0'),
  ]);

  test('collects every available version per plugin name', () => {
    expect(available.get('TimeSeriesChart')).toEqual(new Set(['1.0.0', '2.0.0']));
  });

  test('no invalid pins when all pinned versions exist', () => {
    const dashboard = applyPluginVersions(
      buildDashboard(),
      new Map<string, string>([
        ['TimeSeriesChart', '2.0.0'],
        ['PrometheusTimeSeriesQuery', '1.1.0'],
        ['PrometheusLabelValuesVariable', '1.2.0'],
        ['PrometheusDatasource', '1.3.0'],
        ['TempoAnnotation', '1.4.0'],
      ])
    );
    expect(findInvalidPinnedVersions(dashboard, available)).toEqual([]);
  });

  test('reports pins whose version is not available', () => {
    const dashboard = applyPluginVersions(
      buildDashboard(),
      new Map<string, string>([
        ['TimeSeriesChart', '99.0.0'], // not available
        ['PrometheusTimeSeriesQuery', '1.1.0'], // available
      ])
    );
    const invalid = findInvalidPinnedVersions(dashboard, available);
    expect(invalid).toEqual([{ kind: 'TimeSeriesChart', version: '99.0.0' }]);
  });

  test('unpinned dashboards have no invalid pins', () => {
    expect(findInvalidPinnedVersions(buildDashboard(), available)).toEqual([]);
  });
});

describe('findOutdatedPlugins / updatePluginVersions', () => {
  const latest = new Map<string, string>([
    ['TimeSeriesChart', '2.0.0'],
    ['PrometheusTimeSeriesQuery', '1.5.0'],
    ['PrometheusLabelValuesVariable', '1.2.0'],
    ['PrometheusDatasource', '1.3.0'],
    ['TempoAnnotation', '1.4.0'],
  ]);

  // Lock everything to an older version so every plugin is outdated.
  const lockedOld = (): DashboardResource =>
    applyPluginVersions(
      buildDashboard(),
      new Map<string, string>([
        ['TimeSeriesChart', '1.0.0'],
        ['PrometheusTimeSeriesQuery', '1.0.0'],
        ['PrometheusLabelValuesVariable', '1.0.0'],
        ['PrometheusDatasource', '1.0.0'],
        ['TempoAnnotation', '1.0.0'],
      ])
    );

  test('an unpinned dashboard reports nothing as outdated', () => {
    expect(findOutdatedPlugins(buildDashboard(), latest)).toEqual([]);
  });

  test('a dashboard pinned to the latest versions reports nothing as outdated', () => {
    const upToDate = applyPluginVersions(buildDashboard(), latest);
    expect(findOutdatedPlugins(upToDate, latest)).toEqual([]);
  });

  test('detects outdated plugins with their type, versions and example panel', () => {
    const outdated = findOutdatedPlugins(lockedOld(), latest);
    const kinds = outdated.map((o) => o.kind).sort();
    expect(kinds).toEqual([
      'PrometheusDatasource',
      'PrometheusLabelValuesVariable',
      'PrometheusTimeSeriesQuery',
      'TempoAnnotation',
      'TimeSeriesChart',
    ]);

    const panelPlugin = outdated.find((o) => o.kind === 'TimeSeriesChart');
    expect(panelPlugin).toMatchObject({
      pluginType: 'Panel',
      currentVersion: '1.0.0',
      latestVersion: '2.0.0',
      examplePanelKey: 'panel1',
    });

    // Query plugins carry their query type and the panel they belong to
    expect(outdated.find((o) => o.kind === 'PrometheusTimeSeriesQuery')).toMatchObject({
      pluginType: 'TimeSeriesQuery',
      examplePanelKey: 'panel1',
    });
    // Non-panel plugins have no example panel
    expect(outdated.find((o) => o.kind === 'PrometheusDatasource')?.examplePanelKey).toBeUndefined();
  });

  test('the `latest` sentinel is not considered outdated', () => {
    const dashboard = applyPluginVersions(buildDashboard(), new Map([['TimeSeriesChart', 'latest']]));
    expect(findOutdatedPlugins(dashboard, latest)).toEqual([]);
  });

  test('only the selected plugins are updated', () => {
    const dashboard = lockedOld();
    const outdated = findOutdatedPlugins(dashboard, latest);
    const panelPlugin = outdated.find((o) => o.kind === 'TimeSeriesChart')!;

    const updated = updatePluginVersions(dashboard, [panelPlugin]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((updated.spec.panels.panel1 as any).spec.plugin.metadata.version).toBe('2.0.0');
    // Not selected -> untouched
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((updated.spec.panels.panel1 as any).spec.queries[0].spec.plugin.metadata.version).toBe('1.0.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((updated.spec.datasources!.ds1 as any).plugin.metadata.version).toBe('1.0.0');

    // The source dashboard is not mutated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((dashboard.spec.panels.panel1 as any).spec.plugin.metadata.version).toBe('1.0.0');
  });

  test('updating every outdated plugin clears the outdated list', () => {
    const dashboard = lockedOld();
    const updated = updatePluginVersions(dashboard, findOutdatedPlugins(dashboard, latest));
    expect(findOutdatedPlugins(updated, latest)).toEqual([]);
    // The dashboard stays locked, just on newer versions
    expect(isDashboardLocked(updated)).toBe(true);
  });

  test('updating with an empty selection returns the dashboard unchanged', () => {
    const dashboard = lockedOld();
    expect(updatePluginVersions(dashboard, [])).toBe(dashboard);
  });

  test('getOutdatedPluginId distinguishes plugin type, kind and version', () => {
    expect(getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', currentVersion: '1.0.0' })).toBe(
      'Panel:TimeSeriesChart:1.0.0'
    );
    expect(getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', currentVersion: '1.1.0' })).not.toBe(
      getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', currentVersion: '1.0.0' })
    );
  });
});
