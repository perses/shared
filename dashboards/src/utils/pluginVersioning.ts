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

import { Definition } from '@perses-dev/spec';
import { DashboardResource } from '@perses-dev/client';
import { PluginMetadataWithModule, PluginType } from '@perses-dev/plugin-system';

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

/**
 * Compare two version strings using a best-effort semantic-versioning comparison.
 * Returns a positive number when `a` is greater than `b`, a negative number when it is lower, and 0 when equal.
 */
export function compareVersions(a: string, b: string): number {
  const normalize = (v: string): number[] =>
    v
      .replace(/^v/, '')
      .split(/[.+-]/)
      .map((part) => Number.parseInt(part, 10));

  const aParts = normalize(a);
  const bParts = normalize(b);
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
  visitor: (definition: VersionedDefinition) => void
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

/** Deep-clone a dashboard resource so mutations don't affect the source object. */
function cloneDashboard(dashboard: DashboardResource): DashboardResource {
  return JSON.parse(JSON.stringify(dashboard));
}

/**
 * Return a copy of the dashboard with every plugin definition pinned to its latest available version. Plugin
 * definitions whose kind is not present in the version map are left untouched.
 */
export function applyPluginVersions(dashboard: DashboardResource, versions: Map<string, string>): DashboardResource {
  const next = cloneDashboard(dashboard);
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
  const next = cloneDashboard(dashboard);
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
