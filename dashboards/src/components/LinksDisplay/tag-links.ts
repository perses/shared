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

import { encodeTimeRangeValue } from '@perses-dev/plugin-system';
import type { TimeRangeValue, VariableValue } from '@perses-dev/spec';
import { isRelativeTimeRange } from '@perses-dev/spec';

import { encodeVariableValue } from '../../context/VariableProvider/query-params';

export interface TagLinkDashboard {
  kind: string;
  metadata: {
    name: string;
    project?: string;
    tags?: string[];
  };
  spec?: {
    display?: { name?: string };
    variables?: Array<{ spec?: { name?: string } }>;
  };
}

export interface TagLinkTarget {
  name: string;
  label: string;
  variableNames: string[];
}

export function appBasePath(pathname: string): string {
  const marker = '/projects/';
  const index = pathname.indexOf(marker);
  if (index <= 0) {
    return '';
  }
  return pathname.slice(0, index);
}

export function selectTagLinkTargets(input: {
  dashboards: TagLinkDashboard[];
  tags: string[];
  project: string;
  currentName: string;
}): TagLinkTarget[] {
  const required = input.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  const targets: TagLinkTarget[] = [];
  for (const dashboard of input.dashboards) {
    if (dashboard.kind !== 'Dashboard') {
      continue;
    }
    if (dashboard.metadata.project !== undefined && dashboard.metadata.project !== input.project) {
      continue;
    }
    if (dashboard.metadata.name === input.currentName) {
      continue;
    }
    const have = new Set(dashboard.metadata.tags ?? []);
    if (!required.every((tag) => have.has(tag))) {
      continue;
    }
    const label = dashboard.spec?.display?.name?.trim() || dashboard.metadata.name;
    const variableNames = (dashboard.spec?.variables ?? [])
      .map((variable) => variable.spec?.name)
      .filter((name): name is string => Boolean(name));
    targets.push({ name: dashboard.metadata.name, label, variableNames });
  }
  return targets.toSorted(
    (left, right) => left.label.localeCompare(right.label) || left.name.localeCompare(right.name),
  );
}

export function buildTagLinkHref(input: {
  basePath: string;
  project: string;
  name: string;
  keepTime: boolean;
  includeVariables: boolean;
  timeRange: TimeRangeValue;
  variables: Record<string, { value: VariableValue }>;
  destinationVariableNames: string[];
}): string {
  const base = input.basePath.endsWith('/') ? input.basePath.slice(0, -1) : input.basePath;
  const path = `${base}/projects/${encodeURIComponent(input.project)}/dashboards/${encodeURIComponent(input.name)}`;
  const params = new URLSearchParams();
  appendLinkParams(params, input, new Set(input.destinationVariableNames));
  const query = params.toString();
  return query === '' ? path : `${path}?${query}`;
}

/** Appends time and variables to an existing URL. A URL copies every current variable. */
export function appendLinkState(
  url: string,
  input: {
    keepTime: boolean;
    includeVariables: boolean;
    timeRange: TimeRangeValue;
    variables: Record<string, { value: VariableValue }>;
  },
): string {
  if ((!input.keepTime && !input.includeVariables) || url === '') {
    return url;
  }
  const hashAt = url.indexOf('#');
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const beforeHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const queryAt = beforeHash.indexOf('?');
  const path = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;
  const params = new URLSearchParams(queryAt >= 0 ? beforeHash.slice(queryAt + 1) : '');
  appendLinkParams(params, input);
  const query = params.toString();
  return query === '' ? `${path}${hash}` : `${path}?${query}${hash}`;
}

function appendLinkParams(
  params: URLSearchParams,
  input: {
    keepTime: boolean;
    includeVariables: boolean;
    timeRange: TimeRangeValue;
    variables: Record<string, { value: VariableValue }>;
  },
  allowed?: Set<string>,
): void {
  if (input.keepTime) {
    appendTimeRange(params, input.timeRange);
  }
  if (!input.includeVariables) {
    return;
  }
  for (const name of Object.keys(input.variables).toSorted()) {
    if (allowed && !allowed.has(name)) {
      continue;
    }
    const encoded = encodeVariableValue(input.variables[name]?.value ?? null);
    if (!encoded) {
      continue;
    }
    params.set(`var-${name}`, encoded);
  }
}

function appendTimeRange(params: URLSearchParams, timeRange: TimeRangeValue): void {
  if (isRelativeTimeRange(timeRange)) {
    params.set('start', timeRange.pastDuration);
    return;
  }
  const start = encodeTimeRangeValue(timeRange.start);
  const end = encodeTimeRangeValue(timeRange.end);
  if (start) {
    params.set('start', start);
  }
  if (end) {
    params.set('end', end);
  }
}
