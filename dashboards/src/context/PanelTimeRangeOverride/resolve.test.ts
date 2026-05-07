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

// LOGZ.IO CHANGE START:: Tests for panel-level time range override resolver [APPZ-2474]
import { AbsoluteTimeRange, RelativeTimeRange } from '@perses-dev/core';
import {
  ResolvedTimeRange,
  getPanelTimeOverrideLabel,
  parseGrafanaTimeOverride,
  resolvePanelTimeOverride,
} from './resolve';

describe('parseGrafanaTimeOverride()', () => {
  it.each([
    ['14d', '14d'],
    ['now-14d', '14d'],
    ['1h30m', '1h30m'],
    ['now-1h30m', '1h30m'],
  ])('parses %s -> %s', (input, expected) => {
    expect(parseGrafanaTimeOverride(input)).toBe(expected);
  });

  it('strips alignment modifier and warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(parseGrafanaTimeOverride('now-7d/d')).toBe('7d');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it.each([undefined, '', '   ', 'now', 'foo', 'now-foo', 'now-/d'])('rejects %p', (input) => {
    expect(parseGrafanaTimeOverride(input)).toBeNull();
  });
});

describe('resolvePanelTimeOverride()', () => {
  // Pin "now" so the test is deterministic.
  const NOW = new Date('2026-01-15T12:00:00Z');
  const DAY_MS = 24 * 60 * 60 * 1000;

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  const parentAbsolute: AbsoluteTimeRange = {
    start: new Date(NOW.getTime() - 6 * 60 * 60 * 1000), // now-6h
    end: NOW,
  };
  const parentRelative: RelativeTimeRange = { pastDuration: '6h' };
  const parent: ResolvedTimeRange = { timeRange: parentRelative, absoluteTimeRange: parentAbsolute };

  it('returns parent unchanged when override is empty', () => {
    expect(resolvePanelTimeOverride(parent, {})).toBe(parent);
  });

  it('returns parent unchanged when override fields are unparseable', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(resolvePanelTimeOverride(parent, { timeFrom: 'foo' })).toBe(parent);
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('applies timeFrom anchored to now', () => {
    const result = resolvePanelTimeOverride(parent, { timeFrom: '14d' });
    expect((result.timeRange as RelativeTimeRange).pastDuration).toBe('14d');
    expect(result.absoluteTimeRange.end.getTime()).toBe(NOW.getTime());
    expect(result.absoluteTimeRange.start.getTime()).toBe(NOW.getTime() - 14 * DAY_MS);
  });

  it('treats "14d" and "now-14d" identically', () => {
    const a = resolvePanelTimeOverride(parent, { timeFrom: '14d' });
    const b = resolvePanelTimeOverride(parent, { timeFrom: 'now-14d' });
    expect(a.absoluteTimeRange).toEqual(b.absoluteTimeRange);
  });

  it('applies timeShift to parent range when timeFrom is absent', () => {
    const result = resolvePanelTimeOverride(parent, { timeShift: '1d' });
    // Result should be absolute (shift makes the relative anchor stale).
    expect((result.timeRange as AbsoluteTimeRange).start).toBeInstanceOf(Date);
    expect(result.absoluteTimeRange.end.getTime()).toBe(NOW.getTime() - DAY_MS);
    expect(result.absoluteTimeRange.start.getTime()).toBe(parentAbsolute.start.getTime() - DAY_MS);
  });

  it('applies timeFrom then timeShift in order', () => {
    const result = resolvePanelTimeOverride(parent, { timeFrom: '14d', timeShift: '1d' });
    // Expected: [now-15d, now-1d]
    expect(result.absoluteTimeRange.end.getTime()).toBe(NOW.getTime() - DAY_MS);
    expect(result.absoluteTimeRange.start.getTime()).toBe(NOW.getTime() - 15 * DAY_MS);
  });

  it('ignores invalid timeShift but honors timeFrom', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = resolvePanelTimeOverride(parent, { timeFrom: '14d', timeShift: 'foo' });
      expect((result.timeRange as RelativeTimeRange).pastDuration).toBe('14d');
      expect(result.absoluteTimeRange.end.getTime()).toBe(NOW.getTime());
    } finally {
      warn.mockRestore();
    }
  });

  it('treats absolute parent and relative parent the same when timeShift is applied', () => {
    const absParent: ResolvedTimeRange = {
      timeRange: parentAbsolute,
      absoluteTimeRange: parentAbsolute,
    };
    const a = resolvePanelTimeOverride(absParent, { timeShift: '1d' });
    const b = resolvePanelTimeOverride(parent, { timeShift: '1d' });
    expect(a.absoluteTimeRange).toEqual(b.absoluteTimeRange);
  });
});

describe('getPanelTimeOverrideLabel()', () => {
  it('returns null when no override is active', () => {
    expect(getPanelTimeOverrideLabel({})).toBeNull();
  });

  it('returns null when hideTimeOverride is true', () => {
    expect(getPanelTimeOverrideLabel({ timeFrom: '14d', hideTimeOverride: true })).toBeNull();
  });

  it('formats timeFrom only', () => {
    expect(getPanelTimeOverrideLabel({ timeFrom: '14d' })).toBe('⏱ Last 14d');
  });

  it('formats timeShift only', () => {
    expect(getPanelTimeOverrideLabel({ timeShift: '1d' })).toBe('⏱ shifted 1d');
  });

  it('formats both', () => {
    expect(getPanelTimeOverrideLabel({ timeFrom: '14d', timeShift: '1d' })).toBe('⏱ Last 14d, shifted 1d');
  });

  it('returns null on invalid spec values', () => {
    expect(getPanelTimeOverrideLabel({ timeFrom: 'foo' })).toBeNull();
  });
});
// LOGZ.IO CHANGE END:: Tests for panel-level time range override resolver [APPZ-2474]
