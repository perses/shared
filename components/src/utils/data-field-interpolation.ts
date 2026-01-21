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

import { interpolate, InterpolationFormat } from './variable-interpolation';

/**
 * Data item with its fields (used for selection/row data)
 */
export type DataItem = Record<string, unknown>;

/**
 * Result of interpolation with data fields
 */
export interface InterpolationResult {
  text: string;
  errors?: string[];
}

/**
 * Options for data field replacement
 */
export interface ReplaceDataFieldsOptions {
  /**
   * Whether to URL encode values. Defaults to true.
   */
  urlEncode?: boolean;
  /**
   * Current index (0-based) for ${__data.index} replacement.
   */
  index?: number;
  /**
   * Total count for ${__data.count} replacement.
   */
  count?: number;
}

// Regex patterns for data field interpolation
// Matches: ${__data.fields["fieldName"]} or ${__data.fields['fieldName']} or ${__data.fields.fieldName} with optional format ${__data.fields["fieldName"]:format}
const SINGLE_FIELD_REGEX =
  /\$\{__data\.fields(?:\[(?:"|')([^"']+)(?:"|')\]|\.([a-zA-Z_][a-zA-Z0-9_]*))(?::([a-z]+))?\}/g;

// Matches: ${__data[0].fields["fieldName"]} or ${__data[0].fields['fieldName']} for indexed access
const INDEXED_FIELD_REGEX = /\$\{__data\[(\d+)\]\.fields\[(?:"|')([^"']+)(?:"|')\]\}/g;

// Matches: ${__data.index}
const DATA_INDEX_REGEX = /\$\{__data\.index\}/g;

// Matches: ${__data.count}
const DATA_COUNT_REGEX = /\$\{__data\.count\}/g;

