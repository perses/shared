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

import type { BitsFormatOptions } from './bits';
import { formatBits, BITS_GROUP_CONFIG, BITS_UNIT_CONFIG } from './bits';
import type { BytesFormatOptions } from './bytes';
import { formatBytes, BYTES_GROUP_CONFIG, BYTES_UNIT_CONFIG } from './bytes';
import type { CurrencyFormatOptions } from './currency';
import { formatCurrency, CURRENCY_GROUP_CONFIG, CURRENCY_UNIT_CONFIG } from './currency';
import type { WithCustomLabel } from './custom';
import { applyCustomLabel, supportsCustomLabel } from './custom';
import type { DateFormatOptions } from './date';
import { formatDate, DATE_GROUP_CONFIG, DATE_UNIT_CONFIG } from './date';
import type { DecimalFormatOptions } from './decimal';
import { formatDecimal, DECIMAL_GROUP_CONFIG, DECIMAL_UNIT_CONFIG } from './decimal';
import type { PercentFormatOptions } from './percent';
import { formatPercent, PERCENT_GROUP_CONFIG, PERCENT_UNIT_CONFIG } from './percent';
import type { TemperatureFormatOptions } from './temperature';
import { TEMPERATURE_GROUP_CONFIG, formatTemperature, TEMPERATURE_UNIT_CONFIG } from './temperature';
import type { ThroughputFormatOptions } from './throughput';
import { formatThroughput, THROUGHPUT_GROUP_CONFIG, THROUGHPUT_UNIT_CONFIG } from './throughput';
import type { TimeFormatOptions } from './time';
import { formatTime, TIME_GROUP_CONFIG, TIME_UNIT_CONFIG } from './time';
import type { UnitGroup, UnitGroupConfig, UnitConfig } from './types';

/**
 * Most of the number formatting is based on Intl.NumberFormat, which is built into JavaScript.
 * Prefer Intl.NumbeFormat because it covers most use cases and will continue to be supported with time.
 *
 * To format bytes, we also make use of the `numbro` package,
 * because it can handle adding units like KB, MB, GB, etc. correctly.
 */

export const UNIT_GROUP_CONFIG: Readonly<Record<UnitGroup, UnitGroupConfig>> = {
  Time: TIME_GROUP_CONFIG,
  Percent: PERCENT_GROUP_CONFIG,
  Decimal: DECIMAL_GROUP_CONFIG,
  Bytes: BYTES_GROUP_CONFIG,
  Bits: BITS_GROUP_CONFIG,
  Throughput: THROUGHPUT_GROUP_CONFIG,
  Currency: CURRENCY_GROUP_CONFIG,
  Temperature: TEMPERATURE_GROUP_CONFIG,
  Date: DATE_GROUP_CONFIG,
};
export const UNIT_CONFIG = {
  ...TIME_UNIT_CONFIG,
  ...PERCENT_UNIT_CONFIG,
  ...DECIMAL_UNIT_CONFIG,
  ...BYTES_UNIT_CONFIG,
  ...BITS_UNIT_CONFIG,
  ...THROUGHPUT_UNIT_CONFIG,
  ...CURRENCY_UNIT_CONFIG,
  ...TEMPERATURE_UNIT_CONFIG,
  ...DATE_UNIT_CONFIG,
} as const;

/** Standard unit options plus optional display override (customLabel). */
export type FormatOptions = (
  | TimeFormatOptions
  | PercentFormatOptions
  | DecimalFormatOptions
  | BytesFormatOptions
  | BitsFormatOptions
  | ThroughputFormatOptions
  | CurrencyFormatOptions
  | TemperatureFormatOptions
  | DateFormatOptions
) &
  WithCustomLabel;

type HasDecimalPlaces<UnitOpt> = UnitOpt extends { decimalPlaces?: number } ? UnitOpt : never;
type HasShortValues<UnitOpt> = UnitOpt extends { shortValues?: boolean } ? UnitOpt : never;

export function formatValue(value: number, formatOptions?: FormatOptions): string {
  if (!formatOptions) {
    return value.toString();
  }

  let formatted: string;
  if (isBytesUnit(formatOptions)) {
    formatted = formatBytes(value, formatOptions);
  } else if (isBitsUnit(formatOptions)) {
    formatted = formatBits(value, formatOptions);
  } else if (isDecimalUnit(formatOptions)) {
    formatted = formatDecimal(value, formatOptions);
  } else if (isPercentUnit(formatOptions)) {
    formatted = formatPercent(value, formatOptions);
  } else if (isTimeUnit(formatOptions)) {
    formatted = formatTime(value, formatOptions);
  } else if (isThroughputUnit(formatOptions)) {
    formatted = formatThroughput(value, formatOptions);
  } else if (isCurrencyUnit(formatOptions)) {
    formatted = formatCurrency(value, formatOptions);
  } else if (isDateUnit(formatOptions)) {
    formatted = formatDate(value, formatOptions);
  } else if (isTemperatureUnit(formatOptions)) {
    formatted = formatTemperature(value, formatOptions);
  } else {
    const exhaustive: never = formatOptions;
    throw new Error(`Unknown unit options ${exhaustive}`);
  }

  return applyCustomLabel(formatted, formatOptions.customLabel, formatOptions.unit);
}

export function getUnitConfig(formatOptions: FormatOptions): UnitConfig {
  const unit = formatOptions.unit ?? 'decimal';
  const config = UNIT_CONFIG[unit];
  const customLabel = formatOptions.customLabel?.trim();
  // Only override display name when customLabel is supported for this unit key.
  if (customLabel && supportsCustomLabel(unit)) {
    return { ...config, label: customLabel };
  }
  return config;
}

export function getUnitGroup(formatOptions: FormatOptions): UnitGroup {
  return getUnitConfig(formatOptions).group ?? 'Decimal';
}

export function getUnitGroupConfig(formatOptions: FormatOptions): UnitGroupConfig {
  const unitConfig = getUnitConfig(formatOptions);
  return UNIT_GROUP_CONFIG[unitConfig.group ?? 'Decimal'];
}

// Type guards
export function isTimeUnit(formatOptions: FormatOptions): formatOptions is TimeFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Time';
}

export function isPercentUnit(formatOptions: FormatOptions): formatOptions is PercentFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Percent';
}

export function isDecimalUnit(formatOptions: FormatOptions): formatOptions is DecimalFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Decimal';
}

export function isBytesUnit(formatOptions: FormatOptions): formatOptions is BytesFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Bytes';
}

export function isBitsUnit(formatOptions: FormatOptions): formatOptions is BitsFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Bits';
}

export function isUnitWithDecimalPlaces(
  formatOptions: FormatOptions,
): formatOptions is HasDecimalPlaces<FormatOptions> {
  const groupConfig = getUnitGroupConfig(formatOptions);

  return !!groupConfig.decimalPlaces;
}

export function isUnitWithShortValues(formatOptions: FormatOptions): formatOptions is HasShortValues<FormatOptions> {
  const groupConfig = getUnitGroupConfig(formatOptions);

  return !!groupConfig.shortValues;
}

export function isThroughputUnit(
  formatOptions: FormatOptions,
): formatOptions is ThroughputFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Throughput';
}

export function isCurrencyUnit(formatOptions: FormatOptions): formatOptions is CurrencyFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Currency';
}

export function isDateUnit(formatOptions: FormatOptions): formatOptions is DateFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Date';
}

export function isTemperatureUnit(
  formatOptions: FormatOptions,
): formatOptions is TemperatureFormatOptions & WithCustomLabel {
  return getUnitGroup(formatOptions) === 'Temperature';
}
