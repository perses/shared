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

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { Select } from './Select';
import type { SelectProps } from './Select';
import { SelectItem } from './SelectItem';

export const units = [
  <SelectItem key="bytes" value="bytes">
    Bytes
  </SelectItem>,
  <SelectItem key="seconds" value="seconds">
    Seconds
  </SelectItem>,
  <SelectItem key="percent" value="percent" disabled>
    Percent
  </SelectItem>,
];

export type SelectMode = 'basic' | 'searchable';
/** The engines every mode-agnostic test runs against. Task 8 adds `'searchable'`. */
export const MODES: readonly SelectMode[] = ['basic'];

/**
 * Spread into every mode-agnostic render. The narrow return type (instead of `Partial<SelectProps>`, a union)
 * keeps the spread assignable to `SelectProps` next to other props.
 */
export function modeProps(mode: SelectMode): { searchable?: true } {
  return mode === 'searchable' ? { searchable: true } : {};
}

export function renderSelect(
  props: Partial<SelectProps> = {},
  children: ReactElement[] = units,
): ReturnType<typeof render> {
  const merged = (props.items ? { label: 'Unit', ...props } : { label: 'Unit', ...props, children }) as SelectProps;
  return render(<Select {...merged} />);
}

export const getTrigger = (name = 'Unit'): HTMLElement => screen.getByRole('combobox', { name });
/** What the field shows: the typed or selected text of an `<input>`, otherwise the element's text content. */
export const fieldText = (el: HTMLElement): string =>
  el instanceof HTMLInputElement ? el.value : (el.textContent ?? '');

export const getRoot = (name = 'Unit'): HTMLElement => getTrigger(name).closest('.ps-Select') as HTMLElement;

export async function open(name = 'Unit'): Promise<HTMLElement> {
  await userEvent.click(getTrigger(name));
  const listbox = await screen.findByRole('listbox');
  // Base UI opens a trigger press on the next animation frame as well. Without waiting for it, a quick follow-up
  // press in a test would be followed by that stale frame reopening the list.
  await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  return listbox;
}
