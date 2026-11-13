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

import { ThemeModeProvider } from '../../contexts/ThemeModeProvider';
import { Select } from './Select';
import { open, renderSelect, units } from './Select.test.utils';
import { SelectItem } from './SelectItem';

describe('theme mode across the portal', () => {
  it.each(['light', 'dark'] as const)('propagates %s mode to the body-portaled positioner', async (mode) => {
    const documentMode = document.documentElement.getAttribute('data-perses-mode');
    const bodyMode = document.body.getAttribute('data-perses-mode');
    const { container } = render(
      <ThemeModeProvider mode={mode}>
        <Select label="Unit">{units}</Select>
      </ThemeModeProvider>,
    );
    const listbox = await open();
    expect(document.body).toContainElement(listbox);
    expect(container).not.toContainElement(listbox);
    expect(listbox.parentElement).toHaveAttribute('data-perses-mode', mode);
    expect(listbox.closest('[data-perses-mode]')).toBe(listbox.parentElement);
    expect(document.documentElement.getAttribute('data-perses-mode')).toBe(documentMode);
    expect(document.body.getAttribute('data-perses-mode')).toBe(bodyMode);
  });

  it('updates mode on an already-open popup without remounting it', async () => {
    const { rerender } = render(
      <ThemeModeProvider mode="dark">
        <Select label="Unit">{units}</Select>
      </ThemeModeProvider>,
    );
    const listbox = await open();
    const positioner = listbox.parentElement;
    expect(positioner).toHaveAttribute('data-perses-mode', 'dark');
    await userEvent.keyboard('{ArrowDown}');
    const highlighted = screen.getByRole('option', { name: 'Bytes' });
    expect(highlighted).toHaveAttribute('data-highlighted');

    rerender(
      <ThemeModeProvider mode="light">
        <Select label="Unit">{units}</Select>
      </ThemeModeProvider>,
    );
    expect(screen.getByRole('listbox')).toBe(listbox);
    expect(listbox.parentElement).toBe(positioner);
    expect(positioner).toHaveAttribute('data-perses-mode', 'light');
    expect(highlighted).toHaveAttribute('data-highlighted');
  });

  it('keeps nested provider modes independent using the nearest provider', async () => {
    const { container } = render(
      <ThemeModeProvider mode="dark">
        <Select label="Dark" defaultOpen>
          <SelectItem value="a">A</SelectItem>
        </Select>
        <ThemeModeProvider mode="light">
          <Select label="Light" defaultOpen>
            <SelectItem value="b">B</SelectItem>
          </Select>
        </ThemeModeProvider>
      </ThemeModeProvider>,
    );
    const darkList = (await screen.findByRole('option', { name: 'A' })).closest('[role="listbox"]') as HTMLElement;
    const lightList = (await screen.findByRole('option', { name: 'B' })).closest('[role="listbox"]') as HTMLElement;
    expect(darkList).not.toBe(lightList);
    expect(container).not.toContainElement(darkList);
    expect(container).not.toContainElement(lightList);
    expect(darkList.parentElement).toHaveAttribute('data-perses-mode', 'dark');
    expect(lightList.parentElement).toHaveAttribute('data-perses-mode', 'light');
    expect(document.documentElement).not.toHaveAttribute('data-perses-mode');
    expect(document.body).not.toHaveAttribute('data-perses-mode');
  });

  it('does not force a mode boundary when no provider is present', async () => {
    renderSelect();
    const listbox = await open();
    expect(listbox.parentElement).not.toHaveAttribute('data-perses-mode');
    expect(listbox).not.toHaveAttribute('data-perses-mode');
    expect(listbox.closest('[data-perses-mode]')).toBeNull();
  });
});
