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

/**
 * Optional display override on standard formats.
 * `unit` remains the stable key (multi-axis, maps, UI config);
 * `customLabel` only changes the text shown after the scaled quantity.
 *
 * Data sizes (bytes/bits): keep SI/IEC scale (Ki, Mi, K, M, …) and replace the
 * base unit — e.g. "1.46 KiB" + "prout" → "1.46 Ki prout" (not "gigaprout").
 * Dates stay untouched (structured timestamps).
 */

export type WithCustomLabel = {
  customLabel?: string;
};

/** Units where customLabel is not applied (unstructured / identity formats). */
const CUSTOM_LABEL_EXCLUDED_UNITS = new Set([
  'datetime-iso',
  'datetime-us',
  'datetime-local',
  'date-iso',
  'date-us',
  'date-local',
  'time-local',
  'time-iso',
  'time-us',
  'relative-time',
  'unix-timestamp',
  'unix-timestamp-ms',
]);

const DATA_SIZE_UNITS = new Set([
  'bytes',
  'decbytes',
  'bits',
  'decbits',
  'bytes/sec',
  'decbytes/sec',
  'bits/sec',
  'decbits/sec',
]);

const CURRENCY_UNITS = new Set([
  'usd',
  'eur',
  'gbp',
  'jpy',
  'cny',
  'cad',
  'aud',
  'chf',
  'hkd',
  'sgd',
  'sek',
  'krw',
  'nok',
  'nzd',
  'inr',
  'mxn',
  'twd',
  'zar',
  'brl',
  'dkk',
  'pln',
  'thb',
  'ils',
  'czk',
  'clp',
  'php',
  'aed',
  'cop',
  'sar',
  'myr',
  'ron',
  'afn',
]);

/**
 * Whether FormatControls / formatValue should honor customLabel for this unit key.
 */
export function supportsCustomLabel(unit?: string): boolean {
  if (!unit) {
    return true;
  }
  return !CUSTOM_LABEL_EXCLUDED_UNITS.has(unit);
}

/** Sign + number (grouped / scientific). */
const LEADING_NUMBER = /^[+-]?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

/**
 * If customLabel is set and the unit is supported, replace the standard unit text
 * with the display label. Dates leave `formatted` unchanged.
 */
export function applyCustomLabel(formatted: string, customLabel?: string, unit?: string): string {
  const label = customLabel?.trim();
  if (!label) {
    return formatted;
  }
  if (!supportsCustomLabel(unit)) {
    return formatted;
  }

  if (unit && DATA_SIZE_UNITS.has(unit)) {
    return applyDataSizeCustomLabel(formatted, label);
  }

  if (unit && CURRENCY_UNITS.has(unit)) {
    return applyCurrencyCustomLabel(formatted, label);
  }

  // formatTime zero sentinel
  if (formatted === '0s') {
    return `0 ${label}`;
  }

  // Percent: "12.3%" → "12.3 load"
  if (unit === 'percent' || unit === 'percent-decimal') {
    if (formatted.endsWith('%')) {
      return `${formatted.slice(0, -1).trimEnd()} ${label}`;
    }
  }

  // Temperature: "11°C" / "52°F"
  if (unit === 'celsius' && formatted.endsWith('°C')) {
    return `${formatted.slice(0, -2).trimEnd()} ${label}`;
  }
  if (unit === 'fahrenheit' && formatted.endsWith('°F')) {
    return `${formatted.slice(0, -2).trimEnd()} ${label}`;
  }

  // Exact unit-key suffix: "10 ops/sec", "1.5K ops/sec"
  if (unit && formatted.endsWith(` ${unit}`)) {
    return `${formatted.slice(0, -(unit.length + 1))} ${label}`;
  }

  // Time / decimal: keep leading quantity only (drops "ms", " month", …)
  const qty = leadingQuantity(formatted);
  if (qty !== null) {
    return `${qty} ${label}`;
  }

  return `${formatted} ${label}`;
}

/**
 * Bytes/bits (+ optional /s|/sec): keep scale (Ki, Mi, K, M, …), replace base unit.
 * "1.46 KiB" + prout → "1.46 Ki prout"
 * "1.5 KB/s" + wire → "1.5 K wire/s"
 * "500 bytes" + prout → "500 prout"
 */
function applyDataSizeCustomLabel(formatted: string, label: string): string {
  let rate = '';
  let body = formatted.trim();
  const rateM = body.match(/(\/s(?:ec)?)$/i);
  if (rateM?.[1]) {
    rate = rateM[1];
    body = body.slice(0, -rate.length).trimEnd();
  }

  // Long form: "500 bytes", "1,500 bits"
  const long = body.match(/^(.+?)\s+(bytes?|bits?)$/i);
  if (long?.[1]) {
    return `${long[1].trim()} ${label}${rate}`;
  }

  // Short form: "1.46 KiB", "1.5 KB", "1.46 Kib", "1.5 Kb" (optional space before scale)
  const short = body.match(/^(.+?)\s*([KMGTPE]i?)\s*([Bb])$/);
  if (short?.[1] && short[2]) {
    return `${short[1].trim()} ${short[2]} ${label}${rate}`;
  }

  const qty = leadingQuantity(body);
  if (qty !== null) {
    return `${qty} ${label}${rate}`;
  }
  return `${formatted} ${label}`;
}

/**
 * Currency: drop symbol/code, keep amount + custom label.
 * "$1,500" + credits → "1,500 credits"
 */
function applyCurrencyCustomLabel(formatted: string, label: string): string {
  // Strip common leading/trailing currency symbols and ISO codes
  let body = formatted.trim();
  body = body.replace(/^[^\d+-]+/, ''); // leading $ € …
  body = body.replace(/\s*[A-Z]{3}$/, ''); // trailing USD
  body = body.trim();
  const qty = leadingQuantity(body);
  if (qty !== null) {
    // Keep grouping from the rest of the amount if present after qty
    const rest = body.slice(qty.length);
    // If rest is only grouping leftovers empty, use qty; else full body without symbols
    if (rest === '' || /^[\d,.]+$/.test(body.replace(LEADING_NUMBER, ''))) {
      return `${body} ${label}`;
    }
    return `${body} ${label}`;
  }
  return `${body} ${label}`;
}

/**
 * Numeric prefix of a formatted value, keeping SI compact (1.5K)
 * but not unit letters glued to the number (500ms → 500, not 500m).
 */
function leadingQuantity(formatted: string): string | null {
  const s = formatted.trimStart();
  const num = s.match(LEADING_NUMBER);
  if (!num?.[0]) {
    return null;
  }
  const head = num[0];
  const rest = s.slice(head.length);

  // Compact decimal suffix K/M/B/T only when not starting a longer unit word (ms, min, …).
  const compact = rest.match(/^([KMBT])(?=\s|$)/i);
  if (compact) {
    return head + compact[1];
  }

  return head;
}
