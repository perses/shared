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

import { ThemeModeProvider } from '../../contexts/ThemeModeProvider';
import type { Size, Status } from '../types';
import { Select } from './Select';
import type { SelectProps, SelectStyle } from './Select';
import { SelectGroup } from './SelectGroup';
import { SelectItem } from './SelectItem';
import type { SelectValue } from './SelectItem';

const responsiveWidth = { default: '100%', md: '20rem' };
const STYLE_OVERRIDE = { width: '99px' };
const COLOR_STYLE = { color: 'red' };
const SIZE_OVERRIDE_STYLE: SelectStyle = { '--perses-select-size-md': '40px' };
const START_ICON = <span data-testid="start-icon" />;
const END_ICON = <span data-testid="end-icon" />;
const CUSTOM_ICON = <span data-testid="custom-icon" />;
const BOLD_LABEL = (
  <>
    Two <b>bold</b>
  </>
);

const units = [
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

function renderSelect(props: Partial<SelectProps> = {}, children: ReactElement[] = units): ReturnType<typeof render> {
  const merged = { label: 'Unit', ...props } as SelectProps;
  return render(<Select {...merged}>{children}</Select>);
}

const getTrigger = (name = 'Unit'): HTMLElement => screen.getByRole('combobox', { name });
const getRoot = (name = 'Unit'): HTMLElement => getTrigger(name).closest('.ps-Select') as HTMLElement;

async function open(name = 'Unit'): Promise<HTMLElement> {
  await userEvent.click(getTrigger(name));
  return screen.findByRole('listbox');
}

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
  });

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

  describe('style props', () => {
    it('applies a plain width through a custom property', () => {
      renderSelect({ width: '20rem' });
      expect(getRoot()).toHaveClass('ps-width');
      expect(getRoot()).toHaveStyle({ '--ps-width': '20rem' });
    });

    it('applies responsive width via the style-prop class and CSS variables', () => {
      renderSelect({ width: responsiveWidth });
      expect(getRoot()).toHaveClass('ps-width');
      expect(getRoot()).toHaveStyle({ '--ps-width': '100%', '--ps-width-md': '20rem' });
    });

    it('applies spacing and overflow props to the root', () => {
      renderSelect({ m: 'md', minWidth: 120, overflow: 'hidden' });
      const root = getRoot();
      expect(root).toHaveClass('ps-m', 'ps-min-width', 'ps-overflow');
      expect(root).toHaveStyle({
        '--ps-m': 'var(--perses-spacing-md)',
        '--ps-min-width': '120px',
        '--ps-overflow': 'hidden',
      });
    });

    it('does not accept a display prop because the stylesheet fixes display', () => {
      // @ts-expect-error display is fixed by the Select stylesheet
      render(<Select label="Unit" display="block" />);
      const root = getRoot();
      expect(root).not.toHaveClass('ps-display');
      expect(root.style.getPropertyValue('--ps-display')).toBe('');
      expect(getTrigger()).not.toHaveAttribute('display');
    });

    it('places className and style on the root, not the trigger', () => {
      renderSelect({ className: 'custom', style: COLOR_STYLE });
      const root = getRoot();
      expect(root).toHaveClass('custom');
      expect(root.style.color).toBe('red');
      expect(getTrigger()).not.toHaveClass('custom');
      expect(getTrigger().style.color).toBe('');
    });

    it('applies a per-size override custom property to the root', () => {
      renderSelect({ style: SIZE_OVERRIDE_STYLE });
      expect(getRoot().style.getPropertyValue('--perses-select-size-md')).toBe('40px');
    });

    it('merges the style prop and lets it override computed styles', () => {
      renderSelect({ width: '20rem', style: STYLE_OVERRIDE });
      expect(getRoot()).toHaveStyle({ width: '99px' });
    });

    it('does not forward style props to the trigger', () => {
      renderSelect({ m: 'md', width: '20rem', id: 'x' });
      const trigger = getTrigger();
      expect(trigger).toHaveAttribute('id', 'x');
      expect(trigger).not.toHaveAttribute('m');
      expect(trigger).not.toHaveAttribute('width');
    });
  });

  describe('accessibility', () => {
    it('names the trigger from the label with a generated id', () => {
      renderSelect();
      const trigger = getTrigger();
      const label = screen.getByText('Unit');
      expect(trigger.id).not.toBe('');
      expect(label).toHaveAttribute('for', trigger.id);
      expect(trigger).toHaveAccessibleName('Unit');
    });

    it('uses a provided id for both the trigger and the label', () => {
      renderSelect({ id: 'unit-select' });
      expect(getTrigger()).toHaveAttribute('id', 'unit-select');
      expect(screen.getByText('Unit')).toHaveAttribute('for', 'unit-select');
    });

    it('generates distinct ids for multiple selects', () => {
      render(
        <>
          <Select label="First">{units}</Select>
          <Select label="Second">{units}</Select>
        </>,
      );
      expect(getTrigger('First').id).not.toBe(getTrigger('Second').id);
    });

    it('supports aria-label when there is no visible label', () => {
      render(<Select aria-label="Unit">{units}</Select>);
      expect(getTrigger()).toHaveAccessibleName('Unit');
      expect(document.querySelector('.ps-Select__label')).not.toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <span id="unit-heading">Unit</span>
          <Select aria-labelledby="unit-heading">{units}</Select>
        </>,
      );
      expect(getTrigger()).toHaveAccessibleName('Unit');
    });

    it('requires an accessible name at the type level', () => {
      // @ts-expect-error -- one of label, aria-label or aria-labelledby is required
      const missingName = <Select placeholder="Search" />;
      const withLabel = <Select label="Unit" />;
      const withAriaLabel = <Select aria-label="Unit" />;
      const withAriaLabelledBy = <Select aria-labelledby="unit-id" />;
      expect([missingName, withLabel, withAriaLabel, withAriaLabelledBy]).toHaveLength(4);
    });

    it('rejects overriding a visible label with aria-label or aria-labelledby at the type level', () => {
      // @ts-expect-error -- aria-label would override the visible label as the accessible name (WCAG 2.5.3)
      const withAriaLabel = <Select label="Unit" aria-label="Different" />;
      // @ts-expect-error -- aria-labelledby would override the visible label as the accessible name (WCAG 2.5.3)
      const withAriaLabelledBy = <Select label="Unit" aria-labelledby="other" />;
      expect([withAriaLabel, withAriaLabelledBy]).toHaveLength(2);
    });

    it('does not include start/end elements or helper text in the accessible name', () => {
      renderSelect({ startElement: <span>$</span>, endElement: <span>%</span>, helperText: 'Hint' });
      expect(getTrigger()).toHaveAccessibleName('Unit');
    });

    it('links helper text through aria-describedby and omits it otherwise', () => {
      const { rerender } = render(
        <Select label="Unit" helperText="Shown to your team">
          {units}
        </Select>,
      );
      expect(getTrigger()).toHaveAccessibleDescription('Shown to your team');
      rerender(<Select label="Unit">{units}</Select>);
      expect(getTrigger()).not.toHaveAttribute('aria-describedby');
    });

    it('sets aria-invalid for the error status only', () => {
      const statuses: Status[] = ['error', 'warning', 'success', 'info'];
      for (const status of statuses) {
        const { unmount } = renderSelect({ status });
        if (status === 'error') {
          expect(getTrigger()).toBeInvalid();
        } else {
          expect(getTrigger()).not.toHaveAttribute('aria-invalid');
        }
        unmount();
      }
    });

    it('exposes required and read-only states', () => {
      renderSelect({ required: true, readOnly: true });
      const trigger = getTrigger();
      expect(trigger).toHaveAttribute('aria-required', 'true');
      expect(trigger).toHaveAttribute('aria-readonly', 'true');
      expect(trigger).toHaveAttribute('data-readonly');
    });

    it('does not open when disabled', async () => {
      renderSelect({ disabled: true });
      const trigger = getTrigger();
      expect(trigger).toHaveAttribute('data-disabled');
      expect(getRoot()).toHaveAttribute('data-disabled');
      await userEvent.click(trigger);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('opens with the keyboard, moves through options, and selects with Enter', async () => {
      const onValueChange = vi.fn();
      renderSelect({ onValueChange });
      await userEvent.tab();
      expect(getTrigger()).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await screen.findByRole('listbox');
      await waitFor(() => expect(screen.getByRole('option', { name: 'Bytes' })).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(screen.getByRole('option', { name: 'Seconds' })).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('seconds');
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      renderSelect();
      await open();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      expect(getTrigger()).toHaveFocus();
    });

    it('selects by typeahead', async () => {
      const onValueChange = vi.fn();
      renderSelect({ onValueChange });
      await open();
      await userEvent.keyboard('s');
      await waitFor(() => expect(screen.getByRole('option', { name: 'Seconds' })).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('seconds');
    });
  });
});
