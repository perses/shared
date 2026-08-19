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
import { PluginMetadataWithModule, PluginType } from '@perses-dev/plugin-system';
import { Definition } from '@perses-dev/spec';

/**
 * Optional metadata attached to a plugin definition. Mirrors the backend `Plugin.Metadata` model (and the
 * `@perses-dev/spec` `Definition.metadata` field) so a plugin can be pinned to a specific version/registry.
 */
export interface PluginDefinitionMetadata {
  version?: string;
  registry?: string;
}

/**
 * A plugin definition that may carry version/registry metadata. We augment the spec `Definition` type locally so the
 * feature keeps compiling regardless of the installed `@perses-dev/spec` version.
 */
type VersionedDefinition = Definition<unknown> & { metadata?: PluginDefinitionMetadata };

/**
 * Sentinel version meaning "the latest version available in the instance" (mirrors the Go `plugin.LatestVersion`).
 * A definition using it is not considered pinned to a specific version.
 */
export const LATEST_VERSION = 'latest';

/**
 * Plugin types whose definitions may appear inside a dashboard spec and therefore can be pinned to a version when the
 * dashboard is "locked".
 */
export const PLUGIN_VERSIONING_TYPES: PluginType[] = [
  'Panel',
  'TimeSeriesQuery',
  'TraceQuery',
  'ProfileQuery',
  'LogQuery',
  'AlertsQuery',
  'SilencesQuery',
  'Variable',
  'Datasource',
  'Annotation',
];

/** Split a version string into its numeric segments, ignoring a leading `v`. */
function normalizeVersion(version: string): number[] {
  return version
    .replace(/^v/, '')
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10));
}

/**
 * Compare two version strings using a best-effort semantic-versioning comparison.
 * Returns a positive number when `a` is greater than `b`, a negative number when it is lower, and 0 when equal.
 */
export function compareVersions(a: string, b: string): number {
  const aParts = normalizeVersion(a);
  const bParts = normalizeVersion(b);
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];
    // If a segment is not a number (e.g. a pre-release tag), fall back to a string comparison of the whole version.
    if (aPart === undefined || Number.isNaN(aPart) || bPart === undefined || Number.isNaN(bPart)) {
      return a.localeCompare(b);
    }
    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }
  return 0;
}

/**
 * Extract the version associated with a piece of plugin metadata, preferring the plugin-level version and falling back
 * to the containing module's version.
 */
function getPluginVersion(metadata: PluginMetadataWithModule): string | undefined {
  return metadata.metadata?.version ?? metadata.module?.version;
}

/**
 * Build a map of plugin kind (e.g. "TimeSeriesChart") to the latest version currently available in the instance, based
 * on the installed plugin metadata returned by the plugin registry.
 */
export function buildLatestPluginVersions(pluginMetadata: PluginMetadataWithModule[]): Map<string, string> {
  const versions = new Map<string, string>();
  for (const metadata of pluginMetadata) {
    const name = metadata.spec?.name;
    const version = getPluginVersion(metadata);
    if (!name || !version) {
      continue;
    }
    const existing = versions.get(name);
    if (existing === undefined || compareVersions(version, existing) > 0) {
      versions.set(name, version);
    }
  }
  return versions;
}

/**
 * Visit every plugin definition contained in a dashboard spec, invoking the provided callback for each one. Covers
 * panel plugins, panel query plugins, list-variable plugins, datasource plugins and annotation plugins.
 */
function visitPluginDefinitions(
  dashboard: DashboardResource,
  visitor: (definition: VersionedDefinition) => void,
): void {
  const spec = dashboard.spec;

  // Panels and their queries
  for (const panel of Object.values(spec.panels ?? {})) {
    if (panel?.spec?.plugin) {
      visitor(panel.spec.plugin as VersionedDefinition);
    }
    for (const query of panel?.spec?.queries ?? []) {
      if (query?.spec?.plugin) {
        visitor(query.spec.plugin as VersionedDefinition);
      }
    }
  }

  // Variables (only list variables reference a plugin)
  for (const variable of spec.variables ?? []) {
    if (variable?.kind === 'ListVariable' && variable.spec?.plugin) {
      visitor(variable.spec.plugin as VersionedDefinition);
    }
  }

  // Datasources
  for (const datasource of Object.values(spec.datasources ?? {})) {
    if (datasource?.plugin) {
      visitor(datasource.plugin as VersionedDefinition);
    }
  }

  // Annotations
  for (const annotation of spec.annotations ?? []) {
    if (annotation?.plugin) {
      visitor(annotation.plugin as VersionedDefinition);
    }
  }
}

/** Context about where a plugin definition lives inside the dashboard spec. */
interface PluginDefinitionContext {
  /** The plugin type (e.g. 'Panel', 'TimeSeriesQuery', 'Variable', ...). */
  pluginType: PluginType;
  /** Key of the panel the definition belongs to, for panel plugins and panel query plugins. */
  panelKey?: string;
}

/**
 * Like {@link visitPluginDefinitions}, but also provides the plugin type and (when relevant) the panel key that the
 * definition belongs to. Used to tell panel plugins apart from query/variable/datasource/annotation plugins.
 */
