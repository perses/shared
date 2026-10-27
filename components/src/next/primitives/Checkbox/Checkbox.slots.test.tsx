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
import { createRef } from 'react';

import type { PersesCSSProperties } from '../../types';
import { Checkbox } from './Checkbox';
import type { CheckboxSlotProps } from './Checkbox';

const SLOT_PROPS: CheckboxSlotProps = {
  control: {
    className: 'custom-control',
    style: { borderRadius: 0, opacity: 0.8, '--ps-width': '999px', '--app-accent': 'slot', '--app-control': 2 },
  },
  indicator: { className: 'custom-indicator', style: { transform: 'scale(0.9)', '--app-indicator': 3 } },
  label: { className: 'custom-label', style: { letterSpacing: '1px', '--app-label': 4 } },
};
const TOP_STYLE: PersesCSSProperties = { borderRadius: '6px', marginTop: '4px', '--app-accent': 'top' };
const RESPONSIVE_WIDTH = { default: 120, md: 200 };
const slotHandler = vi.fn();
const slotRef = createRef<HTMLElement>();
const runtimeSlots = {
  control: {
    ...SLOT_PROPS.control,
    id: 'injected-control',
    role: 'button',
    'aria-label': 'Injected name',
    'aria-checked': 'true',
    'data-disabled': 'injected',
    'data-size': 'injected',
    'data-slot-leak': 'control',
    disabled: true,
    checked: true,
    name: 'injected-name',
    value: 'injected-value',
    onClick: slotHandler,
    onCheckedChange: slotHandler,
    ref: slotRef,
    inputRef: slotRef,
    render: <button type="button">Injected control</button>,
    children: 'Injected child',
  },
  indicator: {
    ...SLOT_PROPS.indicator,
    keepMounted: true,
    'data-slot-leak': 'indicator',
    ref: slotRef,
    render: <span>Injected indicator</span>,
    children: 'Injected mark',
  },
  label: {
    ...SLOT_PROPS.label,
    id: 'injected-label',
    htmlFor: 'injected-input',
    'aria-hidden': true,
    'data-slot-leak': 'label',
    onClick: slotHandler,
    ref: slotRef,
    children: 'Injected label',
  },
  hiddenInput: { name: 'injected-name' },
  mark: { children: 'Injected private mark' },
};
const STRUCTURAL_SLOTS: CheckboxSlotProps = runtimeSlots;
const BYPASSED_SLOTS = runtimeSlots as unknown as CheckboxSlotProps;

// A wider object can satisfy the slot type without an excess-property check.
const INVALID_SLOT_CASES = [
  ['structurally assignable', STRUCTURAL_SLOTS],
  ['type bypassed', BYPASSED_SLOTS],
] as const;

