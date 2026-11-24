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
import { Switch } from './Switch';
import type { SwitchSlotProps } from './Switch';

const SLOT_PROPS: SwitchSlotProps = {
  control: {
    className: 'custom-control',
    style: { borderRadius: 0, opacity: 0.8, '--ps-width': '999px', '--app-accent': 'slot', '--app-control': 2 },
  },
  thumb: { className: 'custom-thumb', style: { borderRadius: '2px', '--app-thumb': 3 } },
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
    render: <button type="button">Injected control</button>,
    children: 'Injected child',
  },
  thumb: {
    ...SLOT_PROPS.thumb,
    'data-slot-leak': 'thumb',
    ref: slotRef,
    render: <span>Injected thumb</span>,
    children: 'Injected thumb content',
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
};
const STRUCTURAL_SLOTS: SwitchSlotProps = runtimeSlots;
const BYPASSED_SLOTS = runtimeSlots as unknown as SwitchSlotProps;
const INVALID_SLOT_CASES = [
  ['structurally assignable', STRUCTURAL_SLOTS],
  ['type bypassed', BYPASSED_SLOTS],
] as const;

describe('Switch slot styling', () => {
  it('styles all labeled parts while keeping top-level styles on the label wrapper', () => {
    render(
      <Switch
        label="Enable feature"
        defaultChecked
        className="outer"
        width={RESPONSIVE_WIDTH}
        style={TOP_STYLE}
        slotProps={SLOT_PROPS}
      />,
    );
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const wrapper = control.closest('label');
    const thumb = control.querySelector<HTMLElement>('.ps-Switch__thumb');
    const label = screen.getByText('Enable feature');

    expect(wrapper).toHaveClass('ps-Switch__wrapper', 'outer', 'ps-width');
    expect(wrapper).toHaveStyle({
      borderRadius: '6px',
      marginTop: '4px',
      '--ps-width': '120px',
      '--ps-width-md': '200px',
      '--app-accent': 'top',
    });
    expect(wrapper).not.toHaveClass('custom-control', 'custom-label');
    expect(control).toHaveClass('ps-Switch', 'custom-control');
    expect(control).not.toHaveClass('outer', 'ps-width');
    expect(control).toHaveStyle({
      borderRadius: '0',
      opacity: '0.8',
      '--ps-width': '999px',
      '--app-accent': 'slot',
      '--app-control': '2',
    });
    expect(control.style.marginTop).toBe('');
    expect(thumb).toHaveClass('ps-Switch__thumb', 'custom-thumb');
    expect(thumb).toHaveStyle({ borderRadius: '2px', '--app-thumb': '3' });
    expect(label).toHaveClass('ps-Switch__label', 'custom-label');
    expect(label).toHaveStyle({ letterSpacing: '1px', '--app-label': '4' });
    expect(control).not.toHaveAttribute('slotProps');
  });

  it('merges unlabeled control styles by property with computed top-level styles winning conflicts', () => {
    render(
      <Switch
        aria-label="Enable feature"
        className="outer"
        width={RESPONSIVE_WIDTH}
        style={TOP_STYLE}
        slotProps={SLOT_PROPS}
      />,
    );
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    expect(control).toHaveClass('ps-Switch', 'outer', 'ps-width', 'custom-control');
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
    const { container } = render(<Switch aria-label="Enable feature" slotProps={SLOT_PROPS} />);
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    expect(control).toHaveClass('custom-control');
    expect(control).toHaveStyle({ borderRadius: '0', opacity: '0.8', '--app-control': '2' });
    expect(container.querySelector('label')).not.toBeInTheDocument();
    expect(container.querySelector('.ps-Switch__label')).not.toBeInTheDocument();
    expect(control.querySelector('.ps-Switch__thumb')).toHaveClass('custom-thumb');
  });

  it.each([true, false])(
    'removes slot overrides on rerender without removing required or top-level styles (labeled=%s)',
    (labeled) => {
      const { rerender } = render(
        <Switch
          aria-label="Enable feature"
          label={labeled ? 'Enable feature' : undefined}
          defaultChecked
          className="outer"
          style={TOP_STYLE}
          slotProps={SLOT_PROPS}
        />,
      );
      const control = screen.getByRole('switch');
      expect(control).toHaveClass('custom-control');
      rerender(
        <Switch
          aria-label="Enable feature"
          label={labeled ? 'Enable feature' : undefined}
          defaultChecked
          className="outer"
          style={TOP_STYLE}
        />,
      );

      expect(control).toHaveClass('ps-Switch');
      expect(control).not.toHaveClass('custom-control');
      expect(control.style.opacity).toBe('');
      expect(control.style.getPropertyValue('--app-control')).toBe('');
      const outer = labeled ? control.closest('label') : control;
      expect(outer).toHaveClass('outer');
      expect(outer).toHaveStyle({ borderRadius: '6px', '--app-accent': 'top' });
      const thumb = control.querySelector<HTMLElement>('.ps-Switch__thumb');
      expect(thumb).toHaveClass('ps-Switch__thumb');
      expect(thumb).not.toHaveClass('custom-thumb');
      expect(thumb?.style.borderRadius).toBe('');
      expect(thumb?.style.getPropertyValue('--app-thumb')).toBe('');
      if (labeled) {
        const label = screen.getByText('Enable feature');
        expect(label).toHaveClass('ps-Switch__label');
        expect(label).not.toHaveClass('custom-label');
        expect(label.style.letterSpacing).toBe('');
        expect(label.style.getPropertyValue('--app-label')).toBe('');
      }
    },
  );

  it.each(INVALID_SLOT_CASES)(
    'ignores extra runtime keys when %s while preserving refs, label links, toggling, callbacks and form state',
    async (_mode, slotProps) => {
      const ref = createRef<HTMLElement>();
      const onCheckedChange = vi.fn();
      const onClick = vi.fn();
      const { container } = render(
        <form aria-label="Preferences">
          <Switch
            ref={ref}
            id="feature"
            label="Enable feature"
            name="enabled"
            value="yes"
            uncheckedValue="no"
            required
            aria-invalid
            onClick={onClick}
            onCheckedChange={onCheckedChange}
            slotProps={slotProps}
          />
        </form>,
      );
      const control = screen.getByRole('switch', { name: 'Enable feature' });
      const form = screen.getByRole('form', { name: 'Preferences' }) as HTMLFormElement;
      const input = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
      const label = screen.getByText('Enable feature');
      expect(control).toHaveClass('custom-control');
      expect(ref.current).toBe(control);
      expect(control).toHaveAttribute('id', 'feature');
      expect(control.tagName).toBe('SPAN');
      expect(control).toHaveAttribute('aria-checked', 'false');
      expect(control).toHaveAttribute('aria-required', 'true');
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(control).toHaveAttribute('data-size', 'md');
      expect(control).not.toHaveAttribute('data-disabled');
      expect(control).toHaveAttribute('aria-labelledby', 'feature-label');
      expect(label).toHaveAttribute('id', 'feature-label');
      expect(label).not.toHaveAttribute('aria-hidden');
      expect(control.closest('label')).toHaveAttribute('for', 'feature-input');
      expect(input).toHaveAttribute('id', 'feature-input');
      expect(input).toHaveAttribute('name', 'enabled');
      expect(input).toHaveAttribute('value', 'yes');
      expect(new FormData(form).get('enabled')).toBe('no');
      expect(
        container.querySelector('[data-slot-leak], [slotprops], #injected-control, #injected-label'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Injected/)).not.toBeInTheDocument();

      await userEvent.click(label);
      expect(control).toHaveAttribute('aria-checked', 'true');
      expect(control).toHaveAttribute('data-checked');
      expect(control.querySelector('.ps-Switch__thumb')).toHaveClass('custom-thumb');
      expect(control.querySelector('.ps-Switch__thumb')).toHaveAttribute('data-checked');
      expect(input).toBeChecked();
      expect(new FormData(form).get('enabled')).toBe('yes');
      expect(onCheckedChange).toHaveBeenCalledTimes(1);
      expect(onCheckedChange).toHaveBeenCalledWith(true, expect.objectContaining({ event: expect.any(Event) }));
      await userEvent.click(control);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
      expect(onCheckedChange).toHaveBeenLastCalledWith(false, expect.objectContaining({ event: expect.any(Event) }));
      expect(control).toHaveAttribute('aria-checked', 'false');
      expect(new FormData(form).get('enabled')).toBe('no');
      expect(slotHandler).not.toHaveBeenCalled();
      expect(slotRef.current).toBeNull();
      expect(container.querySelector('[data-slot-leak]')).not.toBeInTheDocument();
      expect(screen.queryByText(/Injected/)).not.toBeInTheDocument();
    },
  );

  it('preserves unlabeled keyboard toggling and the forwarded ref with slot styles', async () => {
    const ref = createRef<HTMLElement>();
    const onCheckedChange = vi.fn();
    render(<Switch ref={ref} aria-label="Enable feature" onCheckedChange={onCheckedChange} slotProps={SLOT_PROPS} />);
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    expect(control).toHaveClass('custom-control');
    expect(ref.current).toBe(control);
    await userEvent.tab();
    expect(control).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.objectContaining({ event: expect.any(Event) }));
  });

  it.each(['disabled', 'readOnly'])('preserves %s state with slot styles', async (state) => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        label="Enable feature"
        defaultChecked
        disabled={state === 'disabled'}
        readOnly={state === 'readOnly'}
        onCheckedChange={onCheckedChange}
        slotProps={SLOT_PROPS}
      />,
    );
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    expect(control).toHaveClass('custom-control');
    expect(control).toHaveAttribute(state === 'disabled' ? 'data-disabled' : 'data-readonly');
    await userEvent.click(screen.getByText('Enable feature'));
    await userEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
