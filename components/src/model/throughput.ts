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

import { formatBits } from './bits';
import { formatBytes } from './bytes';
import { MAX_SIGNIFICANT_DIGITS } from './constants';
import { getFormatterFromCache } from './formatterCache';
import type { UnitGroupConfig, UnitConfig } from './types';
import { hasDecimalPlaces, limitDecimalPlaces, shouldShortenValues } from './utils';

type ThroughputUnit =
  | 'bits/sec'
  | 'decbits/sec'
  | 'bytes/sec'
  | 'decbytes/sec'
  | 'counts/sec'
  | 'events/sec'
  | 'messages/sec'
  | 'ops/sec'
  | 'packets/sec'
  | 'reads/sec'
  | 'records/sec'
  | 'requests/sec'
  | 'rows/sec'
  | 'writes/sec'
  // Additional rate units (unit id = display suffix)
  | 'tps'
  | 'trc/s'
  | 'trx/s'
  | 'e/s'
  | 'op/s'
  | 'ops/s'
  | 'msg/s'
  | 'msg/sec'
  | 'errors/s'
  | 'calls/s'
  | 'qps'
  | 'drop/s'
  | 'reject/s'
  | 'requests/s'
  | 'flows/s'
  | 'fail/sec'
  | 'to/s'
  | 'c/s'
  | 'gc/s'
  | 'tk/s'
  | 'cxn/s'
  | 'count:tps'
  | 'count:traces/s'
  | 'count:msg/s';
export type ThroughputFormatOptions = {
  unit?: ThroughputUnit;
  decimalPlaces?: number;
  shortValues?: boolean;
};
export const THROUGHPUT_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Throughput',
  decimalPlaces: true,
};
const THROUGHPUT_GROUP = 'Throughput';
export const THROUGHPUT_UNIT_CONFIG: Readonly<Record<ThroughputUnit, UnitConfig>> = {
  'bits/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Bits/sec (IEC)',
  },
  'decbits/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Bits/sec (SI)',
  },
  'bytes/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Bytes/sec (IEC)',
  },
  'decbytes/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Bytes/sec (SI)',
  },

  'counts/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Counts/sec',
  },
  'events/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Events/sec',
  },
  'messages/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Messages/sec',
  },
  'ops/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Ops/sec',
  },
  'packets/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Packets/sec',
  },
  'reads/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Reads/sec',
  },
  'requests/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Requests/sec',
  },
  'records/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Records/sec',
  },
  'rows/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Rows/sec',
  },
  'writes/sec': {
    group: THROUGHPUT_GROUP,
    label: 'Writes/sec',
  },

  tps: { group: THROUGHPUT_GROUP, label: 'Transactions/sec (tps)' },
  'trc/s': { group: THROUGHPUT_GROUP, label: 'Traces/sec' },
  'trx/s': { group: THROUGHPUT_GROUP, label: 'Transactions/sec (trx/s)' },
  'e/s': { group: THROUGHPUT_GROUP, label: 'Events/sec (e/s)' },
  'op/s': { group: THROUGHPUT_GROUP, label: 'Ops/sec (op/s)' },
  'ops/s': { group: THROUGHPUT_GROUP, label: 'Ops/sec (ops/s)' },
  'msg/s': { group: THROUGHPUT_GROUP, label: 'Messages/sec (msg/s)' },
  'msg/sec': { group: THROUGHPUT_GROUP, label: 'Messages/sec (msg/sec)' },
  'errors/s': { group: THROUGHPUT_GROUP, label: 'Errors/sec' },
  'calls/s': { group: THROUGHPUT_GROUP, label: 'Calls/sec' },
  qps: { group: THROUGHPUT_GROUP, label: 'Queries/sec (qps)' },
  'drop/s': { group: THROUGHPUT_GROUP, label: 'Drops/sec' },
  'reject/s': { group: THROUGHPUT_GROUP, label: 'Rejects/sec' },
  'requests/s': { group: THROUGHPUT_GROUP, label: 'Requests/sec (requests/s)' },
  'flows/s': { group: THROUGHPUT_GROUP, label: 'Flows/sec' },
  'fail/sec': { group: THROUGHPUT_GROUP, label: 'Failures/sec' },
  'to/s': { group: THROUGHPUT_GROUP, label: 'Timeouts/sec' },
  'c/s': { group: THROUGHPUT_GROUP, label: 'Contentions/sec' },
  'gc/s': { group: THROUGHPUT_GROUP, label: 'GC/sec' },
  'tk/s': { group: THROUGHPUT_GROUP, label: 'Tokens/sec' },
  'cxn/s': { group: THROUGHPUT_GROUP, label: 'Connections/sec' },
  'count:tps': { group: THROUGHPUT_GROUP, label: 'Count tps' },
  'count:traces/s': { group: THROUGHPUT_GROUP, label: 'Count traces/sec' },
  'count:msg/s': { group: THROUGHPUT_GROUP, label: 'Count msg/sec' },
};

/** Display suffix for axis/stat (strip leading `count:` when present). */
function throughputSuffix(unit: ThroughputUnit | undefined): string {
  if (!unit) {
    return '';
  }
  if (unit.startsWith('count:')) {
    return unit.slice('count:'.length);
  }
  return unit;
}

export function formatThroughput(value: number, { unit, shortValues, decimalPlaces }: ThroughputFormatOptions): string {
  // special case for data throughput
  if (unit === 'bits/sec') {
    const denominator = Math.abs(value) < 1024 ? 'sec' : 's';
    return formatBits(value, { unit: 'bits', shortValues, decimalPlaces }) + '/' + denominator;
  }

  if (unit === 'decbits/sec') {
    const denominator = Math.abs(value) < 1000 ? 'sec' : 's';
    return formatBits(value, { unit: 'decbits', shortValues, decimalPlaces }) + '/' + denominator;
  }

  if (unit === 'decbytes/sec') {
    const denominator = Math.abs(value) < 1000 ? 'sec' : 's';
    return formatBytes(value, { unit: 'decbytes', shortValues, decimalPlaces }) + '/' + denominator;
  }

  if (unit === 'bytes/sec') {
    const denominator = Math.abs(value) < 1024 ? 'sec' : 's';
    return formatBytes(value, { unit: 'bytes', shortValues, decimalPlaces }) + '/' + denominator;
  }

  const formatterOptions: Intl.NumberFormatOptions = {
    style: 'decimal',
    useGrouping: true,
  };

  if (shouldShortenValues(shortValues)) {
    formatterOptions.notation = 'compact';
  }

  if (hasDecimalPlaces(decimalPlaces)) {
    formatterOptions.minimumFractionDigits = limitDecimalPlaces(decimalPlaces);
    formatterOptions.maximumFractionDigits = limitDecimalPlaces(decimalPlaces);
  } else {
    if (shouldShortenValues(shortValues)) {
      formatterOptions.maximumSignificantDigits = MAX_SIGNIFICANT_DIGITS;
    }
  }

  const key = [
    formatterOptions.style,
    formatterOptions.useGrouping,
    formatterOptions.notation,
    formatterOptions.maximumSignificantDigits,
    decimalPlaces,
    shortValues,
    unit,
  ];

  const suffix = throughputSuffix(unit);
  return `${getFormatterFromCache(key, 'throughput', formatterOptions, 'en-US')(value)} ${suffix}`;
}
