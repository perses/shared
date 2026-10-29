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

import { describe, expect, it } from 'vitest';

import { isDashboardLinkValid, isTagLink, normalizeDashboardLink } from './dashboard-link';
import { appBasePath, appendLinkState, buildTagLinkHref, selectTagLinkTargets } from './tag-links';
import type { TagLinkDashboard } from './tag-links';

const dashboards: TagLinkDashboard[] = [
  {
    kind: 'Dashboard',
    metadata: { name: 'current', project: 'demo', tags: ['traffic'] },
    spec: { display: { name: 'Current' }, variables: [{ spec: { name: 'env' } }] },
  },
  {
    kind: 'Dashboard',
    metadata: { name: 'service-detail', project: 'demo', tags: ['traffic', 'api'] },
    spec: { display: { name: 'Service detail' }, variables: [{ spec: { name: 'env' } }, { spec: { name: 'region' } }] },
  },
  {
    kind: 'Dashboard',
    metadata: { name: 'other', project: 'demo', tags: ['billing'] },
    spec: { display: { name: 'Billing' } },
  },
  {
    kind: 'Dashboard',
    metadata: { name: 'abroad', project: 'other', tags: ['traffic'] },
    spec: { display: { name: 'Abroad' } },
  },
  {
    kind: 'EphemeralDashboard',
    metadata: { name: 'scratch', project: 'demo', tags: ['traffic'] },
    spec: { display: { name: 'Scratch' } },
  },
];

describe('selectTagLinkTargets', () => {
  it('keeps dashboards that have every tag and drops the current dashboard', () => {
    expect(
      selectTagLinkTargets({ dashboards, tags: ['traffic'], project: 'demo', currentName: 'current' }).map(
        (target) => target.name,
      ),
    ).toEqual(['service-detail']);
  });

  it('matches tags with AND', () => {
    expect(
      selectTagLinkTargets({ dashboards, tags: ['traffic', 'api'], project: 'demo', currentName: 'current' }),
    ).toEqual([{ name: 'service-detail', label: 'Service detail', variableNames: ['env', 'region'] }]);
  });
});

describe('buildTagLinkHref', () => {
  it('forwards the relative time range and variables that exist on the destination', () => {
    expect(
      buildTagLinkHref({
        basePath: '/perses',
        project: 'demo',
        name: 'service-detail',
        keepTime: true,
        includeVariables: true,
        timeRange: { pastDuration: '1h' },
        variables: {
          env: { value: 'production' },
          missing: { value: 'nope' },
          empty: { value: '' },
        },
        destinationVariableNames: ['env', 'region'],
      }),
    ).toBe('/perses/projects/demo/dashboards/service-detail?start=1h&var-env=production');
  });

  it('encodes an absolute time range in unix milliseconds', () => {
    const href = buildTagLinkHref({
      basePath: '',
      project: 'demo',
      name: 'service detail',
      keepTime: true,
      includeVariables: false,
      timeRange: { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-01-01T01:00:00Z') },
      variables: {},
      destinationVariableNames: [],
    });
    expect(href).toBe('/projects/demo/dashboards/service%20detail?start=1767225600000&end=1767229200000');
  });
});

describe('appendLinkState', () => {
  it('copies the time range and every current variable onto a URL', () => {
    expect(
      appendLinkState('https://example.com/runbook?page=1#section', {
        keepTime: true,
        includeVariables: true,
        timeRange: { pastDuration: '1h' },
        variables: {
          region: { value: 'eu' },
          env: { value: 'production' },
          empty: { value: '' },
        },
      }),
    ).toBe('https://example.com/runbook?page=1&start=1h&var-env=production&var-region=eu#section');
  });

  it('leaves a URL unchanged when both flags are off', () => {
    expect(
      appendLinkState('https://example.com/runbook', {
        keepTime: false,
        includeVariables: false,
        timeRange: { pastDuration: '1h' },
        variables: { env: { value: 'production' } },
      }),
    ).toBe('https://example.com/runbook');
  });
});

describe('appBasePath', () => {
  it('returns the path before /projects/', () => {
    expect(appBasePath('/perses/projects/demo/dashboards/overview')).toBe('/perses');
    expect(appBasePath('/projects/demo/dashboards/overview')).toBe('');
  });
});

describe('dashboard link validity', () => {
  it('accepts a URL link and a named tag link', () => {
    expect(isTagLink({ url: 'https://perses.dev' })).toBe(false);
    expect(isDashboardLinkValid({ url: 'https://perses.dev' })).toBe(true);
    expect(isTagLink({ name: 'Menu', tags: ['traffic'] })).toBe(true);
    expect(isDashboardLinkValid({ name: 'Menu', tags: [' traffic '] })).toBe(true);
    expect(isDashboardLinkValid({ tags: ['traffic'] })).toBe(false);
    expect(isDashboardLinkValid({ name: 'Both', url: 'https://perses.dev', tags: ['traffic'] })).toBe(false);
  });

  it('keeps time and variable flags on a URL link', () => {
    expect(
      normalizeDashboardLink({
        name: 'Docs',
        url: ' https://perses.dev ',
        keepTime: true,
        includeVariables: true,
        renderVariables: true,
      }),
    ).toEqual({
      name: 'Docs',
      url: 'https://perses.dev',
      tooltip: undefined,
      renderVariables: true,
      targetBlank: undefined,
      keepTime: true,
      includeVariables: true,
    });
  });

  it('drops the URL when saving a tag link', () => {
    expect(normalizeDashboardLink({ name: ' Menu ', url: '', tags: [' traffic '], keepTime: true })).toEqual({
      name: 'Menu',
      tooltip: undefined,
      tags: ['traffic'],
      keepTime: true,
      includeVariables: undefined,
    });
  });
});