function visitPluginDefinitionsWithContext(
  dashboard: DashboardResource,
  visitor: (definition: VersionedDefinition, context: PluginDefinitionContext) => void,
): void {
  const spec = dashboard.spec;

  for (const [panelKey, panel] of Object.entries(spec.panels ?? {})) {
    if (panel?.spec?.plugin) {
      visitor(panel.spec.plugin as VersionedDefinition, { pluginType: 'Panel', panelKey });
    }
    for (const query of panel?.spec?.queries ?? []) {
      // For a query definition, `query.kind` is the query plugin type (e.g. 'TimeSeriesQuery').
      if (query?.spec?.plugin && query.kind) {
        visitor(query.spec.plugin as VersionedDefinition, { pluginType: query.kind as PluginType, panelKey });
      }
    }
  }

  for (const variable of spec.variables ?? []) {
    if (variable?.kind === 'ListVariable' && variable.spec?.plugin) {
      visitor(variable.spec.plugin as VersionedDefinition, { pluginType: 'Variable' });
    }
  }

  for (const datasource of Object.values(spec.datasources ?? {})) {
    if (datasource?.plugin) {
      visitor(datasource.plugin as VersionedDefinition, { pluginType: 'Datasource' });
    }
  }

  for (const annotation of spec.annotations ?? []) {
    if (annotation?.plugin) {
      visitor(annotation.plugin as VersionedDefinition, { pluginType: 'Annotation' });
    }
  }
}

/** A plugin definition pinned to a version older than the latest one available in the instance. */
export interface OutdatedPlugin {
  /** The plugin type (e.g. 'Panel', 'TimeSeriesQuery'). */
  pluginType: PluginType;
  /** The plugin kind/name (e.g. 'TimeSeriesChart'). */
  kind: string;
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
export function getOutdatedPluginId(plugin: Pick<OutdatedPlugin, 'pluginType' | 'kind' | 'currentVersion'>): string {
  return `${plugin.pluginType}:${plugin.kind}:${plugin.currentVersion}`;
}

/**
 * Find every plugin in the dashboard that is pinned to a version older than the latest version available in the
 * instance. Definitions without a pinned version are ignored: they already float on the latest version.
 */
export function findOutdatedPlugins(
  dashboard: DashboardResource,
  latestVersions: Map<string, string>,
): OutdatedPlugin[] {
  const outdated = new Map<string, OutdatedPlugin>();

  visitPluginDefinitionsWithContext(dashboard, (definition, context) => {
    const currentVersion = definition.metadata?.version;
    if (!currentVersion || currentVersion === LATEST_VERSION) {
      return;
    }
    const latestVersion = latestVersions.get(definition.kind);
    if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
      return;
    }

    const id = getOutdatedPluginId({ pluginType: context.pluginType, kind: definition.kind, currentVersion });
    const existing = outdated.get(id);
    if (existing) {
      existing.occurrences += 1;
      if (existing.examplePanelKey === undefined) {
        existing.examplePanelKey = context.panelKey;
      }
      return;
    }
    outdated.set(id, {
      pluginType: context.pluginType,
      kind: definition.kind,
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
  visitPluginDefinitionsWithContext(next, (definition, context) => {
    const currentVersion = definition.metadata?.version;
    if (!currentVersion) {
      return;
    }
    const id = getOutdatedPluginId({ pluginType: context.pluginType, kind: definition.kind, currentVersion });
    const latestVersion = targets.get(id);
    if (latestVersion) {
      definition.metadata = { ...definition.metadata, version: latestVersion };
    }
  });
  return next;
}

/**
 * Return a copy of the dashboard with every plugin definition pinned to its latest available version. Plugin
 * definitions whose kind is not present in the version map are left untouched.
 */
export function applyPluginVersions(dashboard: DashboardResource, versions: Map<string, string>): DashboardResource {
  const next = structuredClone(dashboard);
  visitPluginDefinitions(next, (definition) => {
    const version = versions.get(definition.kind);
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
 * A dashboard is considered "locked" as soon as at least one of its plugin definitions is pinned to a version.
 */
export function isDashboardLocked(dashboard: DashboardResource): boolean {
  let locked = false;
  visitPluginDefinitions(dashboard, (definition) => {
    if (definition.metadata?.version) {
      locked = true;
    }
  });
  return locked;
}

/**
 * Build a map of plugin kind (e.g. "TimeSeriesChart") to the full set of versions currently available in the instance,
 * based on the installed plugin metadata returned by the plugin registry.
 */
export function buildAvailablePluginVersions(pluginMetadata: PluginMetadataWithModule[]): Map<string, Set<string>> {
  const versions = new Map<string, Set<string>>();
  for (const metadata of pluginMetadata) {
    const name = metadata.spec?.name;
    const version = getPluginVersion(metadata);
    if (!name || !version) {
      continue;
    }
    let set = versions.get(name);
    if (!set) {
      set = new Set<string>();
      versions.set(name, set);
    }
    set.add(version);
  }
  return versions;
}

/** A plugin definition pinned to a version that is not available in the registry. */
export interface InvalidPinnedVersion {
  kind: string;
  version: string;
}

/**
 * Return the list of plugin definitions in the dashboard that are pinned to a version which is not present in the
 * provided set of available versions (built from the plugin registry). An empty result means every pin is valid.
 */
export function findInvalidPinnedVersions(
  dashboard: DashboardResource,
  availableVersions: Map<string, Set<string>>,
): InvalidPinnedVersion[] {
  const invalid: InvalidPinnedVersion[] = [];
  const seen = new Set<string>();
  visitPluginDefinitions(dashboard, (definition) => {
    const version = definition.metadata?.version;
    if (!version) {
      return;
    }
    const identity = `${definition.kind}@${version}`;
    if (seen.has(identity)) {
      return;
    }
    seen.add(identity);
    const versions = availableVersions.get(definition.kind);
    if (!versions || !versions.has(version)) {
      invalid.push({ kind: definition.kind, version });
    }
  });
  return invalid;
}
