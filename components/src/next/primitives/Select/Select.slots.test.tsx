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
import type { Ref } from 'react';

import { Select } from './Select';
import type { SelectSlotProps } from './Select';
import { SelectItem } from './SelectItem';

const COLOR_STYLE = { color: 'red' };
const SLOT_PROPS: SelectSlotProps = {
  label: { className: 'custom-label', style: { letterSpacing: '1px' } },
  trigger: { className: 'custom-trigger', style: { fontFamily: 'monospace', '--app-select-accent': 'blue' } },
  popup: { className: 'custom-popup', style: { maxHeight: '200px' } },
  helper: { className: 'custom-helper', style: { fontStyle: 'italic' } },
};

function createStructuralSlotProps(ref: Ref<HTMLButtonElement>, onClick: () => void): SelectSlotProps {
  // Nonliteral objects may carry extra keys despite the styling-only public type.
  const slotProps = {
    label: { className: 'custom-label', htmlFor: 'missing-control', children: 'Wrong label' },
    trigger: {
      className: 'custom-trigger',
      id: 'slot-trigger-id',
      ref,
      onClick,
      disabled: true,
      'aria-label': 'Wrong name',
      'aria-describedby': 'missing-description',
      'data-disabled': 'forged',
      render: 'div',
    },
    popup: { className: 'custom-popup', role: 'menu', 'data-open': 'forged' },
    helper: { className: 'custom-helper', id: 'slot-helper-id', children: 'Wrong helper', render: 'div' },
  };
  return slotProps;
}

const units = [
  <SelectItem key="bytes" value="bytes">
    Bytes
  </SelectItem>,
  <SelectItem key="seconds" value="seconds">
    Seconds
  </SelectItem>,
];

const getTrigger = (name = 'Unit'): HTMLElement => screen.getByRole('combobox', { name });
const getRoot = (): HTMLElement => getTrigger().closest('.ps-Select') as HTMLElement;

describe('Select slot styling', () => {
  it('styles each documented part without changing root styling', async () => {
    render(
      <Select label="Unit" helperText="Pick a unit" className="custom-root" style={COLOR_STYLE} slotProps={SLOT_PROPS}>
        {units}
      </Select>,
    );
    const trigger = getTrigger();
    const root = getRoot();
    const label = screen.getByText('Unit');
    const helper = screen.getByText('Pick a unit');

    expect(root).toHaveClass('ps-Select', 'custom-root');
    expect(root.style.color).toBe('red');
    for (const name of ['custom-label', 'custom-trigger', 'custom-popup', 'custom-helper']) {
      expect(root).not.toHaveClass(name);
    }
    expect(label).toHaveClass('ps-Select__label', 'custom-label');
    expect(label).toHaveStyle({ letterSpacing: '1px' });
    expect(trigger).toHaveClass('ps-Select__trigger', 'custom-trigger');
    expect(trigger).not.toHaveClass('custom-root');
    expect(trigger).toHaveStyle({ fontFamily: 'monospace', '--app-select-accent': 'blue' });
    expect(trigger.style.color).toBe('');
    expect(trigger).not.toHaveAttribute('slotprops');
    expect(helper).toHaveClass('ps-Select__helper', 'ps-TextHelper', 'custom-helper');
    expect(helper).toHaveStyle({ fontStyle: 'italic' });
    expect(trigger).toHaveAccessibleDescription('Pick a unit');

    await userEvent.click(trigger);
    const popup = await screen.findByRole('listbox');
    expect(popup).toHaveClass('ps-Select__popup', 'custom-popup');
    expect(popup).toHaveStyle({ maxHeight: '200px' });
  });

  it('ignores structural slot keys even on nonliteral objects', async () => {
    const ref = createRef<HTMLButtonElement>();
    const slotRef = createRef<HTMLButtonElement>();
    const onValueChange = vi.fn();
    const slotOnClick = vi.fn();
    render(
      <>
        <span id="extra">Extra hint</span>
        <Select
          label="Unit"
          id="unit-select"
          helperText="Pick a unit"
          aria-describedby="extra"
          status="error"
          size="lg"
          ref={ref}
          onValueChange={onValueChange}
          slotProps={createStructuralSlotProps(slotRef, slotOnClick)}
        >
          {units}
        </Select>
      </>,
    );
    const trigger = getTrigger();
    expect(trigger).toHaveClass('custom-trigger');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('id', 'unit-select');
    expect(trigger).toBeEnabled();
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).not.toHaveAttribute('data-disabled');
    expect(trigger).toHaveAccessibleDescription('Extra hint Pick a unit');
    expect(screen.getByText('Pick a unit')).not.toHaveAttribute('id', 'slot-helper-id');
    expect(getRoot()).toHaveAttribute('data-size', 'lg');
    expect(getRoot()).toHaveAttribute('data-status', 'error');
    expect(ref.current).toBe(trigger);
    expect(slotRef.current).toBeNull();

    await userEvent.click(trigger);
    const popup = await screen.findByRole('listbox');
    expect(popup).toHaveClass('custom-popup');
    expect(popup).not.toHaveAttribute('role', 'menu');
    await userEvent.click(screen.getByRole('option', { name: 'Seconds' }));
    expect(onValueChange).toHaveBeenCalledWith('seconds');
    expect(slotOnClick).not.toHaveBeenCalled();
  });

  it('does not render optional parts just because they have slot styles', () => {
    render(
      <Select aria-label="Unit" slotProps={SLOT_PROPS}>
        {units}
      </Select>,
    );
    const root = getRoot();
    expect(root.querySelector('.custom-label')).not.toBeInTheDocument();
    expect(root.querySelector('.custom-helper')).not.toBeInTheDocument();
    expect(getTrigger()).toHaveClass('custom-trigger');
  });

  it('removes slot overrides on rerender without removing required classes', () => {
    const { rerender } = render(
      <Select label="Unit" helperText="Helper" slotProps={SLOT_PROPS}>
        {units}
      </Select>,
    );
    const trigger = getTrigger();
    expect(trigger).toHaveClass('custom-trigger');
    rerender(
      <Select label="Unit" helperText="Helper">
        {units}
      </Select>,
    );
    expect(getTrigger()).toBe(trigger);
    expect(trigger).toHaveClass('ps-Select__trigger');
    expect(trigger).not.toHaveClass('custom-trigger');
    expect(trigger.style.fontFamily).toBe('');
    expect(trigger.style.getPropertyValue('--app-select-accent')).toBe('');
    expect(screen.getByText('Unit')).toHaveClass('ps-Select__label');
    expect(screen.getByText('Unit')).not.toHaveClass('custom-label');
    expect(screen.getByText('Helper')).toHaveClass('ps-Select__helper', 'ps-TextHelper');
    expect(screen.getByText('Helper')).not.toHaveClass('custom-helper');
  });

  it('preserves disabled state on styled triggers and helpers', () => {
    render(
      <Select label="Unit" helperText="Helper" disabled slotProps={SLOT_PROPS}>
        {units}
      </Select>,
    );
    expect(getTrigger()).toHaveClass('custom-trigger');
    expect(getTrigger()).toBeDisabled();
    expect(getRoot()).toHaveAttribute('data-disabled');
    expect(screen.getByText('Helper')).toHaveClass('custom-helper');
    expect(screen.getByText('Helper')).toHaveAttribute('data-disabled');
  });
});