describe('Checkbox slot styling', () => {
  it('styles all labeled parts while keeping top-level styles on the label wrapper', () => {
    render(
      <Checkbox
        label="Select item"
        defaultChecked
        className="outer"
        width={RESPONSIVE_WIDTH}
        style={TOP_STYLE}
        slotProps={SLOT_PROPS}
      />,
    );
    const control = screen.getByRole('checkbox', { name: 'Select item' });
    const wrapper = control.closest('label');
    const indicator = control.querySelector<HTMLElement>('.ps-Checkbox__indicator');
    const label = screen.getByText('Select item');

    expect(wrapper).toHaveClass('ps-Checkbox__field', 'outer', 'ps-width');
    expect(wrapper).toHaveStyle({
      borderRadius: '6px',
      marginTop: '4px',
      '--ps-width': '120px',
      '--ps-width-md': '200px',
      '--app-accent': 'top',
    });
    expect(wrapper).not.toHaveClass('custom-control', 'custom-label');
    expect(control).toHaveClass('ps-Checkbox', 'custom-control');
    expect(control).not.toHaveClass('outer', 'ps-width');
    expect(control).toHaveStyle({
      borderRadius: '0',
      opacity: '0.8',
      '--ps-width': '999px',
      '--app-accent': 'slot',
      '--app-control': '2',
    });
    expect(control.style.marginTop).toBe('');
    expect(indicator).toHaveClass('ps-Checkbox__indicator', 'custom-indicator');
    expect(indicator).toHaveStyle({ transform: 'scale(0.9)', '--app-indicator': '3' });
    expect(label).toHaveClass('ps-Checkbox__labelText', 'custom-label');
    expect(label).toHaveStyle({ letterSpacing: '1px', '--app-label': '4' });
    expect(control.querySelector('.ps-Checkbox__mark')).toHaveAttribute('aria-hidden', 'true');
    expect(control).not.toHaveAttribute('slotProps');
  });

  it('merges unlabeled control styles by property with computed top-level styles winning conflicts', () => {
    render(
      <Checkbox
        aria-label="Select item"
        defaultChecked
        className="outer"
        width={RESPONSIVE_WIDTH}
        style={TOP_STYLE}
        slotProps={SLOT_PROPS}
      />,
    );
    const control = screen.getByRole('checkbox', { name: 'Select item' });

    expect(control).toHaveClass('ps-Checkbox', 'outer', 'ps-width', 'custom-control');
    expect(control).toHaveStyle({
      borderRadius: '6px',
      marginTop: '4px',
      opacity: '0.8',
      '--ps-width': '120px',
      '--ps-width-md': '200px',
      '--app-accent': 'top',
      '--app-control': '2',
    });
  });

  it('uses control slot styles without top-level styles and does not create an optional label', () => {
    const { container } = render(<Checkbox aria-label="Select item" slotProps={SLOT_PROPS} />);
    const control = screen.getByRole('checkbox', { name: 'Select item' });

    expect(control).toHaveClass('custom-control');
    expect(control).toHaveStyle({ borderRadius: '0', opacity: '0.8', '--app-control': '2' });
    expect(container.querySelector('label')).not.toBeInTheDocument();
    expect(container.querySelector('.ps-Checkbox__labelText')).not.toBeInTheDocument();
    expect(control.querySelector('.ps-Checkbox__indicator')).not.toBeInTheDocument();
  });

  it.each([true, false])(
    'removes slot overrides on rerender without removing required or top-level styles (labeled=%s)',
    (labeled) => {
      const { rerender } = render(
        <Checkbox
          aria-label="Select item"
          label={labeled ? 'Select item' : undefined}
          defaultChecked
          className="outer"
          style={TOP_STYLE}
          slotProps={SLOT_PROPS}
        />,
      );
      const control = screen.getByRole('checkbox');
      expect(control).toHaveClass('custom-control');

      rerender(
        <Checkbox
          aria-label="Select item"
          label={labeled ? 'Select item' : undefined}
          defaultChecked
          className="outer"
          style={TOP_STYLE}
        />,
      );

      expect(control).toHaveClass('ps-Checkbox');
      expect(control).not.toHaveClass('custom-control');
      expect(control.style.opacity).toBe('');
      expect(control.style.getPropertyValue('--app-control')).toBe('');
      const outer = labeled ? control.closest('label') : control;
      expect(outer).toHaveClass('outer');
      expect(outer).toHaveStyle({ borderRadius: '6px', '--app-accent': 'top' });
      const indicator = control.querySelector<HTMLElement>('.ps-Checkbox__indicator');
      expect(indicator).toHaveClass('ps-Checkbox__indicator');
      expect(indicator).not.toHaveClass('custom-indicator');
      expect(indicator?.style.transform).toBe('');
      expect(indicator?.style.getPropertyValue('--app-indicator')).toBe('');
      if (labeled) {
        const label = screen.getByText('Select item');
        expect(label).toHaveClass('ps-Checkbox__labelText');
        expect(label).not.toHaveClass('custom-label');
        expect(label.style.letterSpacing).toBe('');
        expect(label.style.getPropertyValue('--app-label')).toBe('');
      }
    },
  );

  it('keeps the styled indicator conditional on checked and indeterminate state', () => {
    const { rerender } = render(<Checkbox aria-label="Select item" checked slotProps={SLOT_PROPS} />);
    const control = screen.getByRole('checkbox');
    expect(control.querySelector('.ps-Checkbox__indicator')).toHaveClass('custom-indicator');

    rerender(<Checkbox aria-label="Select item" checked={false} slotProps={SLOT_PROPS} />);
    expect(control.querySelector('.ps-Checkbox__indicator')).not.toBeInTheDocument();
    expect(control).toHaveAttribute('data-unchecked');

    rerender(<Checkbox aria-label="Select item" checked={false} indeterminate slotProps={SLOT_PROPS} />);
    expect(control).toHaveAttribute('aria-checked', 'mixed');
    expect(control).toHaveAttribute('data-indeterminate');
    expect(control.querySelector('.ps-Checkbox__indicator')).toHaveClass('ps-Checkbox__indicator', 'custom-indicator');
    expect(control.querySelector('.ps-Checkbox__mark')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(INVALID_SLOT_CASES)(
    'ignores extra runtime keys when %s while preserving refs, label toggling, callbacks and form state',
    async (_mode, slotProps) => {
      const ref = createRef<HTMLElement>();
      const inputRef = createRef<HTMLInputElement>();
      const onCheckedChange = vi.fn();
      const onClick = vi.fn();
      const { container } = render(
        <form aria-label="Preferences">
          <Checkbox
            ref={ref}
            inputRef={inputRef}
            id="selection"
            label="Select item"
            name="selected"
            value="yes"
            uncheckedValue="no"
            required
            invalid
            onClick={onClick}
            onCheckedChange={onCheckedChange}
            slotProps={slotProps}
          />
        </form>,
      );
      const control = screen.getByRole('checkbox', { name: 'Select item' });
      const form = screen.getByRole('form', { name: 'Preferences' }) as HTMLFormElement;
      expect(control).toHaveClass('custom-control');
      expect(ref.current).toBe(control);
      expect(inputRef.current).toHaveAttribute('id', 'selection');
      expect(control).toHaveAttribute('aria-checked', 'false');
      expect(control).toHaveAttribute('aria-required', 'true');
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(control).toHaveAttribute('data-invalid');
      expect(control).toHaveAttribute('data-size', 'md');
      expect(control).not.toHaveAttribute('data-disabled');
      expect(control.querySelector('.ps-Checkbox__indicator')).not.toBeInTheDocument();
      expect(inputRef.current).toBe(container.querySelector('input[type="checkbox"]'));
      expect(control.closest('label')).toContainElement(inputRef.current);
      expect(inputRef.current).toHaveAttribute('name', 'selected');
      expect(inputRef.current).toHaveAttribute('value', 'yes');
      expect(new FormData(form).get('selected')).toBe('no');
      expect(
        container.querySelector('[data-slot-leak], [slotprops], #injected-control, #injected-label'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Injected/)).not.toBeInTheDocument();

      await userEvent.click(screen.getByText('Select item'));
      expect(control).toBeChecked();
      expect(control).toHaveAttribute('data-checked');
      expect(inputRef.current).toBeChecked();
      expect(new FormData(form).get('selected')).toBe('yes');
      expect(onCheckedChange).toHaveBeenCalledTimes(1);
      expect(onCheckedChange).toHaveBeenCalledWith(true, { event: expect.any(Event) });
      expect(control.querySelector('.ps-Checkbox__indicator')).toHaveClass('custom-indicator');
      expect(control.querySelector('.ps-Checkbox__mark')).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('[data-slot-leak]')).not.toBeInTheDocument();
      expect(screen.queryByText(/Injected/)).not.toBeInTheDocument();
      expect(slotRef.current).toBeNull();
      await userEvent.click(control);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
      expect(onCheckedChange).toHaveBeenLastCalledWith(false, { event: expect.any(Event) });
      expect(control).not.toBeChecked();
      expect(new FormData(form).get('selected')).toBe('no');
      expect(slotHandler).not.toHaveBeenCalled();
      expect(slotRef.current).toBeNull();
      expect(control.querySelector('.ps-Checkbox__indicator')).not.toBeInTheDocument();
      expect(container.querySelector('[data-slot-leak]')).not.toBeInTheDocument();
      expect(screen.queryByText(/Injected/)).not.toBeInTheDocument();
    },
  );

  it('preserves unlabeled keyboard toggling and the forwarded ref with slot styles', async () => {
    const ref = createRef<HTMLElement>();
    const onCheckedChange = vi.fn();
    render(<Checkbox ref={ref} aria-label="Select item" onCheckedChange={onCheckedChange} slotProps={SLOT_PROPS} />);
    const control = screen.getByRole('checkbox', { name: 'Select item' });
    expect(control).toHaveClass('custom-control');
    expect(ref.current).toBe(control);
    await userEvent.tab();
    expect(control).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(control).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true, { event: expect.any(Event) });
  });

  it.each(['disabled', 'readOnly'])('preserves %s state with slot styles', async (state) => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        label="Select item"
        defaultChecked
        disabled={state === 'disabled'}
        readOnly={state === 'readOnly'}
        onCheckedChange={onCheckedChange}
        slotProps={SLOT_PROPS}
      />,
    );
    const control = screen.getByRole('checkbox', { name: 'Select item' });
    expect(control).toHaveClass('custom-control');
    expect(control).toHaveAttribute(state === 'disabled' ? 'data-disabled' : 'data-readonly');
    await userEvent.click(screen.getByText('Select item'));
    await userEvent.click(control);
    expect(control).toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
