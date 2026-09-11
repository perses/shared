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

import { getFormatterStats } from './formatterCache';
import type { UnitTestCase } from './types';
import { formatValue } from './units';

const THROUGHPUT_TESTS: UnitTestCase[] = [
  {
    value: -4444,
    format: { unit: 'counts/sec' },
    expected: '-4.44K counts/sec',
  },
  {
    value: -4444,
    format: { unit: 'ops/sec', shortValues: false },
    expected: '-4,444 ops/sec',
  },
  {
    value: -4444,
    format: { unit: 'requests/sec', shortValues: false, decimalPlaces: 4 },
    expected: '-4,444.0000 requests/sec',
  },
  {
    value: -4444,
    format: { unit: 'reads/sec', shortValues: true },
    expected: '-4.44K reads/sec',
  },
  {
    value: -4444,
    format: { unit: 'writes/sec', shortValues: true, decimalPlaces: 4 },
    expected: '-4.4440K writes/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'events/sec' },
    expected: '-0.123 events/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'messages/sec', shortValues: false },
    expected: '-0.123 messages/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'records/sec', shortValues: false, decimalPlaces: 4 },
    expected: '-0.1235 records/sec',
  },
  {
    value: -0.123456789,
    format: { unit: 'rows/sec', shortValues: true },
    expected: '-0.123 rows/sec',
  },
  { value: 0, format: { unit: 'counts/sec' }, expected: '0 counts/sec' },
  { value: 1, format: { unit: 'ops/sec' }, expected: '1 ops/sec' },
  {
    value: 1000,
    format: { unit: 'decbytes/sec' },
    expected: '1 KB/s',
  },
  {
    value: 1024,
    format: { unit: 'bytes/sec' },
    expected: '1 KiB/s',
  },
  {
    value: 1000,
    format: { unit: 'decbits/sec' },
    expected: '1 Kb/s',
  },
  {
    value: 1024,
    format: { unit: 'bits/sec' },
    expected: '1 Kib/s',
  },
  // Additional rate units
  { value: 42, format: { unit: 'tps' }, expected: '42 tps' },
  { value: 1.5, format: { unit: 'trc/s' }, expected: '1.5 trc/s' },
  { value: 10, format: { unit: 'trx/s' }, expected: '10 trx/s' },
  { value: 3, format: { unit: 'e/s' }, expected: '3 e/s' },
  { value: 7, format: { unit: 'op/s' }, expected: '7 op/s' },
  { value: 7, format: { unit: 'ops/s' }, expected: '7 ops/s' },
  { value: 100, format: { unit: 'msg/s' }, expected: '100 msg/s' },
  { value: 2, format: { unit: 'errors/s' }, expected: '2 errors/s' },
  { value: 5, format: { unit: 'calls/s' }, expected: '5 calls/s' },
  { value: 9, format: { unit: 'qps' }, expected: '9 qps' },
  { value: 1, format: { unit: 'drop/s' }, expected: '1 drop/s' },
  { value: 1, format: { unit: 'reject/s' }, expected: '1 reject/s' },
  { value: 4, format: { unit: 'requests/s' }, expected: '4 requests/s' },
  { value: 8, format: { unit: 'flows/s' }, expected: '8 flows/s' },
  { value: 2, format: { unit: 'fail/sec' }, expected: '2 fail/sec' },
  { value: 1, format: { unit: 'to/s' }, expected: '1 to/s' },
  { value: 6, format: { unit: 'count:tps' }, expected: '6 tps' },
  { value: 6, format: { unit: 'count:traces/s' }, expected: '6 traces/s' },
  { value: 6, format: { unit: 'count:msg/s' }, expected: '6 msg/s' },
];

describe('formatValue', () => {
  it.each(THROUGHPUT_TESTS)('returns $expected when $value formatted as $format', (args: UnitTestCase) => {
    const { value, format, expected } = args;
    expect(formatValue(value, format)).toEqual(expected);
  });

  it('should get identical formatters from cache', () => {
    const { countCacheItems, getKeys } = getFormatterStats();
    // Cache keys include unit id; extra rate units add entries after the core set.
    expect(countCacheItems('throughput')).toBeGreaterThanOrEqual(10);
    const keys = getKeys('throughput');
    expect(keys).toContain('decimal|true|false|ops/sec|en-US');
    expect(keys).toContain('decimal|true|false|tps|en-US');
    expect(keys).toContain('decimal|true|false|count:tps|en-US');
  });
});
