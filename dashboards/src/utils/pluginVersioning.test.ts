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
  buildLatestPluginVersions,
  findOutdatedPlugins,
  getOutdatedPluginId,
  getPluginIdentityKey,
  hasPinnedPluginVersions,
  isDashboardLocked,
  LatestPluginVersions,
  removePluginVersions,
  updatePluginVersions,
} from './pluginVersioning';

function buildMetadata(
  kind: string,
  name: string,
  moduleVersion: string,
  options?: { pluginVersion?: string; registry?: string },
): PluginMetadataWithModule {
  return {
    kind,
    metadata: options?.pluginVersion ? { version: options.pluginVersion } : undefined,
    spec: { name, display: { name } },
    module: { name: `${name}-module`, version: moduleVersion, registry: options?.registry },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/** Build the version map used by `applyPluginVersions` from a plain `pluginType:kind -> version` record. */
function buildVersions(entries: Array<[pluginType: string, kind: string, version: string]>): LatestPluginVersions {
  return new Map(entries.map(([pluginType, kind, version]) => [getPluginIdentityKey({ pluginType, kind }), version]));
}

/** Every plugin of the test dashboard, pinned to the same version. */
function allPluginsAt(version: string): LatestPluginVersions {
  return buildVersions([
    ['Panel', 'TimeSeriesChart', version],
    ['TimeSeriesQuery', 'PrometheusTimeSeriesQuery', version],
    ['Variable', 'PrometheusLabelValuesVariable', version],
    ['Datasource', 'PrometheusDatasource', version],
    ['Annotation', 'TempoAnnotation', version],
  ]);
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

describe('buildLatestPluginVersions', () => {
  test('keeps the highest version per plugin identity and prefers plugin-level version', () => {
    const versions = buildLatestPluginVersions([
      buildMetadata('Panel', 'TimeSeriesChart', '0.1.0'),
      buildMetadata('Panel', 'TimeSeriesChart', '0.3.0'),
      buildMetadata('Panel', 'TimeSeriesChart', '0.2.0'),
      buildMetadata('TimeSeriesQuery', 'PrometheusTimeSeriesQuery', '1.0.0', { pluginVersion: '2.0.0' }),
    ]);
    expect(versions.get(getPluginIdentityKey({ pluginType: 'Panel', kind: 'TimeSeriesChart' }))).toBe('0.3.0');
    // plugin-level version wins over module version
    expect(
      versions.get(getPluginIdentityKey({ pluginType: 'TimeSeriesQuery', kind: 'PrometheusTimeSeriesQuery' })),
    ).toBe('2.0.0');
  });

  test('a pre-release never wins over its stable release', () => {
    const versions = buildLatestPluginVersions([
      buildMetadata('Panel', 'TimeSeriesChart', '1.0.0'),
      buildMetadata('Panel', 'TimeSeriesChart', '1.0.0-beta'),
    ]);
    expect(versions.get(getPluginIdentityKey({ pluginType: 'Panel', kind: 'TimeSeriesChart' }))).toBe('1.0.0');
  });

  test('the same kind in two registries keeps a version per registry', () => {
    const versions = buildLatestPluginVersions([
      buildMetadata('Panel', 'TimeSeriesChart', '1.0.0', { registry: 'a' }),
      buildMetadata('Panel', 'TimeSeriesChart', '2.0.0', { registry: 'b' }),
    ]);
    expect(versions.get(getPluginIdentityKey({ pluginType: 'Panel', kind: 'TimeSeriesChart', registry: 'a' }))).toBe(
      '1.0.0',
    );
    expect(versions.get(getPluginIdentityKey({ pluginType: 'Panel', kind: 'TimeSeriesChart', registry: 'b' }))).toBe(
      '2.0.0',
    );
    // Without a pinned registry, the latest version across registries is used.
    expect(versions.get(getPluginIdentityKey({ pluginType: 'Panel', kind: 'TimeSeriesChart' }))).toBe('2.0.0');
  });

  test('the same kind under two plugin types is versioned independently', () => {
    const versions = buildLatestPluginVersions([
      buildMetadata('Panel', 'Shared', '1.0.0'),
      buildMetadata('Variable', 'Shared', '2.0.0'),
    ]);
    expect(versions.get(getPluginIdentityKey({ pluginType: 'Panel', kind: 'Shared' }))).toBe('1.0.0');
    expect(versions.get(getPluginIdentityKey({ pluginType: 'Variable', kind: 'Shared' }))).toBe('2.0.0');
  });
});

describe('applyPluginVersions / removePluginVersions / isDashboardLocked', () => {
  const versions = buildVersions([
    ['Panel', 'TimeSeriesChart', '1.0.0'],
    ['TimeSeriesQuery', 'PrometheusTimeSeriesQuery', '1.1.0'],
    ['Variable', 'PrometheusLabelValuesVariable', '1.2.0'],
    ['Datasource', 'PrometheusDatasource', '1.3.0'],
    ['Annotation', 'TempoAnnotation', '1.4.0'],
  ]);

  test('a fresh dashboard is neither locked nor pinned', () => {
    expect(isDashboardLocked(buildDashboard())).toBe(false);
    expect(hasPinnedPluginVersions(buildDashboard())).toBe(false);
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
    const locked = applyPluginVersions(buildDashboard(), versions);
    const unlocked = removePluginVersions(locked);

    expect(isDashboardLocked(unlocked)).toBe(false);
    expect(hasPinnedPluginVersions(unlocked)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((unlocked.spec.panels.panel1 as any).spec.plugin.metadata).toBeUndefined();
  });

  test('plugins without an available version are left unpinned', () => {
    const partial = applyPluginVersions(buildDashboard(), buildVersions([['Panel', 'TimeSeriesChart', '1.0.0']]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((partial.spec.panels.panel1 as any).spec.plugin.metadata.version).toBe('1.0.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((partial.spec.datasources!.ds1 as any).plugin.metadata).toBeUndefined();
  });

  test('a partially pinned dashboard is pinned but not locked', () => {
    const partial = applyPluginVersions(buildDashboard(), buildVersions([['Panel', 'TimeSeriesChart', '1.0.0']]));
    expect(hasPinnedPluginVersions(partial)).toBe(true);
    expect(isDashboardLocked(partial)).toBe(false);
  });

  test('the `latest` sentinel does not count as a pin', () => {
    const sentinel = applyPluginVersions(buildDashboard(), allPluginsAt('latest'));
    expect(hasPinnedPluginVersions(sentinel)).toBe(false);
    expect(isDashboardLocked(sentinel)).toBe(false);
  });
});

describe('findOutdatedPlugins / updatePluginVersions', () => {
  const latest = buildVersions([
    ['Panel', 'TimeSeriesChart', '2.0.0'],
    ['TimeSeriesQuery', 'PrometheusTimeSeriesQuery', '1.5.0'],
    ['Variable', 'PrometheusLabelValuesVariable', '1.2.0'],
    ['Datasource', 'PrometheusDatasource', '1.3.0'],
    ['Annotation', 'TempoAnnotation', '1.4.0'],
  ]);

  // Lock everything to an older version so every plugin is outdated.
  const lockedOld = (): DashboardResource => applyPluginVersions(buildDashboard(), allPluginsAt('1.0.0'));

  test('an unpinned dashboard reports nothing as outdated', () => {
    expect(findOutdatedPlugins(buildDashboard(), latest)).toEqual([]);
  });

  test('a dashboard pinned to the latest versions reports nothing as outdated', () => {
    const upToDate = applyPluginVersions(buildDashboard(), latest);
    expect(findOutdatedPlugins(upToDate, latest)).toEqual([]);
  });

  test('detects outdated plugins with their type, versions and example panel', () => {
    const outdated = findOutdatedPlugins(lockedOld(), latest);
    const kinds = outdated.map((o) => o.kind).toSorted();
    expect(kinds).toEqual([
      'PrometheusDatasource',
      'PrometheusLabelValuesVariable',
      'PrometheusTimeSeriesQuery',
      'TempoAnnotation',
      'TimeSeriesChart',
    ]);

    expect(outdated.find((o) => o.kind === 'TimeSeriesChart')).toMatchObject({
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
    const dashboard = applyPluginVersions(buildDashboard(), allPluginsAt('latest'));
    expect(findOutdatedPlugins(dashboard, latest)).toEqual([]);
  });

  test('a pre-release pin is not reported as newer than its stable release', () => {
    const dashboard = applyPluginVersions(buildDashboard(), buildVersions([['Panel', 'TimeSeriesChart', '2.0.0-rc1']]));
    expect(findOutdatedPlugins(dashboard, latest)).toMatchObject([
      { kind: 'TimeSeriesChart', currentVersion: '2.0.0-rc1', latestVersion: '2.0.0' },
    ]);
  });

  test('a pin on a plugin registry that has nothing newer is left alone', () => {
    const dashboard = applyPluginVersions(buildDashboard(), buildVersions([['Panel', 'TimeSeriesChart', '1.0.0']]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dashboard.spec.panels.panel1 as any).spec.plugin.metadata.registry = 'other';
    // `latest` only knows about the registry-less identity, so nothing can be proposed for registry 'other'.
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

  test('getOutdatedPluginId distinguishes plugin type, kind, registry and version', () => {
    expect(getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', currentVersion: '1.0.0' })).toBe(
      'Panel:TimeSeriesChart::1.0.0',
    );
    expect(getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', currentVersion: '1.1.0' })).not.toBe(
      getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', currentVersion: '1.0.0' }),
    );
    expect(
      getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', registry: 'a', currentVersion: '1.0.0' }),
    ).not.toBe(getOutdatedPluginId({ pluginType: 'Panel', kind: 'TimeSeriesChart', currentVersion: '1.0.0' }));
  });
});
