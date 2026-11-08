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

import { render, screen } from '@testing-library/react';
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

export function renderSelect(
  props: Partial<SelectProps> = {},
  children: ReactElement[] = units,
): ReturnType<typeof render> {
  const merged = { label: 'Unit', ...props } as SelectProps;
  return render(<Select {...merged}>{children}</Select>);
}

export const getTrigger = (name = 'Unit'): HTMLElement => screen.getByRole('combobox', { name });
export const getRoot = (name = 'Unit'): HTMLElement => getTrigger(name).closest('.ps-Select') as HTMLElement;

export async function open(name = 'Unit'): Promise<HTMLElement> {
  await userEvent.click(getTrigger(name));
  return screen.findByRole('listbox');
}