// Matches: ${__data} or ${__data:format} or '${__data:format}' or "${__data:format}"
const FULL_DATA_REGEX = /("|')?\$\{__data(?::([a-z]+))?\}("|')?/g;

/**
 * Get field value from a data item, converting to string.
 * Supports nested field access using dot notation in field names (e.g., "foo.bar" accesses item.foo.bar).
 * For backward compatibility, first checks if the exact key exists before attempting nested access.
 */
function getFieldValue(item: DataItem, fieldName: string): string {
  // First, try direct property access (for backward compatibility with literal dot keys)
  if (Object.prototype.hasOwnProperty.call(item, fieldName)) {
    const value = item[fieldName];
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  // If not found and contains dots, try nested access
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.');
    let current: unknown = item;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return '';
      }
      if (typeof current !== 'object') {
        return '';
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (current === undefined || current === null) {
      return '';
    }
    if (typeof current === 'object') {
      return JSON.stringify(current);
    }
    return String(current);
  }

  // Field not found
  return '';
}

/**
 * Parse format string to InterpolationFormat enum
 */
export function parseFormat(format: string | undefined): InterpolationFormat | undefined {
  if (!format) return undefined;
  const lowerFormat = format.toLowerCase();
  return Object.values(InterpolationFormat).find((f) => f === lowerFormat);
}

/**
 * Replace data field placeholders in a template string with values from a single data item.
 *
 * Supports:
 * - ${__data.fields["fieldName"]} - field value from the item (URL encoded by default)
 * - ${__data.fields["fieldName"]:format} - field value with format specifier
 * - ${__data.index} - current index (0-based) if provided in options
 * - ${__data.count} - total count if provided in options
 * - ${__data} - full data array
 * - ${__data:format} - full data array with format specifier
 *
 * @param template - The template string with placeholders
 * @param item - The data item containing field values
 * @param options - Optional configuration for replacement behavior
 * @returns InterpolationResult with the interpolated text and any errors
 */
export function replaceDataFields(
  template: string,
  item: DataItem,
  options: ReplaceDataFieldsOptions = {}
): InterpolationResult {
  const { urlEncode = true, index, count } = options;
  let result = template;
  const errors: string[] = [];

  // Replace ${__data.index} if provided
  if (index !== undefined) {
    result = result.replaceAll(DATA_INDEX_REGEX, String(index));
  }

  // Replace ${__data.count} if provided
  if (count !== undefined) {
    result = result.replaceAll(DATA_COUNT_REGEX, String(count));
  }

  // Replace full data placeholder with optional format: ${__data} or ${__data:format}
  result = result.replaceAll(
    FULL_DATA_REGEX,
    (_match, _leadingQuote: string | undefined, format: string | undefined, _trailingQuote: string | undefined) => {
      const interpolationFormat = parseFormat(format) ?? InterpolationFormat.RAW;
      let interpolationResult: string = '';

      if (interpolationFormat === InterpolationFormat.JSON) {
        interpolationResult = JSON.stringify(item);
      } else {
        interpolationResult = interpolate(
          Object.values(item).map((v) => JSON.stringify(v)),
          '',
          interpolationFormat
        );
      }

      return interpolationResult;
    }
  );

  // Reset regex lastIndex
  SINGLE_FIELD_REGEX.lastIndex = 0;

  // Replace __data.fields["fieldName"] or __data.fields.fieldName patterns
  result = result.replaceAll(
    SINGLE_FIELD_REGEX,
    (_match, bracketField: string | undefined, dotField: string | undefined, format: string | undefined) => {
      const fieldName = bracketField ?? dotField ?? '';
      const value = getFieldValue(item, fieldName);
      if (value === '' && item[fieldName] === undefined) {
        errors.push(`Field "${fieldName}" not found in data`);
      }
      const interpolationFormat = parseFormat(format);
      if (interpolationFormat) {
        return interpolate([value], fieldName, interpolationFormat);
      }

      if (urlEncode) {
        // override: disable urlEncode for RAW format
        if (interpolationFormat === InterpolationFormat.RAW) {
          return value;
        }

        // avoid double encoding for queryparam and percentencode formats
        if (
          interpolationFormat !== InterpolationFormat.QUERYPARAM &&
          interpolationFormat !== InterpolationFormat.PERCENTENCODE
        ) {
          return encodeURIComponent(value);
        }
      }

      return value;
    }
  );

  return { text: result, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Replace data field placeholders in a template string with values from multiple data items (batch mode).
 *
 * Supports:
 * - ${__data[0].fields["fieldName"]} - field value from specific item by index
 * - ${__data.fields["fieldName"]} - aggregated field values (defaults to CSV format)
 * - ${__data.fields["fieldName"]:csv} - aggregated field values with format specifier
 * - ${__data.count} - total number of items
 * - ${__data} - full data array
 * - ${__data:format} - full data array with format specifier
 *
 * @param template - The template string with placeholders
 * @param items - Array of data items containing field values
 * @param options - Optional configuration for replacement behavior
 * @returns InterpolationResult with the interpolated text and any errors
 */
export function replaceDataFieldsBatch(
  template: string,
  items: DataItem[],
  options: ReplaceDataFieldsOptions = {}
): InterpolationResult {
  const { urlEncode = true } = options;
  let result = template;
  const errors: string[] = [];

  // Replace __data.count with items length
  result = result.replaceAll(DATA_COUNT_REGEX, String(items.length));

  // Reset regex lastIndex
  INDEXED_FIELD_REGEX.lastIndex = 0;
  SINGLE_FIELD_REGEX.lastIndex = 0;

  // Replace full data placeholder with optional format
  result = result.replaceAll(
    FULL_DATA_REGEX,
    (_match, leadingQuote: string | undefined, format: string | undefined, trailingQuote: string | undefined) => {
      const interpolationFormat = parseFormat(format) ?? InterpolationFormat.RAW;

      const interpolationResult = interpolate(
        Object.values(items).map((e) => JSON.stringify(e)),
        '',
        interpolationFormat
      );

      if (!leadingQuote || !trailingQuote) {
        // preserve quotes as they were not surrounding the full_data pattern
        return `${leadingQuote ?? ''}${interpolationResult}${trailingQuote ?? ''}`;
      }

      return interpolationResult;
    }
  );

  // Replace indexed access: ${__data[0].fields["fieldName"]} or ${__data[0].fields['fieldName']}
  result = result.replaceAll(INDEXED_FIELD_REGEX, (match, indexStr: string, fieldName: string) => {
    const idx = parseInt(indexStr, 10);
    if (idx < 0 || idx >= items.length) {
      errors.push(`Index ${idx} out of bounds (0-${items.length - 1})`);
      return match;
    }
    const value = getFieldValue(items[idx]!, fieldName);
    if (value === '' && items[idx]![fieldName] === undefined) {
      errors.push(`Field "${fieldName}" not found in data at index ${idx}`);
    }
    return urlEncode ? encodeURIComponent(value) : value;
  });

  // Replace aggregated access with format: ${__data.fields["fieldName"]:csv} or ${__data.fields.fieldName:csv}
  result = result.replaceAll(
    SINGLE_FIELD_REGEX,
    (_match, bracketField: string | undefined, dotField: string | undefined, format: string | undefined) => {
      const fieldName = bracketField ?? dotField ?? '';
      const values = items.map((item) => getFieldValue(item, fieldName));
      const interpolationFormat = parseFormat(format) || InterpolationFormat.CSV;
      return interpolate(values, fieldName, interpolationFormat);
    }
  );

  return { text: result, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Check if a template contains batch-only patterns (indexed access or format specifiers)
 */
export function hasBatchPatterns(template: string): boolean {
  // Reset regex lastIndex
  INDEXED_FIELD_REGEX.lastIndex = 0;
  return (
    INDEXED_FIELD_REGEX.test(template) ||
    /\$\{__data\.fields(?:\[["'][^"']+["']\]|\.[a-zA-Z_][a-zA-Z0-9_]*):[a-z]+\}/.test(template)
  );
}

/**
 * Check if a template contains indexed access patterns
 */
export function hasIndexedPatterns(template: string): boolean {
  INDEXED_FIELD_REGEX.lastIndex = 0;
  return INDEXED_FIELD_REGEX.test(template);
}

/**
 * Check if a template contains data field patterns
 */
export function hasDataFieldPatterns(template: string): boolean {
  SINGLE_FIELD_REGEX.lastIndex = 0;
  INDEXED_FIELD_REGEX.lastIndex = 0;
  return SINGLE_FIELD_REGEX.test(template) || INDEXED_FIELD_REGEX.test(template);
}

/**
 * Extract all field names referenced in a template
 */
export function extractFieldNames(template: string): string[] {
  const fields = new Set<string>();

  // Reset regex lastIndex
  SINGLE_FIELD_REGEX.lastIndex = 0;
  INDEXED_FIELD_REGEX.lastIndex = 0;

  let match;
  while ((match = SINGLE_FIELD_REGEX.exec(template)) !== null) {
    // Group 1 is bracket notation, group 2 is dot notation
    fields.add(match[1] ?? match[2]!);
  }
  while ((match = INDEXED_FIELD_REGEX.exec(template)) !== null) {
    fields.add(match[2]!);
  }

  return Array.from(fields);
}
