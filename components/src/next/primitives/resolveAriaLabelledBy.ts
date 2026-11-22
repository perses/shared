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
 * Resolves `aria-labelledby` for toggles (Checkbox, Switch) whose Base UI root is a `<span>`. Base UI names such a
 * control after the wrapping `<label>`, which beats `aria-label` and concatenates both texts. An explicit
 * `aria-label` must win, so an empty `aria-labelledby` is returned in that case: the accessible-name algorithm
 * ignores an empty reference list and falls through to `aria-label`.
 */
export function resolveAriaLabelledBy(
  ariaLabelledBy: string | undefined,
  ariaLabel: string | undefined,
  fallback?: string,
): string | undefined {
  if (ariaLabelledBy !== undefined) return ariaLabelledBy;
  if (ariaLabel !== undefined) return '';
  return fallback;
}
