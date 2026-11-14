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

export interface TagLinkHit {
  name: string;
  label: string;
  variableNames?: string[];
}

export interface TagLinkTarget {
  name: string;
  label: string;
  variableNames: string[];
}

export function tagLinkTargets(hits: TagLinkHit[], currentName: string): TagLinkTarget[] {
  const targets: TagLinkTarget[] = [];
  for (const hit of hits) {
    if (hit.name === currentName) {
      continue;
    }
    targets.push({
      name: hit.name,
      label: hit.label.trim() || hit.name,
      variableNames: hit.variableNames ?? [],
    });
  }
  return targets.toSorted(
    (left, right) => left.label.localeCompare(right.label) || left.name.localeCompare(right.name),
  );
}

/** Appends time and variables to an existing URL. A URL copies every current variable. */
export function appendLinkState(
  url: string,
  input: {
    keepTime: boolean;
    includeVariables: boolean;
    timeRange?: TimeRangeValue;
    variables?: Record<string, { value: VariableValue }>;
    variableNames?: string[];
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
  const originalQuery = queryAt >= 0 ? beforeHash.slice(queryAt + 1) : '';
  const { replace, additions } = linkStateParams(input);
  const kept = originalQuery
    .split('&')
    .filter((part) => part !== '' && !replace.has(queryParamName(part)))
    .join('&');
  const query = [kept, additions.join('&')].filter((part) => part !== '').join('&');
  return query === '' ? `${path}${hash}` : `${path}?${query}${hash}`;
}

function linkStateParams(input: {
  keepTime: boolean;
  includeVariables: boolean;
  timeRange?: TimeRangeValue;
  variables?: Record<string, { value: VariableValue }>;
  variableNames?: string[];
}): { replace: Set<string>; additions: string[] } {
  const replace = new Set<string>();
  const additions: string[] = [];
  if (input.keepTime && input.timeRange) {
    appendTimeRange(replace, additions, input.timeRange);
  }
  if (input.includeVariables && input.variables) {
    const allowed = input.variableNames === undefined ? undefined : new Set(input.variableNames);
    for (const name of Object.keys(input.variables).toSorted()) {
      if (allowed && !allowed.has(name)) {
        continue;
      }
      const encoded = encodeVariableValue(input.variables[name]?.value ?? null);
      if (!encoded) {
        continue;
      }
      const key = `var-${name}`;
      replace.add(key);
      additions.push(encodeQueryParam(key, encoded));
    }
  }
  return { replace, additions };
}

function appendTimeRange(replace: Set<string>, additions: string[], timeRange: TimeRangeValue): void {
  if (isRelativeTimeRange(timeRange)) {
    replace.add('start');
    additions.push(encodeQueryParam('start', timeRange.pastDuration));
    return;
  }
  const start = encodeTimeRangeValue(timeRange.start);
  const end = encodeTimeRangeValue(timeRange.end);
  if (start) {
    replace.add('start');
    additions.push(encodeQueryParam('start', start));
  }
  if (end) {
    replace.add('end');
    additions.push(encodeQueryParam('end', end));
  }
}

function queryParamName(part: string): string {
  const eq = part.indexOf('=');
  const raw = eq >= 0 ? part.slice(0, eq) : part;
  return decodeURIComponent(raw.replaceAll('+', ' '));
}

function encodeQueryParam(name: string, value: string): string {
  return new URLSearchParams([[name, value]]).toString();
}
