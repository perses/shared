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

import type { SelectValue } from './SelectItem';

/** The selection `Select` holds: one value or `null`, or several values. A controlled `value` may be readonly. */
export type SelectCurrentValue = SelectValue | readonly SelectValue[] | null;

/** Key that keeps `1` and `"1"` apart, since a plain `String(value)` would collapse them. */
export function optionKey(value: SelectValue): string {
  return `${typeof value}:${value}`;
}

/** `Array.isArray` that narrows readonly arrays, which the built-in guard does not. */
export function isMultipleValue(value: SelectCurrentValue): value is readonly SelectValue[] {
  return Array.isArray(value);
}

/** Mirrors Base UI's selected-value check, so the placeholder shows exactly when the trigger has `data-placeholder`. */
export function isEmptySelection(value: SelectCurrentValue): boolean {
  if (isMultipleValue(value)) return value.length === 0;
  return value === null || value === undefined || value === '';
}

export function emptySelection(multiple: boolean): SelectValue[] | null {
  return multiple ? [] : null;
}

/** Copies arrays so a consumer callback never receives, and cannot mutate, the `value` the consumer passed in. */
export function toCallbackValue(value: SelectCurrentValue): SelectValue | SelectValue[] | null {
  return isMultipleValue(value) ? [...value] : value;
}
