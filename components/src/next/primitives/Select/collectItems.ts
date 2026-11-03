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
 * Builds the `{ value, label }` list the trigger uses to show the selected item's text while the list is closed.
 * It reads the JSX in `children` for `SelectItem` elements, including ones nested in `SelectGroup` or fragments.
 *
 * It reads JSX only; it does not render components. If you write a custom component that returns a `SelectItem`
 * (for example `<MyOption />`), its label cannot be read here and the trigger falls back to `String(value)`.
 * Supply the trigger text with `renderValue` in that case.
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
