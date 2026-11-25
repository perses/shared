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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeModeProvider } from '../../contexts/ThemeModeProvider';
import { Select } from './Select';
import type { SelectProps, SelectSlotProps } from './Select';
import {
  fieldText,
  getRoot,
  getTrigger,
  getWrapper,
  MODES,
  modeProps,
  nextFrame,
  open,
  renderSelect,
  units,
} from './Select.test.utils';

const queryClear = (name = 'Clear selection'): HTMLElement | null => screen.queryByRole('button', { name });

const chipElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('.ps-Select__chip'));
const removeButtons = (): HTMLElement[] => screen.queryAllByRole('button', { name: /^Remove / });

describe.each(MODES)('%s mode', (mode) => {
  describe('parity', () => {
    it('names the focusable from the visible label, or from aria-label when there is no label', () => {
      const { unmount } = renderSelect({ ...modeProps(mode) });
      expect(getTrigger()).toHaveAccessibleName('Unit');
      unmount();

      render(<Select {...({ ...modeProps(mode), 'aria-label': 'Unit', children: units } as SelectProps)} />);
      expect(getTrigger()).toHaveAccessibleName('Unit');
      expect(document.querySelector('.ps-Select__label')).toBeNull();
    });

    it('references the helper text from aria-describedby, and omits it without helper text', () => {
      const { unmount } = renderSelect({ ...modeProps(mode), helperText: 'Shown to your team' });

      const helper = screen.getByText('Shown to your team');
      expect(helper.id).not.toBe('');
      expect(getTrigger().getAttribute('aria-describedby')?.split(' ')).toContain(helper.id);
      expect(getTrigger()).toHaveAccessibleDescription('Shown to your team');
      unmount();

      renderSelect({ ...modeProps(mode) });
      expect(getTrigger()).not.toHaveAttribute('aria-describedby');
    });

    it('sets aria-invalid for the error status only', () => {
      const { unmount } = renderSelect({ ...modeProps(mode), status: 'error' });
      expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');
      unmount();

      for (const status of ['warning', 'success', 'info'] as const) {
        const other = renderSelect({ ...modeProps(mode), status });
        expect(getTrigger()).not.toHaveAttribute('aria-invalid');
        other.unmount();
      }
    });

    it('focuses the field without opening the list when the label is clicked', async () => {
      renderSelect({ ...modeProps(mode) });

      await userEvent.click(screen.getByText('Unit'));

      expect(getTrigger()).toHaveFocus();
      expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('puts data-size on the root and the popup', async () => {
      renderSelect({ ...modeProps(mode), size: 'lg' });

      const listbox = await open();

      expect(getRoot()).toHaveAttribute('data-size', 'lg');
      expect(listbox.closest('.ps-Select__popup')).toHaveAttribute('data-size', 'lg');
    });

    it('gives the positioner the theme mode of the surrounding provider', async () => {
      render(
        <ThemeModeProvider mode="dark">
          <Select {...({ ...modeProps(mode), label: 'Unit', children: units } as SelectProps)} />
        </ThemeModeProvider>,
      );

      const listbox = await open();

      expect(listbox.closest('.ps-Select__positioner')).toHaveAttribute('data-perses-mode', 'dark');
    });

    it('puts each slot className on its part', async () => {
      const slotProps: SelectSlotProps = {
        label: { className: 'custom-label' },
        wrapper: { className: 'custom-wrapper' },
        trigger: { className: 'custom-trigger' },
        chips: { className: 'custom-chips' },
        clearButton: { className: 'custom-clear' },
        positioner: { className: 'custom-positioner', style: { zIndex: 42 } },
        popup: { className: 'custom-popup' },
        list: { className: 'custom-list' },
        helper: { className: 'custom-helper' },
      };
      renderSelect({
        ...modeProps(mode),
        multiple: true,
        chips: true,
        clearable: true,
        defaultValue: ['bytes'],
        helperText: 'Pick units',
        slotProps,
      });

      // Open lists hide the rest of the page from assistive technology, so check the clear button first.
      const clearButton = queryClear();
      const listbox = await open();

      expect(screen.getByText('Unit')).toHaveClass('custom-label');
      expect(getWrapper()).toHaveClass('custom-wrapper');
      expect(getTrigger()).toHaveClass('custom-trigger');
      expect(document.querySelector('.ps-Select__chips')).toHaveClass('custom-chips');
      expect(clearButton).toHaveClass('custom-clear');
      expect(listbox.closest('.ps-Select__positioner')).toHaveClass('custom-positioner');
      expect(listbox.closest('.ps-Select__positioner')).toHaveStyle({ zIndex: '42' });
      expect(listbox.closest('.ps-Select__popup')).toHaveClass('custom-popup');
      expect(listbox).toHaveClass('custom-list');
      expect(screen.getByText('Pick units')).toHaveClass('custom-helper');
    });

    it('puts the radius classes on the control', () => {
      renderSelect({ ...modeProps(mode), rounded: 'lg', roundedTopLeft: 'sm' });

      expect(getWrapper()).toHaveClass('ps-rounded', 'ps-rounded-top-left');
      expect(getWrapper()).toHaveStyle({ '--ps-rounded': 'var(--perses-radius-lg)' });
    });

    it('reflects required', () => {
      renderSelect({ ...modeProps(mode), required: true });

      expect(getTrigger()).toHaveAttribute('aria-required', 'true');
    });

    it('marks a disabled control and does not open the list', async () => {
      renderSelect({ ...modeProps(mode), disabled: true });

      expect(getWrapper()).toHaveAttribute('data-disabled');
      await userEvent.click(getTrigger());
      await userEvent.click(getWrapper());
      await nextFrame();

      expect(screen.queryByRole('listbox')).toBeNull();
    });

    // Only a press on the surrounding control area is blocked. A direct press on the trigger or input still opens the
    // list when read-only: that is by design (like Base UI, read-only locks the value, not the interaction).
    it('marks a read-only control and does not open the list from a press on the control', async () => {
      renderSelect({ ...modeProps(mode), readOnly: true });

      expect(getWrapper()).toHaveAttribute('data-readonly');
      await userEvent.click(getWrapper());
      await nextFrame();

      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('does not open the list from a press on a role="button" element in an end element', async () => {
      const onInnerClick = vi.fn();
      renderSelect({
        ...modeProps(mode),
        endElement: (
          // A non-native button, as a custom component library renders it; the shell must treat it as interactive.
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events
          <div role="button" tabIndex={0} onClick={onInnerClick}>
            Info
          </div>
        ),
      });

      await userEvent.click(screen.getByRole('button', { name: 'Info' }));
      await nextFrame();

      expect(onInnerClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('opens the list from a press on the control even inside an interactive ancestor', async () => {
      render(
        <a href="#unit">
          {mode === 'searchable' ? (
            <Select label="Unit" searchable>
              {units}
            </Select>
          ) : (
            <Select label="Unit">{units}</Select>
          )}
        </a>,
      );

      await userEvent.click(getWrapper());

      expect(await screen.findByRole('listbox')).toBeInTheDocument();
      await nextFrame();
    });

    it('opens the closed list once, and focuses the field, when the empty part of the control is clicked', async () => {
      const onOpenChange = vi.fn();
      renderSelect({ ...modeProps(mode), onOpenChange });

      await userEvent.click(getWrapper());

      expect(await screen.findByRole('listbox')).toBeInTheDocument();
      expect(getTrigger()).toHaveFocus();
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      await nextFrame();
    });

    it('closes the open list, without reopening it, when the empty part of the control is clicked', async () => {
      const onOpenChange = vi.fn();
      renderSelect({ ...modeProps(mode), onOpenChange });
      await open();
      onOpenChange.mockClear();

      await userEvent.click(getWrapper());

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onOpenChange).not.toHaveBeenCalledWith(true);
    });

    it('still opens the list from a direct press on a read-only trigger, by design', async () => {
      renderSelect({ ...modeProps(mode), readOnly: true });

      await userEvent.click(getTrigger());

      expect(await screen.findByRole('listbox')).toBeInTheDocument();
      await nextFrame();
    });
  });

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

    it('keeps the open indicator last, after the end element, spinner and clear button', () => {
      renderSelect({
        ...modeProps(mode),
        clearable: true,
        loading: true,
        defaultValue: 'bytes',
        endElement: <span data-testid="end" />,
      });

      const end = getWrapper().querySelector('.ps-Select__actions') as HTMLElement;
      const parts = [
        screen.getByTestId('end').parentElement,
        end.querySelector('.ps-Select__spinner'),
        queryClear(),
        end.querySelector(mode === 'searchable' ? '.ps-Select__toggle' : '.ps-Select__icon'),
      ];

      // One group, so the items never wrap apart and align together (bottom-aligned when the field holds chips).
      expect(getWrapper().lastElementChild).toBe(end);
      expect(Array.from(end.children)).toEqual(parts);
    });

    it('renders no end group when there is nothing to show at the end', () => {
      renderSelect({ ...modeProps(mode), icon: null });

      expect(getWrapper().querySelector('.ps-Select__actions')).toBeNull();
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

  describe('loading and empty', () => {
    it('shows a decorative spinner and marks the field busy while loading', () => {
      const { container, unmount } = renderSelect({ ...modeProps(mode), loading: true });

      expect(container.querySelector('.ps-Select__spinner')).toHaveAttribute('aria-hidden', 'true');
      expect(getTrigger()).toHaveAttribute('aria-busy', 'true');
      unmount();

      const idle = renderSelect({ ...modeProps(mode) });
      expect(idle.container.querySelector('.ps-Select__spinner')).toBeNull();
      expect(getTrigger()).not.toHaveAttribute('aria-busy');
    });

    it('shows loadingText in the open popup and status region while loading without items', async () => {
      renderSelect({ ...modeProps(mode), loading: true }, []);

      await open();

      const popup = document.querySelector('.ps-Select__popup') as HTMLElement;
      expect(popup).toHaveTextContent('Loading…');
      expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    });

    it('keeps items usable while loading', async () => {
      const onValueChange = vi.fn();
      renderSelect({ ...modeProps(mode), loading: true, onValueChange });

      await open();
      expect(screen.getAllByRole('option')).toHaveLength(3);
      await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));

      expect(onValueChange).toHaveBeenCalledWith('seconds');
    });

    it('shows emptyText when there are no items', async () => {
      const { unmount } = renderSelect({ ...modeProps(mode) }, []);
      await open();
      const empty = document.querySelector('.ps-Select__empty') as HTMLElement;
      expect(empty).toHaveTextContent('No results');
      // jsdom keeps the unpositioned popup at opacity 0, so `toBeVisible` cannot be used; check it is not hidden.
      expect(empty).not.toHaveAttribute('hidden');
      // A listbox may only own options and groups, so the message sits beside it, never inside it.
      expect(empty.closest('[role="listbox"]')).toBeNull();
      unmount();

      renderSelect({ ...modeProps(mode), emptyText: 'Nothing here' }, []);
      await open();
      const customEmpty = document.querySelector('.ps-Select__empty') as HTMLElement;
      expect(customEmpty).toHaveTextContent('Nothing here');
      expect(customEmpty).not.toHaveAttribute('hidden');
      expect(customEmpty.closest('[role="listbox"]')).toBeNull();
    });

    it('renders listHeader in the popup above the listbox and outside it', async () => {
      renderSelect({ ...modeProps(mode), listHeader: <span>Pick a unit</span> });

      const listbox = await open();

      const header = document.querySelector('.ps-Select__list-header') as HTMLElement;
      expect(header).toHaveTextContent('Pick a unit');
      expect(listbox.contains(header)).toBe(false);
      expect(header.closest('.ps-Select__popup')).toBe(listbox.closest('.ps-Select__popup'));
      expect(header.compareDocumentPosition(listbox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('keeps the list open when a control in listHeader is clicked', async () => {
      const spy = vi.fn();
      renderSelect({ ...modeProps(mode), listHeader: <button onClick={spy}>Select all</button> });
      await open();

      await userEvent.click(screen.getByRole('button', { name: 'Select all' }));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
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
      [-1, 2, '+2'],
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
