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

import type { SelectItemData } from './Select';
import { SelectItem } from './SelectItem';
import type { SelectItemProps, SelectValue } from './SelectItem';

/** One normalized option, whether it came from `SelectItem` children or from the `items` prop. */
export interface SelectOption extends SelectItemData {
  /** What the list and the field render for this option. */
  content: ReactNode;
  disabled: boolean;
}

const isText = (node: unknown): node is string | number => typeof node === 'string' || typeof node === 'number';

/**
 * Plain-text label of an option: the explicit `label`, else `children` when they are only text, else `String(value)`.
 */
export function getSearchLabel(value: SelectValue, children: ReactNode, label?: string): string {
  if (label !== undefined) return label;
  if (isText(children)) return String(children);
  if (Array.isArray(children) && children.every(isText)) return children.join('');
  return String(value);
}

/** Normalizes the `items` prop into options. The label is also the rendered content. */
export function optionsFromItems(items: readonly SelectItemData[]): SelectOption[] {
  return items.map((item) => ({
    value: item.value,
    label: item.label,
    content: item.label,
    disabled: item.disabled ?? false,
  }));
}

/**
 * Builds the option list the trigger uses to show the selected item's text while the list is closed.
 * It reads the JSX in `children` for `SelectItem` elements, including ones nested in `SelectGroup` or fragments,
 * in document order.
 *
 * It reads JSX only; it does not render components. If you write a custom component that returns a `SelectItem`
 * (for example `<MyOption />`), its label cannot be read here and the trigger falls back to `String(value)`.
 * Supply the trigger text with `renderValue` in that case.
 */
export function collectItems(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === SelectItem) {
      const { value, children: content, label, disabled } = child.props as SelectItemProps;
      options.push({
        value,
        label: getSearchLabel(value, content, label),
        content,
        disabled: disabled === true,
      });
      return;
    }

    const { children: nested } = child.props as { children?: ReactNode };
    if (nested !== undefined) options.push(...collectItems(nested));
  });

  return options;
}
