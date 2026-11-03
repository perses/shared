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

import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';

import { SelectItem } from './SelectItem';
import type { SelectItemProps, SelectValue } from './SelectItem';

export interface SelectItemOption {
  value: SelectValue;
  label: ReactNode;
}

/**
 * Collects `{ value, label }` pairs from the `SelectItem` elements in `children`, recursing through `SelectGroup`
 * and fragments, so the trigger can display the selected item's content. Items produced by
 * intermediate components are not visible here and fall back to `String(value)`; use `renderValue` for those.
 */
export function collectItems(children: ReactNode): SelectItemOption[] {
  const items: SelectItemOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === SelectItem) {
      const { value, children: label } = child.props as SelectItemProps;
      items.push({ value, label });
      return;
    }

    const { children: nested } = child.props as { children?: ReactNode };
    if (nested !== undefined) items.push(...collectItems(nested));
  });

  return items;
}
