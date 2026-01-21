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

import { DataItem, InterpolationResult, replaceDataFields, replaceDataFieldsBatch } from './data-field-interpolation';
import { VariableStateMap, replaceVariables } from './variable-interpolation';

export type SelectionItem = DataItem;

/**
 * Interpolate selection data into a template string for individual mode.
 *
 * Supports:
 * - ${__data.fields["fieldName"]} - field value from the item
 * - ${__data.index} - current selection index (0-based)
 * - ${__data.count} - total number of selections
 *
 * @param template - The template string with placeholders
 * @param item - The current selection item data
 * @param index - The current selection index (0-based)
 * @param count - Total number of selections
 * @param variableState - Optional dashboard variable state for additional interpolation
 */
export function interpolateSelectionIndividual(
  template: string,
  item: SelectionItem,
  index: number,
  count: number,
  variableState?: VariableStateMap
): InterpolationResult {
  // Replace __data patterns using shared utility (includes __data.index and __data.count)
  const dataFieldResult = replaceDataFields(template, item, { index, count });
  let result = dataFieldResult.text;
  const errors: string[] = [];
  if (dataFieldResult.errors) {
    errors.push(...dataFieldResult.errors.map((e) => e.replace('in data', 'in selection data')));
  }

  // Apply dashboard variable interpolation if provided
  if (variableState) {
    result = replaceVariables(result, variableState);
  }

  return { text: result, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Interpolate selection data into a template string for batch mode.
 *
 * Supports:
 * - ${__data[0].fields["fieldName"]} - field value from specific item by index
 * - ${__data.fields["fieldName"]:csv} - aggregated field values with format specifier
 * - ${__data.count} - total number of selections
 *
 * @param template - The template string with placeholders
 * @param items - Array of all selection items
 * @param variableState - Optional dashboard variable state for additional interpolation
 */
export function interpolateSelectionBatch(
  template: string,
  items: SelectionItem[],
  variableState?: VariableStateMap
): InterpolationResult {
  // Replace __data patterns using shared utility (includes __data.count)
  const dataFieldResult = replaceDataFieldsBatch(template, items);
  let result = dataFieldResult.text;
  const errors: string[] = [];
  if (dataFieldResult.errors) {
    errors.push(...dataFieldResult.errors.map((e) => e.replace('in data', 'in selection data')));
  }

  // Apply dashboard variable interpolation if provided
  if (variableState) {
    result = replaceVariables(result, variableState);
  }

  return { text: result, errors: errors.length > 0 ? errors : undefined };
}
