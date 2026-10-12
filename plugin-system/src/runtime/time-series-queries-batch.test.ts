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

import { afterEach, describe, expect, it } from 'vitest';
import { isQueryBatchEnabled } from './time-series-queries';

describe('isQueryBatchEnabled', () => {
  afterEach(() => {
    delete (window as unknown as { __PERSES_QUERY_BATCH__?: boolean }).__PERSES_QUERY_BATCH__;
    window.localStorage.removeItem('perses.queryBatch');
  });

  it('defaults to false', () => {
    expect(isQueryBatchEnabled()).toBe(false);
    expect(isQueryBatchEnabled(undefined)).toBe(false);
    expect(isQueryBatchEnabled('')).toBe(false);
  });

  it('honors window force true/false over everything', () => {
    (window as unknown as { __PERSES_QUERY_BATCH__: boolean }).__PERSES_QUERY_BATCH__ = true;
    expect(isQueryBatchEnabled('off')).toBe(true);
    (window as unknown as { __PERSES_QUERY_BATCH__: boolean }).__PERSES_QUERY_BATCH__ = false;
    expect(isQueryBatchEnabled('panel')).toBe(false);
  });

  it('honors dashboard mode panel/viewport/dashboard/on', () => {
    expect(isQueryBatchEnabled('panel')).toBe(true);
    expect(isQueryBatchEnabled('viewport')).toBe(true);
    expect(isQueryBatchEnabled('dashboard')).toBe(true);
    expect(isQueryBatchEnabled('on')).toBe(true);
    expect(isQueryBatchEnabled('true')).toBe(true);
    expect(isQueryBatchEnabled('1')).toBe(true);
    expect(isQueryBatchEnabled('PANEL')).toBe(true);
  });

  it('honors dashboard mode off', () => {
    window.localStorage.setItem('perses.queryBatch', '1');
    expect(isQueryBatchEnabled('off')).toBe(false);
    expect(isQueryBatchEnabled('false')).toBe(false);
    expect(isQueryBatchEnabled('0')).toBe(false);
  });

  it('falls back to localStorage when mode absent', () => {
    expect(isQueryBatchEnabled()).toBe(false);
    window.localStorage.setItem('perses.queryBatch', '1');
    expect(isQueryBatchEnabled()).toBe(true);
    expect(isQueryBatchEnabled('unknown')).toBe(true);
  });
});
