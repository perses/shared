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

import type { DashboardResource } from '@perses-dev/client';
import type { PluginMetadataWithModule } from '@perses-dev/plugin-system';
import { comparePluginVersions, LATEST_PLUGIN_VERSION } from '@perses-dev/plugin-system';
import type { Definition } from '@perses-dev/spec';

/**
 * The full runtime identity of a plugin: two plugins with the same kind but a different registry are different plugins,
 * so a version can only be compared or applied within a single (plugin type, kind, registry) triplet.
 */
export interface PluginIdentity {
  /** The plugin type (e.g. 'Panel', 'TimeSeriesQuery', 'Variable', ...). */
  pluginType: string;
  /** The plugin kind/name (e.g. 'TimeSeriesChart'). */
  kind: string;
  /** The registry the plugin comes from, when the definition pins one. */
  registry?: string;
}

/** A stable string key for a {@link PluginIdentity}, usable as a Map key, React key or selection key. */
export function getPluginIdentityKey(identity: PluginIdentity): string {
  return `${identity.pluginType}:${identity.kind}:${identity.registry ?? ''}`;
}

/** Context about where a plugin definition lives inside the dashboard spec. */
interface PluginDefinitionContext {
  /** The plugin type (e.g. 'Panel', 'TimeSeriesQuery', 'Variable', ...). */
  pluginType: string;
  /** Key of the panel the definition belongs to, for panel plugins and panel query plugins. */
  panelKey?: string;
}

/**
 * Visit every plugin definition contained in a dashboard spec, invoking the provided callback with the definition, its
 * plugin type and (when relevant) the key of the panel it belongs to. Covers panel plugins, panel query plugins,
 * list-variable plugins, datasource plugins and annotation plugins.
 */
function visitPluginDefinitions(
  dashboard: DashboardResource,
  visitor: (definition: Definition<unknown>, context: PluginDefinitionContext) => void,
): void {
  const spec = dashboard.spec;

  for (const [panelKey, panel] of Object.entries(spec.panels ?? {})) {
    if (panel?.spec?.plugin) {
      visitor(panel.spec.plugin, { pluginType: 'Panel', panelKey });
    }
    for (const query of panel?.spec?.queries ?? []) {
      // For a query definition, `query.kind` is the query plugin type (e.g. 'TimeSeriesQuery').
      if (query?.spec?.plugin && query.kind) {
        visitor(query.spec.plugin, { pluginType: query.kind, panelKey });
      }
    }
  }

  // Only list variables reference a plugin.
  for (const variable of spec.variables ?? []) {
    if (variable?.kind === 'ListVariable' && variable.spec?.plugin) {
      visitor(variable.spec.plugin, { pluginType: 'Variable' });
    }
  }

  for (const datasource of Object.values(spec.datasources ?? {})) {
    if (datasource?.plugin) {
      visitor(datasource.plugin, { pluginType: 'Datasource' });
    }
  }

  for (const annotation of spec.annotations ?? []) {
    if (annotation?.plugin) {
      visitor(annotation.plugin, { pluginType: 'Annotation' });
    }
  }
}

/** Returns the identity of a plugin definition found at the given place in the dashboard spec. */
function getDefinitionIdentity(definition: Definition<unknown>, context: PluginDefinitionContext): PluginIdentity {
  return { pluginType: context.pluginType, kind: definition.kind, registry: definition.metadata?.registry };
}

/**
 * Returns the exact version a definition is pinned to, or `undefined` when it floats on the latest available version.
 * The `latest` sentinel is explicitly not a pin: the plugin registry resolves it dynamically.
 */
function getPinnedVersion(definition: Definition<unknown>): string | undefined {
  const version = definition.metadata?.version;
  return version && version !== LATEST_PLUGIN_VERSION ? version : undefined;
}

/**
 * Extract the version associated with a piece of plugin metadata, preferring the plugin-level version and falling back
 * to the containing module's version.
 */
function getMetadataVersion(metadata: PluginMetadataWithModule): string | undefined {
  return metadata.metadata?.version ?? metadata.module?.version;
}

/** Extract the registry a piece of plugin metadata comes from, if any. */
function getMetadataRegistry(metadata: PluginMetadataWithModule): string | undefined {
  return metadata.metadata?.registry ?? metadata.module?.registry;
}

/**
 * The latest version available in the instance for a given plugin identity.
 */
export type LatestPluginVersions = Map<string, string>;

/**
 * Build a map of plugin identity (plugin type + kind + registry) to the latest version currently available in the
 * instance, based on the installed plugin metadata returned by the plugin registry.
 *
 * Each identity is indexed twice: once with its registry, and once without it. The registry-less entry is what a
 * definition that does not pin a registry resolves to, matching how the plugin registry loads it.
 */
export function buildLatestPluginVersions(pluginMetadata: PluginMetadataWithModule[]): LatestPluginVersions {
  const versions: LatestPluginVersions = new Map();

  const keepLatest = (key: string, version: string): void => {
    const existing = versions.get(key);
    if (existing === undefined || comparePluginVersions(version, existing) > 0) {
      versions.set(key, version);
    }
  };

  for (const metadata of pluginMetadata) {
    const kind = metadata.spec?.name;
    const version = getMetadataVersion(metadata);
    if (!kind || !version) {
      continue;
    }
    const registry = getMetadataRegistry(metadata);
    // A definition without a pinned registry resolves to the latest version across every registry.
    keepLatest(getPluginIdentityKey({ pluginType: metadata.kind, kind }), version);
    if (registry) {
      keepLatest(getPluginIdentityKey({ pluginType: metadata.kind, kind, registry }), version);
    }
  }

  return versions;
}

