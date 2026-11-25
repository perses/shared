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

import { TextField } from './TextField';
import type { TextFieldSlotProps } from './TextField';

const COLOR_STYLE = { color: 'red' };
const SLOT_PROPS: TextFieldSlotProps = {
  label: { className: 'custom-label', style: { letterSpacing: '1px' } },
  wrapper: { className: 'custom-wrapper', style: { borderRadius: 0 } },
  input: { className: 'custom-input', style: { fontFamily: 'monospace', '--app-input-accent': 'blue' } },
  helper: { className: 'custom-helper', style: { fontStyle: 'italic' } },
};

function createStructuralSlotProps(ref: Ref<HTMLInputElement>, onChange: () => void): TextFieldSlotProps {
  // Nonliteral objects may carry extra keys despite the styling-only public type.
  const slotProps = {
    label: { className: 'custom-label', htmlFor: 'missing-control', children: 'Wrong label' },
    wrapper: { className: 'custom-wrapper', role: 'button', 'data-disabled': 'forged' },
    input: {
      className: 'custom-input',
      id: 'slot-input-id',
      ref,
      onChange,
      disabled: true,
      value: 'blocked',
      'aria-label': 'Wrong name',
      'aria-describedby': 'missing-description',
      'aria-invalid': false,
      'data-disabled': 'forged',
      render: 'div',
    },
    helper: { className: 'custom-helper', id: 'slot-helper-id', children: 'Wrong helper', render: 'div' },
  };
  return slotProps;
}

/** Root element of the field whose control is named by `label`. */
const getRoot = (label = 'Name'): HTMLElement => screen.getByLabelText(label).closest('.ps-TextField') as HTMLElement;

describe('TextField slot styling', () => {
  it.each([false, true])('styles each documented part without changing root styling (multiline=%s)', (multiline) => {
    render(
      <TextField
        label="Name"
        helperText="Shown to your team"
        multiline={multiline}
        className="custom-root"
        style={COLOR_STYLE}
        slotProps={SLOT_PROPS}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    const label = screen.getByText('Name');
    const helper = screen.getByText('Shown to your team');
    const root = getRoot();

    expect(root).toHaveClass('ps-TextField', 'custom-root');
    expect(root.style.color).toBe('red');
    expect(root).not.toHaveClass('custom-label');
    expect(root).not.toHaveClass('custom-wrapper');
    expect(root).not.toHaveClass('custom-input');
    expect(root).not.toHaveClass('custom-helper');
    expect(label).toHaveClass('ps-TextField__label', 'custom-label');
    expect(label).toHaveStyle({ letterSpacing: '1px' });
    expect(input.parentElement).toHaveClass('ps-TextField__wrapper', 'custom-wrapper');
    expect(input.parentElement).toHaveStyle({ borderRadius: 0 });
    expect(input).toHaveClass('ps-TextField__input', 'custom-input');
    expect(input).not.toHaveClass('custom-root');
    expect(input).toHaveStyle({ fontFamily: 'monospace', '--app-input-accent': 'blue' });
    expect(input.style.color).toBe('');
    expect(helper).toHaveClass('ps-TextField__helper', 'ps-TextHelper', 'custom-helper');
    expect(helper).toHaveStyle({ fontStyle: 'italic' });
    expect(input).not.toHaveAttribute('slotprops');
    expect(input).toHaveAccessibleDescription('Shown to your team');
  });

  it.each([false, true])(
    'ignores structural slot keys even on nonliteral objects (multiline=%s)',
    async (multiline) => {
      const ref = createRef<HTMLInputElement | HTMLTextAreaElement>();
      const slotRef = createRef<HTMLInputElement>();
      const onChange = vi.fn();
      const slotOnChange = vi.fn();
      const slotProps = createStructuralSlotProps(slotRef, slotOnChange);
      render(
        <>
          <span id="extra">Extra hint</span>
          <TextField
            label="Name"
            id="name-input"
            helperText="Shown to your team"
            aria-describedby="extra"
            status="error"
            size="lg"
            multiline={multiline}
            ref={ref}
            onChange={onChange}
            slotProps={slotProps}
          />
        </>,
      );
      const input = screen.getByRole('textbox', { name: 'Name' });
      expect(input).toHaveClass('custom-input');
      expect(input.tagName).toBe(multiline ? 'TEXTAREA' : 'INPUT');
      expect(input).toHaveAttribute('id', 'name-input');
      expect(input).toBeEnabled();
      expect(input).toBeInvalid();
      expect(input).not.toHaveAttribute('data-disabled');
      expect(input.parentElement).not.toHaveAttribute('data-disabled');
      expect(input.parentElement).not.toHaveAttribute('role');
      expect(input).toHaveAccessibleDescription('Extra hint Shown to your team');
      expect(screen.getByText('Shown to your team')).not.toHaveAttribute('id', 'slot-helper-id');
      expect(getRoot()).toHaveAttribute('data-size', 'lg');
      expect(getRoot()).toHaveAttribute('data-status', 'error');
      expect(ref.current).toBe(input);
      expect(slotRef.current).toBeNull();

      await userEvent.click(screen.getByText('Name'));
      expect(input).toHaveFocus();
      await userEvent.type(input, 'abc');
      expect(input).toHaveValue('abc');
      expect(onChange).toHaveBeenCalledTimes(3);
      expect(slotOnChange).not.toHaveBeenCalled();
    },
  );

  it('does not render optional parts just because they have slot styles', () => {
    render(<TextField aria-label="Name" slotProps={SLOT_PROPS} />);
    const root = getRoot();
    expect(root.querySelector('.custom-label')).not.toBeInTheDocument();
    expect(root.querySelector('.custom-helper')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });

  it('removes slot overrides on rerender without removing required classes', () => {
    const { rerender } = render(<TextField label="Name" helperText="Helper" slotProps={SLOT_PROPS} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
    rerender(<TextField label="Name" helperText="Helper" />);
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveClass('ps-TextField__input');
    expect(input).not.toHaveClass('custom-input');
    expect(input.style.fontFamily).toBe('');
    expect(input.style.getPropertyValue('--app-input-accent')).toBe('');
    expect(screen.getByText('Name')).toHaveClass('ps-TextField__label');
    expect(screen.getByText('Name')).not.toHaveClass('custom-label');
    expect(input.parentElement).toHaveClass('ps-TextField__wrapper');
    expect(input.parentElement).not.toHaveClass('custom-wrapper');
    expect(screen.getByText('Helper')).toHaveClass('ps-TextField__helper', 'ps-TextHelper');
    expect(screen.getByText('Helper')).not.toHaveClass('custom-helper');
  });

  it('preserves disabled state on styled controls and helpers', () => {
    render(<TextField label="Name" helperText="Helper" disabled slotProps={SLOT_PROPS} />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(getRoot()).toHaveAttribute('data-disabled');
    expect(screen.getByText('Helper')).toHaveClass('custom-helper');
    expect(screen.getByText('Helper')).toHaveAttribute('data-disabled');
  });
});
