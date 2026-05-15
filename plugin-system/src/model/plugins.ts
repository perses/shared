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

import { UnknownSpec } from '@perses-dev/spec';
import { DatasourcePlugin } from './datasource';
import { PanelPlugin } from './panels';
import { Plugin } from './plugin-base';
import { TimeSeriesQueryPlugin } from './time-series-queries';
import { TraceQueryPlugin } from './trace-queries';
import { ProfileQueryPlugin } from './profile-queries';
import { VariablePlugin } from './variables';
import { ExplorePlugin } from './explore';
import { LogQueryPlugin } from './log-queries';

export interface PluginModuleSpec {
  plugins: PluginMetadata[];
}

export interface PluginMetadataWithModule extends PluginMetadata {
  module: PluginModuleMetadata;
}

/**
 * Metadata about an individual plugin that's part of a PluginModule.
 */
export interface PluginMetadata {
  kind: PluginType;
  metadata?: {
    version?: string;
    registry?: string;
  };
  spec: {
    name: string;
    display: {
      name: string;
      description?: string;
    };
  };
}

/**
 * Metadata about a module/package that contains plugins.
 */
export interface PluginModuleMetadata {
  name: string;
  version: string;
  registry?: string;
}

/**
 * Information about a module/package that contains plugins.
 */
export interface PluginModuleResource {
  kind: 'PluginModule';
  metadata: PluginModuleMetadata;
  spec: PluginModuleSpec;
}

/**
 * All supported plugin types. A plugin's implementation must extend from `Plugin<UnknownSpec>` to be considered a valid
 * `PluginType`.
 */
export type PluginType = {
  // Filter out implementations on SupportedPlugins that don't extend `Plugin<UnknownSpec>`
  [K in keyof SupportedPlugins]: SupportedPlugins[K] extends Plugin<UnknownSpec> ? K : never;
}[keyof SupportedPlugins];

/**
 * Map of plugin type key/string -> implementation type. Use Typescript module augmentation to extend the plugin system
 * with new plugin types.
 */
export interface SupportedPlugins {
  Variable: VariablePlugin;
  Panel: PanelPlugin;
  TimeSeriesQuery: TimeSeriesQueryPlugin;
  TraceQuery: TraceQueryPlugin;
  ProfileQuery: ProfileQueryPlugin;
  LogQuery: LogQueryPlugin;
  Datasource: DatasourcePlugin;
  Explore: ExplorePlugin;
}

/**
 * The implementation for a given plugin type.
 */
export type PluginImplementation<Type extends PluginType> = SupportedPlugins[Type];

/**
 * Default plugin kinds by plugin type.
 */
type PluginKinds = Partial<Record<PluginType, string>>;
export type DefaultPluginKinds = Required<Pick<PluginKinds, 'TimeSeriesQuery'>> & Omit<PluginKinds, 'TimeSeriesQuery'>;

export type PluginCompoundKey<T extends PluginType> = {
  kind: T;
  name: string;
  registry?: string;
  version?: string;
};

export function getPluginModuleCompoundKey(compoundKey: {
  kind: string;
  name: string;
  registry?: string;
  version?: string;
}): string {
  const { kind, name, registry, version } = compoundKey;
  return `${kind}:${name}:${registry ?? ''}:${version ?? ''}`;
}
