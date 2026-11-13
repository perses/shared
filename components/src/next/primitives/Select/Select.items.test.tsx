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

import { open, renderSelect } from './Select.test.utils';
import { SelectGroup } from './SelectGroup';
import { SelectItem } from './SelectItem';

const START_ICON = <span data-testid="start-icon" />;
const COLOR_STYLE = { color: 'red' };

describe('Select groups and items', () => {
  describe('groups', () => {
    it('renders a labelled group around its items', async () => {
      renderSelect({}, [
        <SelectGroup key="g" label="Labels" className="custom-group">
          <SelectItem value="alertname">alertname</SelectItem>
          <SelectItem value="severity">severity</SelectItem>
        </SelectGroup>,
      ]);
      await open();
      const group = screen.getByRole('group', { name: 'Labels' });
      expect(group).toHaveClass('ps-SelectGroup', 'custom-group');
      expect(group.querySelector('.ps-SelectGroup__label')).toHaveTextContent('Labels');
      expect(group.querySelectorAll('[role="option"]')).toHaveLength(2);
    });
  });

  describe('items', () => {
    it('renders startElement before the item text', async () => {
      renderSelect({}, [
        <SelectItem key="a" value="a" startElement={START_ICON}>
          Alpha
        </SelectItem>,
      ]);
      await open();
      const option = screen.getByRole('option', { name: 'Alpha' });
      const start = option.querySelector('.ps-SelectItem__start');
      expect(start).toContainElement(screen.getByTestId('start-icon'));
      expect(option.firstElementChild).toBe(start);
      expect(option.querySelector('.ps-SelectItem__text')).toHaveTextContent('Alpha');
    });

    it('keeps the check indicator mounted and marks it only on the selected item', async () => {
      renderSelect({ defaultValue: 'bytes' });
      await open();
      const indicators = screen
        .getAllByRole('option')
        .map((option) => option.querySelector('.ps-SelectItem__indicator'));
      expect(indicators.every((indicator) => indicator?.classList.contains('ps-Icon'))).toBe(true);
      expect(indicators[0]).toHaveAttribute('data-selected');
      expect(indicators[1]).not.toHaveAttribute('data-selected');
    });

    it('applies spacing props, className and style to the item', async () => {
      renderSelect({}, [
        <SelectItem key="a" value="a" px="lg" className="custom-item" style={COLOR_STYLE}>
          Alpha
        </SelectItem>,
      ]);
      await open();
      const option = screen.getByRole('option', { name: 'Alpha' });
      expect(option).toHaveClass('ps-SelectItem', 'custom-item', 'ps-px');
      expect(option).toHaveStyle({ '--ps-px': 'var(--perses-spacing-lg)' });
      expect(option.style.color).toBe('red');
      expect(option).not.toHaveAttribute('px');
    });

    it('does not select a disabled item', async () => {
      const onValueChange = vi.fn();
      renderSelect({ onValueChange });
      await open();
      const option = screen.getByRole('option', { name: 'Percent' });
      expect(option).toHaveAttribute('data-disabled');
      expect(option).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(option);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps disabled items reachable with arrow keys without selecting them', async () => {
      const onValueChange = vi.fn();
      renderSelect({ onValueChange });
      await open();
      await userEvent.keyboard('{ArrowDown>3/}');
      const option = screen.getByRole('option', { name: 'Percent' });
      expect(option).toHaveAttribute('data-highlighted');
      await userEvent.keyboard('{Enter}');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });
});