/** A plugin definition pinned to a version older than the latest one available in the instance. */
export interface OutdatedPlugin extends PluginIdentity {
  /** The version currently pinned in the dashboard spec. */
  currentVersion: string;
  /** The latest version available in the instance. */
  latestVersion: string;
  /** Number of definitions in the dashboard pinned to the outdated version. */
  occurrences: number;
  /**
   * Key of the first panel using this plugin. Set for panel plugins and panel query plugins, and used to render a
   * before/after preview of a representative panel.
   */
  examplePanelKey?: string;
}

/**
 * A stable identity for an outdated plugin entry, usable as a React key or selection key.
 */
export function getOutdatedPluginId(plugin: PluginIdentity & Pick<OutdatedPlugin, 'currentVersion'>): string {
  return `${getPluginIdentityKey(plugin)}:${plugin.currentVersion}`;
}

/**
 * Find every plugin in the dashboard that is pinned to a version older than the latest version available in the
 * instance. Definitions without a pinned version are ignored: they already float on the latest version.
 */
export function findOutdatedPlugins(
  dashboard: DashboardResource,
  latestVersions: LatestPluginVersions,
): OutdatedPlugin[] {
  const outdated = new Map<string, OutdatedPlugin>();

  visitPluginDefinitions(dashboard, (definition, context) => {
    const currentVersion = getPinnedVersion(definition);
    if (!currentVersion) {
      return;
    }
    const identity = getDefinitionIdentity(definition, context);
    const latestVersion = latestVersions.get(getPluginIdentityKey(identity));
    if (!latestVersion || comparePluginVersions(latestVersion, currentVersion) <= 0) {
      return;
    }

    const id = getOutdatedPluginId({ ...identity, currentVersion });
    const existing = outdated.get(id);
    if (existing) {
      existing.occurrences += 1;
      existing.examplePanelKey ??= context.panelKey;
      return;
    }
    outdated.set(id, {
      ...identity,
      currentVersion,
      latestVersion,
      occurrences: 1,
      examplePanelKey: context.panelKey,
    });
  });

  return [...outdated.values()].toSorted(
    (a, b) => a.pluginType.localeCompare(b.pluginType) || a.kind.localeCompare(b.kind),
  );
}

/**
 * Return a copy of the dashboard where only the provided outdated plugins are re-pinned to their latest version. Any
 * other plugin definition (including other versions of the same kind) is left untouched.
 */
export function updatePluginVersions(dashboard: DashboardResource, plugins: OutdatedPlugin[]): DashboardResource {
  if (plugins.length === 0) {
    return dashboard;
  }
  const targets = new Map(plugins.map((plugin) => [getOutdatedPluginId(plugin), plugin.latestVersion]));
  const next = structuredClone(dashboard);
  visitPluginDefinitions(next, (definition, context) => {
    const currentVersion = getPinnedVersion(definition);
    if (!currentVersion) {
      return;
    }
    const id = getOutdatedPluginId({ ...getDefinitionIdentity(definition, context), currentVersion });
    const latestVersion = targets.get(id);
    if (latestVersion) {
      definition.metadata = { ...definition.metadata, version: latestVersion };
    }
  });
  return next;
}

/**
 * Return a copy of the dashboard with every plugin definition pinned to its latest available version. Plugin
 * definitions whose identity is not present in the version map are left untouched, which means the dashboard is only
 * fully locked if every plugin it uses is installed (see {@link isDashboardLocked}).
 */
export function applyPluginVersions(dashboard: DashboardResource, versions: LatestPluginVersions): DashboardResource {
  const next = structuredClone(dashboard);
  visitPluginDefinitions(next, (definition, context) => {
    const version = versions.get(getPluginIdentityKey(getDefinitionIdentity(definition, context)));
    if (version) {
      definition.metadata = { ...definition.metadata, version };
    }
  });
  return next;
}

/**
 * Return a copy of the dashboard with the pinned version removed from every plugin definition. The `metadata` object is
 * dropped entirely when it no longer holds any information.
 */
export function removePluginVersions(dashboard: DashboardResource): DashboardResource {
  const next = structuredClone(dashboard);
  visitPluginDefinitions(next, (definition) => {
    if (definition.metadata === undefined) {
      return;
    }
    const { version: _version, ...rest } = definition.metadata;
    if (Object.keys(rest).length === 0) {
      delete definition.metadata;
    } else {
      definition.metadata = rest;
    }
  });
  return next;
}

/**
 * A dashboard is "locked" when *every* plugin definition it contains is pinned to an exact version, which is the
 * invariant the lock action establishes. A dashboard where only some definitions are pinned is versioned partially: the
 * remaining plugins still float on the latest version, so it is not locked and the Lock action stays available.
 *
 * The `latest` sentinel does not count as a pin: the plugin registry resolves it dynamically, so it enforces nothing.
 */
export function isDashboardLocked(dashboard: DashboardResource): boolean {
  let total = 0;
  let pinned = 0;
  visitPluginDefinitions(dashboard, (definition) => {
    total += 1;
    if (getPinnedVersion(definition)) {
      pinned += 1;
    }
  });
  return total > 0 && pinned === total;
}
