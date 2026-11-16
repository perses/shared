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

import { createContext } from 'react';

import type { SelectValue } from './SelectItem';
import { optionKey } from './selectValue';

/**
 * What the search engine knows about its options. `known` holds the `optionKey` of every option the engine could read
 * (from `items` or from `SelectItem` elements in `children`); `visible` holds those that match the search. An item
 * rendered through a wrapper component is not in `known`, so it is never hidden by the search.
 */
export interface SelectVisibility {
  known: ReadonlySet<string>;
  visible: ReadonlySet<string>;
  /** Reports an item the engine cannot see; it warns once per `Select`. */
  reportUnknown: () => void;
}

/**
 * Provided only inside the search engine's list. `SelectItem` and `SelectGroup` render `Combobox` parts when it is
 * set and Base UI `Select` parts when it is `null` (basic engine).
 */
export const SelectVisibleValuesContext = createContext<SelectVisibility | null>(null);

/** True when the search engine knows the option and the current search excludes it. */
export function isFilteredOut(visibility: SelectVisibility, value: SelectValue): boolean {
  const key = optionKey(value);
  return visibility.known.has(key) && !visibility.visible.has(key);
}
