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

import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { ReactElement } from 'react';

import { Select } from './Select';
import { getTrigger, nextFrame, open, renderSelect, units } from './Select.test.utils';
import { SelectGroup } from './SelectGroup';
import { SelectItem } from './SelectItem';
import type { SelectItemProps } from './SelectItem';

const optionLabels = (): string[] => screen.queryAllByRole('option').map((option) => option.textContent ?? '');
/** Presses the clear button while the list is open: that hides it from the accessibility tree, hence the label query. */
const pressClear = async (): Promise<void> => {
  // The press closes the open list; `act` keeps the closing updates inside the test.
  await act(async () => {
    await userEvent.click(screen.getByLabelText('Clear selection'));
  });
  await nextFrame();
};
/** A custom component that returns a `SelectItem`, which `Select` cannot read from the element tree. */
const WrappedOption = (props: SelectItemProps): ReactElement => <SelectItem {...props} />;
const valueText = (): string => document.querySelector('.ps-Select__value')?.textContent ?? '';

describe('Select searchable', () => {
  it('renders an input combobox that receives the ref and pass-through props', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Select label="Unit" searchable ref={ref} data-testid="field">
        {units}
      </Select>,
    );

    const input = getTrigger();
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveClass('ps-Select__trigger', 'ps-Select__input');
    expect(ref.current).toBe(input);
    expect(screen.getByTestId('field')).toBe(input);
  });

  it('focuses the input without opening the list when the label is clicked', async () => {
    renderSelect({ searchable: true });

    await userEvent.click(screen.getByText('Unit'));

    expect(getTrigger()).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('filters JSX items by their search label while typing', async () => {
    renderSelect({ searchable: true });

    await userEvent.type(getTrigger(), 'sec');

    expect(optionLabels()).toEqual(['Seconds']);
  });

  it('matches case- and accent-insensitively anywhere in the label', async () => {
    renderSelect({ searchable: true }, [
      <SelectItem key="cafe" value="cafe">
        Café
      </SelectItem>,
      <SelectItem key="tea" value="tea">
        Tea
      </SelectItem>,
    ]);

    await userEvent.type(getTrigger(), 'AFE');

    expect(optionLabels()).toEqual(['Café']);
  });

  it('searches rich items by their label prop', async () => {
    renderSelect({ searchable: true }, [
      <SelectItem key="b" value="b" label="Bytes">
        <strong>B</strong>
      </SelectItem>,
      <SelectItem key="s" value="s" label="Seconds">
        <strong>S</strong>
      </SelectItem>,
    ]);

    await userEvent.type(getTrigger(), 'byt');

    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('hides groups with no matching items', async () => {
    renderSelect({ searchable: true }, [
      <SelectGroup key="data" label="Data">
        <SelectItem value="bytes">Bytes</SelectItem>
      </SelectGroup>,
      <SelectGroup key="time" label="Time">
        <SelectItem value="seconds">Seconds</SelectItem>
      </SelectGroup>,
    ]);

    await userEvent.type(getTrigger(), 'sec');

    const list = screen.getByRole('listbox');
    expect(within(list).getAllByRole('group')).toHaveLength(1);
    expect(within(list).getByRole('group', { name: 'Time' })).toBeInTheDocument();
  });

  it('applies a custom filter to item data', async () => {
    renderSelect({
      searchable: true,
      filter: (item, query) => item.label.endsWith(query),
    });

    await userEvent.type(getTrigger(), 'tes');

    expect(optionLabels()).toEqual(['Bytes']);
  });

  it('leaves filtering to the consumer when filter is null', async () => {
    const onInputValueChange = vi.fn();
    renderSelect({ searchable: true, filter: null, onInputValueChange });

    await userEvent.type(getTrigger(), 'zzz');

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(onInputValueChange).toHaveBeenLastCalledWith('zzz');
  });

  it('keeps a selected label after async search replaces items', () => {
    const alpha = [{ value: 'a1', label: 'Alpha' }];
    const beta = [{ value: 'b1', label: 'Beta' }];
    const { rerender } = render(<Select label="Unit" searchable multiple value={['a1']} items={alpha} />);
    expect(valueText()).toBe('Alpha');

    rerender(<Select label="Unit" searchable multiple value={['a1']} items={beta} />);

    expect(valueText()).toBe('Alpha');
  });

  it('closes after a single selection and shows the label in the input', async () => {
    const onValueChange = vi.fn();
    renderSelect({ searchable: true, onValueChange });
    await open();

    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));

    expect(onValueChange).toHaveBeenCalledWith('seconds');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(getTrigger()).toHaveValue('Seconds');
  });

  it('shows the new label when a controlled value changes while the list is closed', () => {
    const { rerender } = render(
      <Select label="Unit" searchable value="bytes">
        {units}
      </Select>,
    );
    expect(getTrigger()).toHaveValue('Bytes');

    rerender(
      <Select label="Unit" searchable value="seconds">
        {units}
      </Select>,
    );

    expect(getTrigger()).toHaveValue('Seconds');
  });

  it('restores the selected label when the list closes after typing', async () => {
    renderSelect({ searchable: true, defaultValue: 'seconds' });

    await userEvent.type(getTrigger(), 'by');
    await userEvent.keyboard('{Escape}');

    expect(getTrigger()).toHaveValue('Seconds');
  });

  it('keeps showing the controlled label when the parent does not accept a selection', async () => {
    const onValueChange = vi.fn();
    renderSelect({ searchable: true, value: 'bytes', onValueChange });
    await open();

    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));

    expect(onValueChange).toHaveBeenCalledWith('seconds');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await waitFor(() => expect(getTrigger()).toHaveValue('Bytes'));
  });

  it('keeps the typed text and the open list after a multiple selection', async () => {
    const onValueChange = vi.fn();
    renderSelect({ searchable: true, multiple: true, onValueChange });

    await userEvent.type(getTrigger(), 'se');
    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));

    expect(onValueChange).toHaveBeenCalledWith(['seconds']);
    expect(getTrigger()).toHaveValue('se');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('resets typed text when the list closes', async () => {
    renderSelect({ searchable: true });

    await userEvent.type(getTrigger(), 'se');
    await userEvent.keyboard('{Escape}');

    expect(getTrigger()).toHaveValue('');
  });

  it('supports a controlled inputValue', async () => {
    const onInputValueChange = vi.fn();
    renderSelect({ searchable: true, inputValue: 'by', onInputValueChange, defaultOpen: true });

    await screen.findByRole('listbox');
    expect(optionLabels()).toEqual(['Bytes']);

    await userEvent.type(getTrigger(), 'x');

    expect(onInputValueChange).toHaveBeenCalledWith('byx');
    expect(getTrigger()).toHaveValue('by');
  });

  it('shows the selected labels before the input in multiple mode without chips', () => {
    const { rerender } = render(
      <Select label="Unit" searchable multiple defaultValue={['bytes', 'seconds']}>
        {units}
      </Select>,
    );
    expect(valueText()).toBe('Bytes, Seconds');

    rerender(
      <Select
        label="Unit"
        searchable
        multiple
        defaultValue={['bytes', 'seconds']}
        renderValue={(selected) => `${selected.length} units`}
      >
        {units}
      </Select>,
    );

    expect(valueText()).toBe('2 units');
  });

  it('closes the open list, without reopening it, when the empty part of the control is clicked', async () => {
    const onOpenChange = vi.fn();
    renderSelect({ searchable: true, onOpenChange });
    await open();
    onOpenChange.mockClear();
    const control = document.querySelector<HTMLElement>('.ps-Select__control') as HTMLElement;

    await userEvent.click(control);

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('opens the closed list once, and focuses the input, when the empty part of the control is clicked', async () => {
    const onOpenChange = vi.fn();
    renderSelect({ searchable: true, onOpenChange });
    const control = document.querySelector<HTMLElement>('.ps-Select__control') as HTMLElement;

    await userEvent.click(control);

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(getTrigger()).toHaveFocus();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('opens from the chevron button, which is not a tab stop', async () => {
    renderSelect({ searchable: true });

    const toggle = screen.getByRole('button', { name: 'Unit' });
    expect(toggle).toHaveAttribute('tabindex', '-1');

    await userEvent.click(toggle);

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it.each([
    ['single', 'seconds', [['unit', 'seconds']]],
    [
      'multiple',
      ['bytes', 'seconds'],
      [
        ['unit', 'bytes'],
        ['unit', 'seconds'],
      ],
    ],
    ['numeric', 1, [['unit', '1']]],
  ])('submits the same FormData as basic mode (%s)', (_label, value, expected) => {
    const multiple = Array.isArray(value);
    const items = [
      { value: 'bytes', label: 'Bytes' },
      { value: 'seconds', label: 'Seconds' },
      { value: 1, label: 'One' },
    ];
    const entriesFor = (searchable: boolean): Array<[string, FormDataEntryValue]> => {
      const props = { label: 'Unit', name: 'unit', defaultValue: value, items, multiple, searchable };
      const { container, unmount } = render(
        <form>
          <Select {...(props as Parameters<typeof Select>[0])} />
        </form>,
      );
      const entries = [...new FormData(container.querySelector('form') as HTMLFormElement).entries()];
      unmount();
      return entries;
    };

    const basic = entriesFor(false);
    const searchable = entriesFor(true);

    expect(searchable).toEqual(basic);
    expect(searchable).toEqual(expected);
  });

  it('resets uncontrolled state when searchable changes', async () => {
    const { rerender } = render(
      <Select label="Unit" defaultValue="bytes">
        {units}
      </Select>,
    );
    await open();
    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));

    rerender(
      <Select label="Unit" defaultValue="bytes" searchable>
        {units}
      </Select>,
    );

    expect(getTrigger()).toHaveValue('Bytes');
  });

  it('keeps disabled items visible but unselectable while filtering', async () => {
    const onValueChange = vi.fn();
    renderSelect({ searchable: true, onValueChange });

    await userEvent.type(getTrigger(), 'per');

    const percent = screen.getByRole('option', { name: 'Percent' });
    expect(percent).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(percent);

    expect(onValueChange).not.toHaveBeenCalled();
  });

  describe('chips', () => {
    const chipProps = { searchable: true, multiple: true, chips: true } as const;

    it('removes the last chip with Backspace in an empty input', async () => {
      const onValueChange = vi.fn();
      renderSelect({ ...chipProps, defaultValue: ['bytes', 'seconds'], onValueChange });

      await userEvent.tab();
      expect(getTrigger()).toHaveFocus();
      await userEvent.keyboard('{Backspace}');

      expect(onValueChange).toHaveBeenCalledWith(['bytes']);
      expect(screen.queryByRole('button', { name: 'Remove Seconds' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Remove Bytes' })).toBeInTheDocument();
    });

    it('moves from the input start to the chips with ArrowLeft and removes the focused chip with Backspace', async () => {
      const onValueChange = vi.fn();
      renderSelect({ ...chipProps, defaultValue: ['bytes'], onValueChange });

      await userEvent.tab();
      expect(getTrigger()).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      const chip = document.querySelector<HTMLElement>('.ps-Select__chip') as HTMLElement;
      expect(chip).toHaveFocus();

      await userEvent.keyboard('{Backspace}');

      expect(onValueChange).toHaveBeenCalledWith([]);
      expect(document.querySelector('.ps-Select__chip')).toBeNull();
      expect(getTrigger()).toHaveFocus();
      await userEvent.keyboard('sec');
      expect(getTrigger()).toHaveValue('sec');
    });

    it('keeps the chips container, which holds the input, while nothing is selected', () => {
      renderSelect({ ...chipProps });

      const chips = document.querySelector('.ps-Select__chips') as HTMLElement;
      expect(chips).toContainElement(getTrigger());
    });
  });

  it('clears typed text together with the selection', async () => {
    const { unmount } = renderSelect({ searchable: true, clearable: true, defaultValue: 'bytes' });
    await userEvent.type(getTrigger(), 'x');
    await nextFrame();
    expect(getTrigger()).toHaveValue('Bytesx');

    await pressClear();

    expect(getTrigger()).toHaveValue('');
    unmount();

    renderSelect({ searchable: true, multiple: true, chips: true, clearable: true, defaultValue: ['bytes'] });
    await userEvent.type(getTrigger(), 'sec');
    await nextFrame();
    expect(getTrigger()).toHaveValue('sec');

    await pressClear();

    expect(getTrigger()).toHaveValue('');
  });

  it('leaves the always-mounted empty message with no child nodes while there are results', async () => {
    renderSelect({ searchable: true });

    const listbox = await open();

    // The CSS hides `.ps-Select__empty:empty`, so React must render nothing, not an empty text node.
    const empty = listbox.closest('.ps-Select__popup')?.querySelector('.ps-Select__empty') as HTMLElement;
    expect(empty).toBeInTheDocument();
    expect(empty.childNodes).toHaveLength(0);
    expect(empty).toBeEmptyDOMElement();
  });

  it('announces no results through the status region', async () => {
    renderSelect({ searchable: true });

    await userEvent.type(getTrigger(), 'zzz');

    expect(screen.getByRole('status')).toHaveTextContent('No results');
  });

  it('keeps the selected label when async search replaces items in single mode', () => {
    const alpha = [{ value: 'a1', label: 'Alpha' }];
    const beta = [{ value: 'b1', label: 'Beta' }];
    const { rerender } = render(<Select label="Unit" searchable value="a1" items={alpha} />);
    expect(getTrigger()).toHaveValue('Alpha');

    rerender(<Select label="Unit" searchable value="a1" items={beta} />);

    expect(getTrigger()).toHaveValue('Alpha');
  });

  it('keeps the selected chip label when async search replaces items in chips mode', () => {
    const alpha = [{ value: 'a1', label: 'Alpha' }];
    const beta = [{ value: 'b1', label: 'Beta' }];
    const props = { label: 'Unit', searchable: true, multiple: true, chips: true, value: ['a1'] } as const;
    const { rerender } = render(<Select {...props} items={alpha} />);
    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeInTheDocument();

    rerender(<Select {...props} items={beta} />);

    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove a1' })).toBeNull();
  });

  describe('items rendered through a wrapper component', () => {
    it('lists them without filtering by the typed text and warns once', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderSelect({ searchable: true }, [
        <SelectItem key="bytes" value="bytes">
          Bytes
        </SelectItem>,
        <SelectItem key="seconds" value="seconds">
          Seconds
        </SelectItem>,
        <WrappedOption key="wrapped" value="wrapped">
          Wrapped
        </WrappedOption>,
      ]);

      await userEvent.type(getTrigger(), 'by');

      expect(optionLabels()).toEqual(['Bytes', 'Wrapped']);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('wrapper components');
      warn.mockRestore();
    });

    it('selects a wrapped item', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const onValueChange = vi.fn();
      renderSelect({ searchable: true, onValueChange }, [
        <WrappedOption key="wrapped" value="wrapped">
          Wrapped
        </WrappedOption>,
      ]);
      await open();

      await userEvent.click(screen.getByRole('option', { name: 'Wrapped' }));

      expect(onValueChange).toHaveBeenCalledWith('wrapped');
      warn.mockRestore();
    });

    it('does not warn when every item is a direct SelectItem', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderSelect({ searchable: true });

      await userEvent.type(getTrigger(), 'by');

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('shows them unchanged in basic mode without a warning', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderSelect({}, [
        <WrappedOption key="wrapped" value="wrapped">
          Wrapped
        </WrappedOption>,
      ]);

      await open();

      expect(optionLabels()).toEqual(['Wrapped']);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  it('does not call onInputValueChange on mount when defaultInputValue is set and the list starts closed', () => {
    const onInputValueChange = vi.fn();
    renderSelect({ searchable: true, defaultInputValue: 'ignored', onInputValueChange });

    expect(onInputValueChange).not.toHaveBeenCalled();
    expect(getTrigger()).toHaveValue('');
  });

  it('keeps defaultInputValue when the list starts open', async () => {
    const onInputValueChange = vi.fn();
    renderSelect({ searchable: true, defaultInputValue: 'by', onInputValueChange, defaultOpen: true });

    await screen.findByRole('listbox');

    expect(getTrigger()).toHaveValue('by');
    expect(onInputValueChange).not.toHaveBeenCalled();
  });
});
