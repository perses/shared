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
import { createRef, useState } from 'react';
import type { ReactElement } from 'react';

import type { Size, Status } from '../types';
import { Select } from './Select';
import { getRoot, getTrigger, open, renderSelect, units } from './Select.test.utils';
import { SelectGroup } from './SelectGroup';
import { SelectItem } from './SelectItem';
import type { SelectValue } from './SelectItem';

const START_ICON = <span data-testid="start-icon" />;
const END_ICON = <span data-testid="end-icon" />;
const CUSTOM_ICON = <span data-testid="custom-icon" />;
const BOLD_LABEL = (
  <>
    Two <b>bold</b>
  </>
);

function ControlledSelect({ onValueChange }: { onValueChange: (value: SelectValue | null) => void }): ReactElement {
  const [value, setValue] = useState<SelectValue | null>('bytes');
  return (
    <Select
      label="Unit"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    >
      {units}
    </Select>
  );
}

describe('Select', () => {
  it('renders a combobox trigger associated with its label', () => {
    renderSelect();
    const trigger = screen.getByLabelText('Unit');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('role', 'combobox');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveClass('ps-Select__trigger');
  });

  it('applies the ps-Select class to the root and does not render the list until opened', () => {
    renderSelect();
    expect(getRoot()).toHaveClass('ps-Select');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on click with options and classes', async () => {
    renderSelect();
    const listbox = await open();
    expect(listbox).toHaveClass('ps-Select__popup');
    expect(listbox.parentElement).toHaveClass('ps-Select__positioner');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    for (const option of options) expect(option).toHaveClass('ps-SelectItem');
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(getTrigger()).toHaveAttribute('data-popup-open');
  });

  it('selects an option by click and reports the value', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    await open();
    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));
    expect(onValueChange).toHaveBeenCalledWith('seconds');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(getTrigger()).toHaveTextContent('Seconds');
  });

  it('works controlled through value and onValueChange', async () => {
    const onValueChange = vi.fn();
    render(<ControlledSelect onValueChange={onValueChange} />);
    expect(getTrigger()).toHaveTextContent('Bytes');
    await open();
    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));
    expect(onValueChange).toHaveBeenCalledWith('seconds');
    expect(getTrigger()).toHaveTextContent('Seconds');
  });

  it('works uncontrolled with defaultValue', async () => {
    renderSelect({ defaultValue: 'seconds' });
    expect(getTrigger()).toHaveTextContent('Seconds');
    await open();
    expect(screen.getByRole('option', { name: 'Seconds' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Seconds' })).toHaveAttribute('data-selected');
  });

  it('shows the selected item content in the trigger, not the raw value', () => {
    renderSelect({ defaultValue: 2 }, [
      <SelectItem key="2" value={2}>
        {BOLD_LABEL}
      </SelectItem>,
    ]);
    const trigger = getTrigger();
    expect(trigger).toHaveTextContent('Two bold');
    expect(trigger.querySelector('b')).toHaveTextContent('bold');
    expect(trigger).not.toHaveTextContent('2');
  });

  it('shows the content of an item nested in a group', () => {
    renderSelect({ defaultValue: 'alertname' }, [
      <SelectGroup key="g" label="Labels">
        <SelectItem value="alertname">Alert name</SelectItem>
      </SelectGroup>,
    ]);
    expect(getTrigger()).toHaveTextContent('Alert name');
  });

  it('shows the placeholder while nothing is selected', () => {
    renderSelect({ placeholder: 'Pick a unit' });
    const trigger = getTrigger();
    expect(trigger).toHaveTextContent('Pick a unit');
    expect(trigger).toHaveAttribute('data-placeholder');
  });

  it('treats an empty-string value as a normal option', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange }, [
      <SelectItem key="none" value="">
        None
      </SelectItem>,
      ...units,
    ]);
    await open();
    await userEvent.click(screen.getByRole('option', { name: 'None' }));
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(getTrigger()).toHaveTextContent('None');
  });

  it('throws when a placeholder is combined with an empty-string item', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const message = /cannot be combined with a `SelectItem` whose value is ""/;

    expect(() =>
      renderSelect({ placeholder: 'Pick a unit' }, [
        <SelectItem key="none" value="">
          None
        </SelectItem>,
        ...units,
      ]),
    ).toThrow(message);

    expect(() =>
      renderSelect({ placeholder: 'Pick a unit' }, [
        <SelectGroup key="g" label="Other">
          <SelectItem value="">None</SelectItem>
        </SelectGroup>,
        ...units,
      ]),
    ).toThrow(message);

    spy.mockRestore();
  });

  it('keeps numeric values without coercion', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange, defaultValue: 0 }, [
      <SelectItem key="0" value={0}>
        Zero
      </SelectItem>,
      <SelectItem key="1" value={1}>
        One
      </SelectItem>,
    ]);
    expect(getTrigger()).toHaveTextContent('Zero');
    await open();
    await userEvent.click(screen.getByRole('option', { name: 'One' }));
    expect(onValueChange).toHaveBeenCalledWith(1);
    expect(onValueChange).not.toHaveBeenCalledWith('1');
  });

  it('renders helper text and data attributes for status, size and fullWidth', () => {
    renderSelect({ helperText: 'Pick one', status: 'warning', size: 'sm', fullWidth: true });
    expect(screen.getByText('Pick one')).toHaveClass('ps-Select__helper');
    const root = getRoot();
    expect(root).toHaveAttribute('data-status', 'warning');
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(root).toHaveAttribute('data-full-width');
  });

  it('renders 0 as a label, helper text and adornment, and skips an empty string', () => {
    renderSelect({ label: 0, helperText: 0, startElement: 0 });
    const trigger = getTrigger('0');
    expect(trigger).toHaveAccessibleDescription('0');
    expect(getRoot('0').querySelector('.ps-Select__adornment--start')).toHaveTextContent('0');

    renderSelect({ label: undefined, 'aria-label': 'Empty', helperText: '', startElement: '' });
    const empty = getRoot('Empty');
    expect(empty.querySelector('.ps-Select__helper')).toBeNull();
    expect(empty.querySelector('.ps-Select__adornment--start')).toBeNull();
  });

  it('renders 0 as a SelectItem startElement', async () => {
    renderSelect({}, [
      <SelectItem key="bytes" value="bytes" startElement={0}>
        Bytes
      </SelectItem>,
    ]);
    await open();
    expect(screen.getByRole('option', { name: /Bytes/ }).querySelector('.ps-SelectItem__start')).toHaveTextContent('0');
  });

  it('applies every size and status combination', () => {
    const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
    const statuses: Array<Status | undefined> = [undefined, 'error', 'warning', 'success', 'info'];
    for (const size of sizes) {
      for (const status of statuses) {
        const { unmount } = renderSelect({ size, status });
        const root = getRoot();
        expect(root).toHaveAttribute('data-size', size);
        if (status) {
          expect(root).toHaveAttribute('data-status', status);
        } else {
          expect(root).not.toHaveAttribute('data-status');
        }
        unmount();
      }
    }
  });

  it('forwards the size to the portaled popup', async () => {
    renderSelect({ size: 'lg' });
    const listbox = await open();
    expect(listbox).toHaveAttribute('data-size', 'lg');
  });

  it('defaults to the md size', () => {
    renderSelect();
    expect(getRoot()).toHaveAttribute('data-size', 'md');
  });

  it('forwards a ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Select label="Unit" ref={ref}>
        {units}
      </Select>,
    );
    expect(ref.current).toBe(getTrigger());
  });

  it('renders a hidden form input carrying name, value and required', async () => {
    const { container } = renderSelect({ name: 'unit', defaultValue: 'bytes', required: true });
    const input = container.querySelector<HTMLInputElement>('input[name="unit"]');
    expect(input).toHaveValue('bytes');
    expect(input).toBeRequired();
    await open();
    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));
    expect(input).toHaveValue('seconds');
  });

  it('associates the hidden input with an external form through the form attribute', () => {
    render(
      <>
        <form id="settings" data-testid="settings" />
        <Select label="Unit" name="unit" form="settings" defaultValue="bytes">
          {units}
        </Select>
      </>,
    );
    const form = screen.getByTestId<HTMLFormElement>('settings');
    expect(new FormData(form).get('unit')).toBe('bytes');
  });

  it('renders startElement and endElement around the value', () => {
    renderSelect({ startElement: START_ICON, endElement: END_ICON, defaultValue: 'bytes' });
    const trigger = getTrigger();
    const start = screen.getByTestId('start-icon').parentElement;
    const end = screen.getByTestId('end-icon').parentElement;
    const value = trigger.querySelector('.ps-Select__value');
    expect(start).toHaveClass('ps-Select__adornment', 'ps-Select__adornment--start');
    expect(end).toHaveClass('ps-Select__adornment', 'ps-Select__adornment--end');
    expect(start?.compareDocumentPosition(value as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(value?.compareDocumentPosition(end as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders a default chevron that icon replaces', () => {
    const { rerender } = render(<Select label="Unit">{units}</Select>);
    const icon = getTrigger().querySelector('.ps-Select__icon');
    expect(icon).toHaveClass('ps-Icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).toBeInTheDocument();

    rerender(
      <Select label="Unit" icon={CUSTOM_ICON}>
        {units}
      </Select>,
    );
    expect(getTrigger().querySelector('.ps-Select__icon')).toContainElement(screen.getByTestId('custom-icon'));
  });

  it('marks only the default chevron for rotation', () => {
    const { rerender } = render(<Select label="Unit">{units}</Select>);
    expect(getTrigger().querySelector('.ps-Select__icon .ps-Select__chevron')).toBeInTheDocument();

    rerender(
      <Select label="Unit" icon={CUSTOM_ICON}>
        {units}
      </Select>,
    );
    expect(getTrigger().querySelector('.ps-Select__chevron')).toBeNull();
  });

  it('supports controlled open state', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Select label="Unit" open={false} onOpenChange={onOpenChange}>
        {units}
      </Select>,
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.click(getTrigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    rerender(
      <Select label="Unit" open onOpenChange={onOpenChange}>
        {units}
      </Select>,
    );
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('supports defaultOpen', async () => {
    renderSelect({ defaultOpen: true });
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('passes placement and align to the positioner', async () => {
    renderSelect({ placement: 'top', align: 'end' });
    const listbox = await open();
    expect(listbox).toHaveAttribute('data-side', 'top');
    expect(listbox).toHaveAttribute('data-align', 'end');
  });

  describe('multiple', () => {
    it('reports an array and joins the selected labels in the trigger', async () => {
      const onValueChange = vi.fn();
      render(
        <Select label="Unit" multiple defaultValue={['bytes']} onValueChange={onValueChange}>
          {units}
        </Select>,
      );
      expect(getTrigger()).toHaveTextContent('Bytes');
      await open();
      await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));
      expect(onValueChange).toHaveBeenCalledWith(['bytes', 'seconds']);
      expect(getTrigger()).toHaveTextContent('Bytes, Seconds');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('toggles an already selected option off', async () => {
      const onValueChange = vi.fn();
      render(
        <Select label="Unit" multiple defaultValue={['bytes', 'seconds']} onValueChange={onValueChange}>
          {units}
        </Select>,
      );
      await open();
      await userEvent.click(screen.getByRole('option', { name: 'Bytes' }));
      expect(onValueChange).toHaveBeenCalledWith(['seconds']);
    });

    it('types value and onValueChange per mode', () => {
      const single = <Select label="Unit" value="bytes" onValueChange={(v: SelectValue | null) => v} />;
      const many = <Select label="Unit" multiple value={['bytes']} onValueChange={(v: SelectValue[]) => v} />;
      // @ts-expect-error -- single mode does not accept an array value
      const badSingle = <Select label="Unit" value={['bytes']} />;
      // @ts-expect-error -- multiple mode does not accept a scalar value
      const badMany = <Select label="Unit" multiple value="bytes" />;
      expect([single, many, badSingle, badMany]).toHaveLength(4);
    });
  });

  describe('renderValue', () => {
    it('overrides the trigger content for a single value', () => {
      renderSelect({ defaultValue: 'bytes', renderValue: (value: SelectValue | null) => `Unit: ${String(value)}` });
      expect(getTrigger()).toHaveTextContent('Unit: bytes');
    });

    it('overrides the trigger content for multiple values', () => {
      render(
        <Select
          label="Unit"
          multiple
          defaultValue={['bytes', 'seconds']}
          renderValue={(value) => `${value.length} selected`}
        >
          {units}
        </Select>,
      );
      expect(getTrigger()).toHaveTextContent('2 selected');
    });
  });
});
