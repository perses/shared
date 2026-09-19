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

import { applyCustomLabel, supportsCustomLabel } from './custom';
import { formatValue } from './units';

describe('supportsCustomLabel', () => {
  it('allows decimal, time, percent, throughput, data sizes, currency', () => {
    expect(supportsCustomLabel('decimal')).toBe(true);
    expect(supportsCustomLabel('ops/sec')).toBe(true);
    expect(supportsCustomLabel('milliseconds')).toBe(true);
    expect(supportsCustomLabel('bytes')).toBe(true);
    expect(supportsCustomLabel('bytes/sec')).toBe(true);
    expect(supportsCustomLabel('usd')).toBe(true);
    expect(supportsCustomLabel(undefined)).toBe(true);
  });

  it('rejects date/time identity formats', () => {
    expect(supportsCustomLabel('datetime-iso')).toBe(false);
    expect(supportsCustomLabel('unix-timestamp')).toBe(false);
  });
});

describe('applyCustomLabel', () => {
  it('replaces spaced unit suffix', () => {
    expect(applyCustomLabel('1.5K ops/sec', 'pnr/mn', 'ops/sec')).toBe('1.5K pnr/mn');
  });

  it('replaces percent suffix without leaving %', () => {
    expect(applyCustomLabel('12%', 'load', 'percent')).toBe('12 load');
  });

  it('replaces celsius suffix', () => {
    expect(applyCustomLabel('11°C', 'room', 'celsius')).toBe('11 room');
  });

  it('returns unchanged when label empty', () => {
    expect(applyCustomLabel('42 ops/sec', '', 'ops/sec')).toBe('42 ops/sec');
  });

  it('replaces Intl time narrow suffixes (ms, s)', () => {
    expect(applyCustomLabel('500ms', 'latency', 'milliseconds')).toBe('500 latency');
    expect(applyCustomLabel('1.5s', 'wait', 'seconds')).toBe('1.5 wait');
  });

  it('replaces Intl time long suffixes (month)', () => {
    expect(applyCustomLabel('1 month', 'period', 'months')).toBe('1 period');
    expect(applyCustomLabel('2 months', 'period', 'months')).toBe('2 period');
  });

  it('time zero sentinel', () => {
    expect(applyCustomLabel('0s', 'period', 'months')).toBe('0 period');
  });

  it('data size: keeps IEC scale, replaces base unit (not glued gigaprout)', () => {
    expect(applyCustomLabel('1.46 KiB', 'prout', 'bytes')).toBe('1.46 Ki prout');
    expect(applyCustomLabel('1.4 GiB', 'prout', 'bytes')).toBe('1.4 Gi prout');
    expect(applyCustomLabel('500 bytes', 'prout', 'bytes')).toBe('500 prout');
  });

  it('data size rate: keeps scale and /s', () => {
    expect(applyCustomLabel('1.46 KiB/s', 'wire', 'bytes/sec')).toBe('1.46 Ki wire/s');
    expect(applyCustomLabel('1.5 KB/s', 'wire', 'decbytes/sec')).toBe('1.5 K wire/s');
    expect(applyCustomLabel('500 bytes/sec', 'wire', 'bytes/sec')).toBe('500 wire/sec');
  });

  it('currency: amount + custom label', () => {
    expect(applyCustomLabel('$1,500', 'credits', 'usd')).toBe('1,500 credits');
    expect(applyCustomLabel('€12.3', 'credits', 'eur')).toBe('12.3 credits');
  });

  it('dates unchanged', () => {
    const iso = '2023-11-14T22:13:20.000Z';
    expect(applyCustomLabel(iso, 'ignored', 'datetime-iso')).toBe(iso);
  });
});

describe('formatValue with customLabel', () => {
  it('keeps unit key ops/sec and shows custom label', () => {
    expect(formatValue(1500, { unit: 'ops/sec', shortValues: true, customLabel: 'pnr/mn' })).toBe('1.5K pnr/mn');
  });

  it('works with decimal base', () => {
    expect(formatValue(12.34, { unit: 'decimal', decimalPlaces: 1, customLabel: 'pax/mn' })).toBe('12.3 pax/mn');
  });

  it('percent custom label replaces %', () => {
    const out = formatValue(0.5, { unit: 'percent', customLabel: 'util' });
    expect(out).not.toContain('%');
    expect(out).toContain('util');
  });

  it('without customLabel is unchanged', () => {
    expect(formatValue(10, { unit: 'ops/sec' })).toBe('10 ops/sec');
  });

  it('time months: no residual month/ms unit text', () => {
    const out = formatValue(1, { unit: 'months', customLabel: 'billing' });
    expect(out.toLowerCase()).not.toMatch(/month|ms\b|week|day/);
    expect(out).toContain('billing');
  });

  it('time milliseconds: no residual ms', () => {
    const out = formatValue(500, { unit: 'milliseconds', customLabel: 'latency' });
    expect(out.toLowerCase()).not.toContain('ms');
    expect(out).toContain('latency');
  });

  it('bytes: scale kept, base replaced', () => {
    const out = formatValue(1_500_000_000, { unit: 'bytes', shortValues: true, customLabel: 'prout' });
    expect(out).toMatch(/Gi prout$/);
    expect(out.toLowerCase()).not.toContain('gib');
    expect(out).not.toMatch(/gigaprout/i);
  });

  it('bytes/sec: scale + rate kept', () => {
    const out = formatValue(1_500_000, { unit: 'bytes/sec', shortValues: true, customLabel: 'wire' });
    expect(out).toMatch(/Mi wire\/s$/);
  });

  it('usd custom label', () => {
    const out = formatValue(1500, { unit: 'usd', customLabel: 'credits' });
    expect(out).toContain('credits');
    expect(out).not.toContain('$');
  });

  it('datetime-iso ignores customLabel', () => {
    const plain = formatValue(1_700_000_000, { unit: 'datetime-iso' });
    const labeled = formatValue(1_700_000_000, { unit: 'datetime-iso', customLabel: 'when' });
    expect(labeled).toBe(plain);
  });

  // Time ticks rescale via Intl (month / week / day / ms); customLabel must fully replace each.
  it('months customLabel: every tick scale is fully overridden (no mixed suffixes)', () => {
    const label = 'custom';
    const fmt = { unit: 'months' as const, customLabel: label };
    const values = [1, 0.5, 0.1, 0.01, 0];
    for (const v of values) {
      const out = formatValue(v, fmt);
      expect(out, `value=${v}`).toMatch(new RegExp(`${label}$`));
      expect(out.toLowerCase(), `value=${v}`).not.toMatch(/\b(month|months|week|weeks|day|days|hour|ms|s)\b/);
    }
  });
});
