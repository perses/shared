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

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { fieldText, getTrigger, MODES, modeProps, renderSelect } from './Select.test.utils';

const queryClear = (name = 'Clear selection'): HTMLElement | null => screen.queryByRole('button', { name });
const chipElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('.ps-Select__chip'));
const removeButtons = (): HTMLElement[] => screen.queryAllByRole('button', { name: /^Remove / });

describe.each(MODES)('%s mode', (mode) => {
  describe('clear', () => {
    it('renders no clear button until something is selected', () => {
      const { unmount } = renderSelect({ ...modeProps(mode), clearable: true });
      expect(queryClear()).toBeNull();
      unmount();

      renderSelect({ ...modeProps(mode), clearable: true, defaultValue: 'bytes' });
      expect(queryClear()).toBeInTheDocument();
    });

    it('clears a single selection, reports null and refocuses the field', async () => {
      const onValueChange = vi.fn();
      renderSelect({
        ...modeProps(mode),
        clearable: true,
        onValueChange,
        defaultValue: 'bytes',
        placeholder: 'Pick',
      });

      await userEvent.click(queryClear() as HTMLElement);

      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(getTrigger()).toHaveFocus();
      expect(queryClear()).toBeNull();
      if (mode === 'searchable') {
        expect(fieldText(getTrigger())).toBe('');
        expect(getTrigger()).toHaveAttribute('placeholder', 'Pick');
      } else {
        expect(fieldText(getTrigger())).toBe('Pick');
      }
    });

    it('does not open the list when the clear button is pressed', async () => {
      renderSelect({ ...modeProps(mode), clearable: true, defaultValue: 'bytes' });

      await userEvent.click(queryClear() as HTMLElement);

      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('clears multiple selections to an empty array', async () => {
      const onValueChange = vi.fn();
      renderSelect({
        ...modeProps(mode),
        clearable: true,
        multiple: true,
        onValueChange,
        defaultValue: ['bytes', 'seconds'],
      });

      await userEvent.click(queryClear() as HTMLElement);

      expect(onValueChange).toHaveBeenCalledWith([]);
      expect(queryClear()).toBeNull();
    });

    it('is the next tab stop after the field', async () => {
      renderSelect({ ...modeProps(mode), clearable: true, defaultValue: 'bytes' });

      await userEvent.tab();
      expect(getTrigger()).toHaveFocus();
      await userEvent.tab();

      expect(queryClear()).toHaveFocus();
    });

    it('names the button with clearAriaLabel', () => {
      renderSelect({ ...modeProps(mode), clearable: true, defaultValue: 'bytes', clearAriaLabel: 'Reset unit' });

      expect(queryClear('Reset unit')).toBeInTheDocument();
      expect(queryClear()).toBeNull();
    });

    it('keeps a controlled value the parent does not update', async () => {
      const onValueChange = vi.fn();
      renderSelect({ ...modeProps(mode), clearable: true, value: 'bytes', onValueChange });

      await userEvent.click(queryClear() as HTMLElement);

      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(fieldText(getTrigger())).toContain('Bytes');
      expect(queryClear()).toBeInTheDocument();
    });

    it.each(['disabled', 'readOnly'] as const)('hides the clear button when %s', (flag) => {
      renderSelect({ ...modeProps(mode), clearable: true, defaultValue: 'bytes', [flag]: true });

      expect(queryClear()).toBeNull();
    });
  });

  describe('chips', () => {
    const chipProps = { multiple: true, chips: true } as const;

    it('shows each selected value as a chip with its item content, in selection order', () => {
      const { container } = renderSelect({ ...modeProps(mode), ...chipProps, defaultValue: ['seconds', 'bytes'] });

      expect(chipElements(container).map((chip) => chip.textContent)).toEqual(['Seconds', 'Bytes']);
    });

    it('removes a value from its chip without opening the list', async () => {
      const onValueChange = vi.fn();
      renderSelect({ ...modeProps(mode), ...chipProps, defaultValue: ['seconds', 'bytes'], onValueChange });

      await userEvent.click(screen.getByRole('button', { name: 'Remove Seconds' }));

      expect(onValueChange).toHaveBeenCalledWith(['bytes']);
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(getTrigger()).toHaveFocus();
    });

    it('keeps chip remove buttons out of the tab order', () => {
      renderSelect({ ...modeProps(mode), ...chipProps, defaultValue: ['seconds', 'bytes'] });

      expect(screen.getByRole('button', { name: 'Remove Bytes' }).tabIndex).toBe(-1);
    });

    it('names remove buttons with chipRemoveAriaLabel', () => {
      renderSelect({
        ...modeProps(mode),
        ...chipProps,
        defaultValue: ['seconds', 'bytes'],
        chipRemoveAriaLabel: (label: string) => `Drop ${label}`,
      });

      expect(screen.getByRole('button', { name: 'Drop Bytes' })).toBeInTheDocument();
      expect(removeButtons()).toHaveLength(0);
    });

    it.each(['disabled', 'readOnly'] as const)('renders no remove buttons when %s', (flag) => {
      const { container } = renderSelect({
        ...modeProps(mode),
        ...chipProps,
        defaultValue: ['seconds', 'bytes'],
        [flag]: true,
      });

      expect(chipElements(container)).toHaveLength(2);
      expect(removeButtons()).toHaveLength(0);
    });

    it('marks chips beyond limitChips and shows +N with a screen-reader label', () => {
      const { container } = renderSelect({
        ...modeProps(mode),
        ...chipProps,
        defaultValue: ['seconds', 'bytes'],
        limitChips: 1,
      });

      const chipList = chipElements(container);
      expect(chipList[0]).not.toHaveAttribute('data-overflow');
      expect(chipList[1]).toHaveAttribute('data-overflow');
      const more = container.querySelector('.ps-Select__more') as HTMLElement;
      expect(more.querySelector('[aria-hidden="true"]')).toHaveTextContent('+1');
      expect(more).toHaveTextContent('1 more selected');
    });

    it.each([
      [2, 2, null],
      [0, 2, '+2'],
    ])('limitChips=%i with %i values shows %s', (limitChips, count, shown) => {
      const { container } = renderSelect({
        ...modeProps(mode),
        ...chipProps,
        defaultValue: ['seconds', 'bytes'].slice(0, count),
        limitChips,
      });

      const more = container.querySelector('.ps-Select__more');
      if (shown === null) {
        expect(more).toBeNull();
      } else {
        expect(more?.querySelector('[aria-hidden="true"]')).toHaveTextContent(shown);
        for (const chip of chipElements(container)) expect(chip).toHaveAttribute('data-overflow');
      }
    });

    it('shows the placeholder and no chips while nothing is selected', () => {
      const { container } = renderSelect({ ...modeProps(mode), ...chipProps, placeholder: 'Pick units' });

      expect(chipElements(container)).toHaveLength(0);
      expect(container.querySelector('.ps-Select__more')).toBeNull();
      if (mode === 'searchable') {
        expect(getTrigger()).toHaveAttribute('placeholder', 'Pick units');
      } else {
        expect(fieldText(getTrigger())).toBe('Pick units');
      }
    });

    it.each([
      ['xs', 'xs'],
      ['sm', 'xs'],
      ['md', 'sm'],
      ['lg', 'sm'],
    ] as const)('uses %s fields with %s chips', (size, chipSize) => {
      const { container } = renderSelect({ ...modeProps(mode), ...chipProps, defaultValue: ['bytes'], size });

      const [chip] = chipElements(container);
      expect(chip).toHaveClass('ps-Chip');
      expect(chip).toHaveAttribute('data-size', chipSize);
      expect(chip).toHaveAttribute('data-color', 'default');
      expect(chip).toHaveAttribute('data-variant', 'solid');
    });
  });
});
