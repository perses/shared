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
import { TextField } from './TextField';
import type { TextFieldSlotProps } from './TextField';

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
const SLOTS: TextFieldSlotProps = {
  wrapper: {
    className: 'custom-wrapper',
    style: { borderRadius: '6px', '--ps-rounded': '3px', '--ps-rounded-top-left-md': '4px' },
  },
  input: { className: 'custom-input', style: { color: 'red' } },
};
const CORNER_RADIUS = { md: 8 };
const LEAKED_RADIUS_SELECTOR =
  '[rounded], [roundedtop], [roundedright], [roundedbottom], [roundedleft], [roundedtopleft], [roundedtopright], [roundedbottomleft], [roundedbottomright]';

describe('TextField radius props', () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('rounds only the visible wrapper (labeled=%s, multiline=%s)', (labeled, multiline) => {
    const { container } = render(
      <TextField
        {...(labeled ? { label: 'Name' } : { 'aria-label': 'Name' })}
        {...RADIUS_PROPS}
        multiline={multiline}
        p="sm"
        width={WIDTH}
        overflow="hidden"
        className="custom-root"
        style={TOP_STYLE}
        name="username"
        placeholder="Your name"
        required
        helperText="Shown to your team"
        status="error"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    const wrapper = input.parentElement;
    const root = input.closest('.ps-TextField');

    expect(wrapper).toHaveClass(
      'ps-TextField__wrapper',
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
    expect(wrapper).toHaveStyle({
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
    expect(root).toHaveClass('ps-TextField', 'custom-root', 'ps-p', 'ps-width', 'ps-width-md', 'ps-overflow');
    expect(root).toHaveStyle({
      borderRadius: '40px',
      marginTop: '4px',
      '--ps-p': 'var(--perses-spacing-sm)',
      '--ps-width': '120px',
      '--ps-width-md': '200px',
      '--ps-overflow': 'hidden',
      '--app-accent': 'root',
    });
    expect(wrapper).not.toHaveClass('custom-root', 'ps-p', 'ps-width', 'ps-overflow');
    for (const element of container.querySelectorAll<HTMLElement>('*')) {
      if (element === wrapper) continue;
      expect(Array.from(element.classList).some((name) => name.startsWith('ps-rounded'))).toBe(false);
      expect(element.style.getPropertyValue('--ps-rounded')).toBe('');
    }
    expect(container.querySelector(LEAKED_RADIUS_SELECTOR)).not.toBeInTheDocument();
    expect(input.tagName).toBe(multiline ? 'TEXTAREA' : 'INPUT');
    expect(input).toHaveAttribute('name', 'username');
    expect(input).toHaveAttribute('placeholder', 'Your name');
    expect(input).toBeRequired();
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Shown to your team');
  });

  it('lets wrapper slot styles override radius variables without moving top-level styles off the root', () => {
    render(
      <TextField label="Name" rounded="md" roundedTopLeft={CORNER_RADIUS} style={OVERRIDE_STYLE} slotProps={SLOTS} />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    const wrapper = input.parentElement;
    const root = input.closest('.ps-TextField');

    expect(wrapper).toHaveClass('ps-TextField__wrapper', 'custom-wrapper', 'ps-rounded', 'ps-rounded-top-left-md');
    expect(wrapper).toHaveStyle({ borderRadius: '6px', '--ps-rounded': '3px', '--ps-rounded-top-left-md': '4px' });
    expect(root).toHaveStyle({ borderRadius: '40px', '--ps-rounded': '99px', '--app-accent': 'root' });
    expect(root).not.toHaveClass('ps-rounded');
    expect(input).toHaveClass('ps-TextField__input', 'custom-input');
    expect(input.style.color).toBe('red');
    expect(input.style.getPropertyValue('--ps-rounded')).toBe('');
  });

  it('preserves the input ref and typing and removes radius classes and variables on rerender', async () => {
    const ref = createRef<HTMLInputElement | HTMLTextAreaElement>();
    const { rerender } = render(<TextField label="Name" ref={ref} {...RADIUS_PROPS} style={TOP_STYLE} />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    const wrapper = input.parentElement;
    expect(wrapper).toHaveClass('ps-rounded', 'ps-rounded-top-left-xl');
    expect(ref.current).toBe(input);
    await userEvent.click(screen.getByText('Name'));
    expect(input).toHaveFocus();
    await userEvent.type(input, 'Ada');
    expect(input).toHaveValue('Ada');

    rerender(<TextField label="Name" ref={ref} style={TOP_STYLE} />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBe(input);
    expect(wrapper).toHaveClass('ps-TextField__wrapper');
    expect(wrapper?.className).not.toContain('ps-rounded');
    expect(wrapper?.getAttribute('style') ?? '').not.toContain('--ps-rounded');
    expect(input.closest('.ps-TextField')).toHaveStyle({
      borderRadius: '40px',
      marginTop: '4px',
      '--app-accent': 'root',
    });
    expect(input).toHaveValue('Ada');
  });
});
