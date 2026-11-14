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
import { appendLinkState, tagLinkTargets } from './tag-links';
import type { TagLinkHit } from './tag-links';

const hits: TagLinkHit[] = [
  { name: 'current', label: 'Current', variableNames: ['env'] },
  { name: 'service-detail', label: 'Service detail', variableNames: ['env', 'region'] },
  { name: 'billing', label: 'Billing' },
];

describe('tagLinkTargets', () => {
  it('drops the current dashboard and sorts by label', () => {
    expect(tagLinkTargets(hits, 'current').map((target) => target.name)).toEqual(['billing', 'service-detail']);
  });

  it('keeps the variable names returned by the search', () => {
    expect(tagLinkTargets(hits, 'current').find((target) => target.name === 'service-detail')).toEqual({
      name: 'service-detail',
      label: 'Service detail',
      variableNames: ['env', 'region'],
    });
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

  it('appends time without rewriting the original query', () => {
    expect(
      appendLinkState('https://example.com/runbook?a=b%20c&flag#section', {
        keepTime: true,
        includeVariables: false,
        timeRange: { pastDuration: '1h' },
      }),
    ).toBe('https://example.com/runbook?a=b%20c&flag&start=1h#section');
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

describe('appendLinkState variable filter', () => {
  it('forwards only the variables named by the caller', () => {
    expect(
      appendLinkState('/perses/projects/demo/dashboards/service-detail', {
        keepTime: true,
        includeVariables: true,
        timeRange: { pastDuration: '1h' },
        variables: {
          env: { value: 'production' },
          missing: { value: 'nope' },
          empty: { value: '' },
        },
        variableNames: ['env', 'region'],
      }),
    ).toBe('/perses/projects/demo/dashboards/service-detail?start=1h&var-env=production');
  });

  it('encodes an absolute time range in unix milliseconds', () => {
    expect(
      appendLinkState('/projects/demo/dashboards/service%20detail', {
        keepTime: true,
        includeVariables: false,
        timeRange: { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-01-01T01:00:00Z') },
      }),
    ).toBe('/projects/demo/dashboards/service%20detail?start=1767225600000&end=1767229200000');
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
      renderVariables: true,
      keepTime: true,
      includeVariables: true,
    });
  });

  it('drops the URL when saving a tag link', () => {
    expect(normalizeDashboardLink({ name: ' Menu ', url: '', tags: [' traffic '], keepTime: true })).toEqual({
      name: 'Menu',
      tags: ['traffic'],
      keepTime: true,
    });
  });

  it('rejects more than 20 tags and a tag longer than 50 characters', () => {
    expect(isDashboardLinkValid({ name: 'Menu', tags: Array.from({ length: 21 }, (_, index) => `tag${index}`) })).toBe(
      false,
    );
    expect(isDashboardLinkValid({ name: 'Menu', tags: ['x'.repeat(51)] })).toBe(false);
  });
});
