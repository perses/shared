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
const TOP_STYLE: PersesCSSProperties = { borderRadius: '40px', marginTop: '4px', '--app-accent': 'top' };
const OVERRIDE_STYLE: PersesCSSProperties = { ...TOP_STYLE, '--ps-rounded': '99px' };
const SLOTS: SwitchSlotProps = {
  control: {
    className: 'custom-control',
    style: { borderRadius: '6px', opacity: 0.8, '--ps-rounded': '3px', '--ps-rounded-top-left-md': '4px' },
  },
  thumb: { className: 'custom-thumb', style: { borderRadius: '2px' } },
};
const CORNER_RADIUS = { md: 8 };
const LEAKED_RADIUS_SELECTOR =
  '[rounded], [roundedtop], [roundedright], [roundedbottom], [roundedleft], [roundedtopleft], [roundedtopright], [roundedbottomleft], [roundedbottomright]';

describe('Switch radius props', () => {
  it.each([false, true])('rounds only the track while preserving existing routing (labeled=%s)', (labeled) => {
    const { container } = render(
      <Switch
        {...(labeled ? { label: 'Enable feature' } : { 'aria-label': 'Enable feature' })}
        {...RADIUS_PROPS}
        p="sm"
        width={WIDTH}
        display="inline-flex"
        overflow="hidden"
        className="custom-root"
        style={TOP_STYLE}
      />,
    );
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const outer = labeled ? control.closest('label') : control;

    expect(control).toHaveClass(
      'ps-Switch',
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
    expect(control).toHaveStyle({
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
    expect(outer).toHaveClass('custom-root', 'ps-p', 'ps-width', 'ps-width-md', 'ps-display', 'ps-overflow');
    expect(outer).toHaveStyle({
      borderRadius: '40px',
      marginTop: '4px',
      '--app-accent': 'top',
      '--ps-p': 'var(--perses-spacing-sm)',
      '--ps-width': '120px',
      '--ps-width-md': '200px',
      '--ps-display': 'inline-flex',
      '--ps-overflow': 'hidden',
    });
    if (labeled) {
      expect(control).not.toHaveClass('custom-root', 'ps-p', 'ps-width', 'ps-display', 'ps-overflow');
      expect(control.style.borderRadius).toBe('');
      expect(control.style.getPropertyValue('--ps-p')).toBe('');
    }
    for (const element of container.querySelectorAll<HTMLElement>('*')) {
      if (element === control) continue;
      expect(Array.from(element.classList).some((name) => name.startsWith('ps-rounded'))).toBe(false);
      expect(element.style.getPropertyValue('--ps-rounded')).toBe('');
    }
    expect(control.querySelector<HTMLElement>('.ps-Switch__thumb')?.style.borderRadius).toBe('');
    expect(container.querySelector(LEAKED_RADIUS_SELECTOR)).not.toBeInTheDocument();
  });

  it.each([false, true])('preserves slot and top-level radius override precedence (labeled=%s)', (labeled) => {
    render(
      <Switch
        {...(labeled ? { label: 'Enable feature' } : { 'aria-label': 'Enable feature' })}
        rounded="md"
        roundedTopLeft={CORNER_RADIUS}
        style={OVERRIDE_STYLE}
        slotProps={SLOTS}
      />,
    );
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    expect(control).toHaveClass('ps-Switch', 'custom-control', 'ps-rounded', 'ps-rounded-top-left-md');
    expect(control).toHaveStyle({
      borderRadius: labeled ? '6px' : '40px',
      opacity: '0.8',
      '--ps-rounded': labeled ? '3px' : '99px',
      '--ps-rounded-top-left-md': labeled ? '4px' : '8px',
    });
    expect(control.querySelector('.ps-Switch__thumb')).toHaveClass('ps-Switch__thumb', 'custom-thumb');
    expect(control.querySelector('.ps-Switch__thumb')).toHaveStyle({ borderRadius: '2px' });
    if (labeled) {
      expect(control.closest('label')).toHaveStyle({ borderRadius: '40px', '--ps-rounded': '99px' });
      expect(control.closest('label')).not.toHaveClass('ps-rounded');
    }
  });

  it.each([false, true])(
    'preserves form semantics, refs and toggling with radius props (labeled=%s)',
    async (labeled) => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <form aria-label="Preferences">
          <Switch
            {...(labeled ? { label: 'Enable feature' } : { 'aria-label': 'Enable feature' })}
            {...RADIUS_PROPS}
            ref={ref}
            id="feature"
            name="enabled"
            value="yes"
            uncheckedValue="no"
            required
            aria-invalid
          />
        </form>,
      );
      const control = screen.getByRole('switch', { name: 'Enable feature' });
      const form = screen.getByRole('form', { name: 'Preferences' }) as HTMLFormElement;
      const input = container.querySelector('input[type="checkbox"]');
      expect(control).toHaveClass('ps-rounded');
      expect(ref.current).toBe(control);
      expect(control.tagName).toBe('SPAN');
      expect(control).toHaveAttribute('id', 'feature');
      expect(input).toHaveAttribute('id', 'feature-input');
      expect(input).toHaveAttribute('name', 'enabled');
      expect(input).toHaveAttribute('value', 'yes');
      expect(control).toHaveAttribute('aria-required', 'true');
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(new FormData(form).get('enabled')).toBe('no');

      await userEvent.click(labeled ? screen.getByText('Enable feature') : control);
      expect(control).toBeChecked();
      expect(input).toBeChecked();
      expect(new FormData(form).get('enabled')).toBe('yes');
      expect(container.querySelector(LEAKED_RADIUS_SELECTOR)).not.toBeInTheDocument();
    },
  );

  it.each([false, true])('removes radius classes and variables on rerender (labeled=%s)', (labeled) => {
    const accessibleName = labeled ? { label: 'Enable feature' } : { 'aria-label': 'Enable feature' };
    const { rerender } = render(<Switch {...accessibleName} {...RADIUS_PROPS} style={TOP_STYLE} />);
    const control = screen.getByRole('switch');
    expect(control).toHaveClass('ps-rounded', 'ps-rounded-top-left-xl');

    rerender(<Switch {...accessibleName} style={TOP_STYLE} />);
    expect(screen.getByRole('switch')).toBe(control);
    expect(control).toHaveClass('ps-Switch');
    expect(control.className).not.toContain('ps-rounded');
    expect(control.getAttribute('style') ?? '').not.toContain('--ps-rounded');
    expect(labeled ? control.closest('label') : control).toHaveStyle({
      borderRadius: '40px',
      marginTop: '4px',
      '--app-accent': 'top',
    });
  });
});
