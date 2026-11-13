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
});
