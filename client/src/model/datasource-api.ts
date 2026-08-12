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

import { DatasourceSpec, HTTPProxy, UnknownSpec } from '@perses-dev/spec';

import { fetch } from '../util';
import { DatasourceResource, DatasourceSelector, GlobalDatasourceResource } from './datasource';

/**
 * Parameters for building a datasource proxy URL
 */
export interface BuildDatasourceProxyUrlParams {
  project?: string;
  dashboard?: string;
  /** Omit to generate an unsaved-datasource proxy URL */
  name?: string;
}

/**
 * Function type for building datasource proxy URLs
 */
export type BuildDatasourceProxyUrlFunc = (params: BuildDatasourceProxyUrlParams) => string;

/**
 * Builds a proxy URL for a datasource. When name is omitted the URL targets the
 * unsaved-datasource proxy endpoint (used for testing connectivity before saving).
 * Reads api_prefix from window.PERSES_APP_CONFIG if available.
 */
export function buildProxyUrl({ project, dashboard, name }: BuildDatasourceProxyUrlParams): string {
  const apiPrefix = (typeof window !== 'undefined' && window.PERSES_APP_CONFIG?.api_prefix) || '';
  let url = `${!project && !dashboard ? 'globaldatasources' : 'datasources'}`;
  if (dashboard) url = `dashboards/${encodeURIComponent(dashboard)}/${url}`;
  if (project) url = `projects/${encodeURIComponent(project)}/${url}`;
  url = name === undefined ? `unsaved/${url}` : `${url}/${encodeURIComponent(name)}`;
  return `${apiPrefix}/proxy/${url}`;
}

interface UnsavedDatasourceProxyBody {
  method: string;
  body?: Uint8Array | null;
  spec: DatasourceSpec;
}

function hasDirectUrl(pluginSpec: UnknownSpec): pluginSpec is { directUrl: string } {
  return (
    typeof pluginSpec === 'object' &&
    pluginSpec !== null &&
    typeof (pluginSpec as Record<string, unknown>)['directUrl'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function hasHTTPProxy(spec: UnknownSpec): spec is { proxy: HTTPProxy } {
  return (
    isRecord(spec) &&
    isRecord(spec['proxy']) &&
    spec['proxy']['kind'] === 'HTTPProxy' &&
    isRecord(spec['proxy']['spec']) &&
    typeof spec['proxy']['spec']['url'] === 'string'
  );
}
/**
 * Creates a function that tests connectivity for an unsaved datasource.
 * Supports directUrl (direct mode) and HTTPProxy (proxy mode).
 * Throws for any spec that does not match either shape.
 */
export function createTestDatasourceConnection({ project, dashboard }: { project?: string; dashboard?: string } = {}): (
  spec: DatasourceSpec,
  healthCheckPath: string,
) => Promise<void> {
  return async (spec: DatasourceSpec, healthCheckPath: string): Promise<void> => {
    const normalizedPath = healthCheckPath.startsWith('/') ? healthCheckPath : `/${healthCheckPath}`;
    const pluginSpec = spec.plugin.spec;

    if (hasDirectUrl(pluginSpec)) {
      await fetch(new URL(normalizedPath, pluginSpec.directUrl).toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (hasHTTPProxy(pluginSpec)) {
      const proxyUrl = buildProxyUrl({ project, dashboard });
      const body: UnsavedDatasourceProxyBody = { method: 'GET', spec, body: null };
      await fetch(`${proxyUrl}${normalizedPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      throw new Error(`Unsupported datasource spec type for plugin kind '${spec.plugin.kind}'`);
    }
  };
}

/**
 * The external API contract for fetching datasource resources.
 * This defines the interface that must be implemented to provide
 * datasource functionality to the dashboard.
 */
export interface DatasourceApi {
  /**
   * Optional function to build proxy URLs for datasources
   */
  buildProxyUrl?: BuildDatasourceProxyUrlFunc;
  /**
   * Get a datasource resource for a specific project
   */
  getDatasource: (project: string, selector: DatasourceSelector) => Promise<DatasourceResource | undefined>;
  /**
   * Get a global datasource resource
   */
  getGlobalDatasource: (selector: DatasourceSelector) => Promise<GlobalDatasourceResource | undefined>;
  /**
   * List all datasources for a project, optionally filtered by plugin kind
   */
  listDatasources: (project: string, pluginKind?: string) => Promise<DatasourceResource[]>;
  /**
   * List all global datasources, optionally filtered by plugin kind
   */
  listGlobalDatasources: (pluginKind?: string) => Promise<GlobalDatasourceResource[]>;
}
