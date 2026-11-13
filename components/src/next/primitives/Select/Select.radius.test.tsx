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
import { Select } from './Select';
import type { SelectSlotProps } from './Select';
import { SelectItem } from './SelectItem';

const RADIUS_PROPS = {
  rounded: { default: 'md', lg: 'full' },
  roundedTop: 'sm',
  roundedRight: 12,
  roundedBottom: 'none',
  roundedLeft: '25%',
  roundedTopLeft: { sm: 0, xl: 'xl' },
  roundedTopRight: 'var(--app-radius)',
  roundedBottomLeft: 'lg',
  roundedBottomRight: 'calc(1rem + 2px)',
} as const;
const WIDTH = { default: 120, md: 200 };
const TOP_STYLE: PersesCSSProperties = { borderRadius: '40px', marginTop: '4px', '--app-accent': 'root' };
const OVERRIDE_STYLE: PersesCSSProperties = { ...TOP_STYLE, '--ps-rounded': '99px' };
const SLOTS: SelectSlotProps = {
  trigger: {
    className: 'custom-trigger',
    style: { borderRadius: '6px', '--ps-rounded': '3px', '--ps-rounded-top-left-md': '4px' },
  },
  popup: { className: 'custom-popup', style: { color: 'red' } },
};
const CORNER_RADIUS = { md: 8 };
const LEAKED_RADIUS_SELECTOR =
  '[rounded], [roundedtop], [roundedright], [roundedbottom], [roundedleft], [roundedtopleft], [roundedtopright], [roundedbottomleft], [roundedbottomright]';

const units = [
  <SelectItem key="bytes" value="bytes">
    Bytes
  </SelectItem>,
  <SelectItem key="seconds" value="seconds">
    Seconds
  </SelectItem>,
];

describe('Select radius props', () => {
  it.each([false, true])('rounds only the trigger (labeled=%s)', (labeled) => {
    const { container } = render(
      <Select
        {...(labeled ? { label: 'Unit' } : { 'aria-label': 'Unit' })}
        {...RADIUS_PROPS}
        p="sm"
        width={WIDTH}
        overflow="hidden"
        className="custom-root"
        style={TOP_STYLE}
        name="unit"
        placeholder="Pick one"
        required
        helperText="Shown to your team"
        status="error"
      >
        {units}
      </Select>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Unit' });
    const root = trigger.closest('.ps-Select');

    expect(trigger).toHaveClass(
      'ps-Select__trigger',
      'ps-rounded',
      'ps-rounded-lg',
      'ps-rounded-top',
      'ps-rounded-right',
      'ps-rounded-bottom',
      'ps-rounded-left',
      'ps-rounded-top-left-sm',
      'ps-rounded-top-left-xl',
      'ps-rounded-top-right',
      'ps-rounded-bottom-left',
      'ps-rounded-bottom-right',
    );
    expect(trigger).toHaveStyle({
      '--ps-rounded': 'var(--perses-radius-md)',
      '--ps-rounded-lg': 'var(--perses-radius-full)',
      '--ps-rounded-top': 'var(--perses-radius-sm)',
      '--ps-rounded-right': '12px',
      '--ps-rounded-bottom': 'var(--perses-radius-none)',
      '--ps-rounded-left': '25%',
      '--ps-rounded-top-left-sm': '0px',
      '--ps-rounded-top-left-xl': 'var(--perses-radius-xl)',
      '--ps-rounded-top-right': 'var(--app-radius)',
      '--ps-rounded-bottom-left': 'var(--perses-radius-lg)',
      '--ps-rounded-bottom-right': 'calc(1rem + 2px)',
    });
    expect(root).toHaveClass('ps-Select', 'custom-root', 'ps-p', 'ps-width', 'ps-width-md', 'ps-overflow');
    expect(root).toHaveStyle({
      borderRadius: '40px',
      marginTop: '4px',
      '--ps-p': 'var(--perses-spacing-sm)',
      '--ps-width': '120px',
      '--ps-width-md': '200px',
      '--ps-overflow': 'hidden',
      '--app-accent': 'root',
    });
    expect(trigger).not.toHaveClass('custom-root', 'ps-p', 'ps-width', 'ps-overflow');
    for (const element of container.querySelectorAll<HTMLElement>('*')) {
      if (element === trigger) continue;
      expect(Array.from(element.classList).some((name) => name.startsWith('ps-rounded'))).toBe(false);
      expect(element.style.getPropertyValue('--ps-rounded')).toBe('');
    }
    expect(container.querySelector(LEAKED_RADIUS_SELECTOR)).not.toBeInTheDocument();
    expect(container.querySelector('input[name="unit"]')).toBeRequired();
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveTextContent('Pick one');
    expect(trigger).toHaveAccessibleDescription('Shown to your team');
  });

  it('lets trigger slot styles override radius variables without moving top-level styles off the root', () => {
    render(
      <Select label="Unit" rounded="md" roundedTopLeft={CORNER_RADIUS} style={OVERRIDE_STYLE} slotProps={SLOTS}>
        {units}
      </Select>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Unit' });
    const root = trigger.closest('.ps-Select');

    expect(trigger).toHaveClass('ps-Select__trigger', 'custom-trigger', 'ps-rounded', 'ps-rounded-top-left-md');
    expect(trigger).toHaveStyle({ borderRadius: '6px', '--ps-rounded': '3px', '--ps-rounded-top-left-md': '4px' });
    expect(root).toHaveStyle({ borderRadius: '40px', '--ps-rounded': '99px', '--app-accent': 'root' });
    expect(root).not.toHaveClass('ps-rounded');
  });

  it('preserves the trigger ref and selection and removes radius classes and variables on rerender', async () => {
    const ref = createRef<HTMLButtonElement>();
    const { rerender } = render(
      <Select label="Unit" ref={ref} {...RADIUS_PROPS} style={TOP_STYLE}>
        {units}
      </Select>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Unit' });
    expect(trigger).toHaveClass('ps-rounded', 'ps-rounded-top-left-xl');
    expect(ref.current).toBe(trigger);
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Seconds' }));
    expect(trigger).toHaveTextContent('Seconds');

    rerender(
      <Select label="Unit" ref={ref} style={TOP_STYLE}>
        {units}
      </Select>,
    );
    expect(screen.getByRole('combobox', { name: 'Unit' })).toBe(trigger);
    expect(trigger).toHaveClass('ps-Select__trigger');
    expect(trigger.className).not.toContain('ps-rounded');
    expect(trigger.getAttribute('style') ?? '').not.toContain('--ps-rounded');
    expect(trigger.closest('.ps-Select')).toHaveStyle({
      borderRadius: '40px',
      marginTop: '4px',
      '--app-accent': 'root',
    });
    expect(trigger).toHaveTextContent('Seconds');
  });
});
