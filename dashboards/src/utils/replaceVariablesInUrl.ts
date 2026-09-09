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

import { replaceVariables } from '@perses-dev/components';
import type { VariableStateMap } from '@perses-dev/components';

/**
 * Replace dashboard variables in a URL, including those nested inside
 * percent-encoded query parameters.
 *
 * Explore panel links embed PromQL JSON in `data=` where a template reference
 * like `$var` becomes `%24var`. A naive replace on the raw URL string never
 * matches those encoded forms. URLSearchParams returns each value decoded once,
 * so `$var` is visible again and can be expanded.
 */
export function replaceVariablesInUrl(url: string, variableValues: VariableStateMap): string {
  let result = replaceVariables(url, variableValues);

  try {
    const isAbsolute = /^https?:\/\//i.test(result);
    const u = new URL(result, isAbsolute ? undefined : 'http://perses.local');
    let changed = false;

    for (const [key, value] of Array.from(u.searchParams.entries())) {
      // Value is already percent-decoded once → `$var` is visible inside Explore JSON.
      const replaced = replaceVariables(value, variableValues);
      if (replaced !== value) {
        u.searchParams.set(key, replaced);
        changed = true;
      }
    }

    if (!changed) {
      return result;
    }

    if (isAbsolute) {
      return u.toString();
    }
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return result;
  }
}
