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

import type { Size, Status } from '../types';
import { TextField } from './TextField';
import type { TextFieldStyle } from './TextField';

const responsiveWidth = { default: '100%', md: '20rem' };
const STYLE_OVERRIDE = { width: '99px' };
const COLOR_STYLE = { color: 'red' };
const SIZE_OVERRIDE_STYLE: TextFieldStyle = { '--perses-textfield-size-md': '40px' };
const DOLLAR = <span>$</span>;
const PERCENT = <span>%</span>;
const START_ICON = <span data-testid="start-icon" />;
const END_ICON = <span data-testid="end-icon" />;

/** Root element of the field whose control is named by `label`. */
const getRoot = (label = 'Name'): HTMLElement =>
  screen.getByLabelText(label).closest('.ps-TextField') as HTMLElement;

describe('TextField', () => {
  it('renders an input associated with its label', () => {
    render(<TextField label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('applies the ps-TextField class to the root', () => {
    render(<TextField label="Name" />);
    expect(getRoot()).toHaveClass('ps-TextField');
  });

  it('renders helper text', () => {
    render(<TextField label="Name" helperText="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('sets data-status="error" when status is error', () => {
    render(<TextField label="Name" status="error" />);
    expect(getRoot()).toHaveAttribute('data-status', 'error');
  });

  it('sets data-status="warning" when status is warning', () => {
    render(<TextField label="Name" status="warning" />);
    expect(getRoot()).toHaveAttribute('data-status', 'warning');
  });

  it('sets data-status="success" when status is success', () => {
    render(<TextField label="Name" status="success" />);
    expect(getRoot()).toHaveAttribute('data-status', 'success');
  });

  it('sets data-full-width when fullWidth is true', () => {
    render(<TextField label="Name" fullWidth />);
    expect(getRoot()).toHaveAttribute('data-full-width');
  });

  it('sets data-size on the root', () => {
    render(<TextField label="Name" size="lg" />);
    expect(getRoot()).toHaveAttribute('data-size', 'lg');
  });

  it('accepts a value and calls onChange', async () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" value="" onChange={handleChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('works uncontrolled with defaultValue and still reports onChange', async () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" defaultValue="a" onChange={handleChange} />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveValue('a');
    await userEvent.type(input, 'bc');
    expect(input).toHaveValue('abc');
    expect(handleChange).toHaveBeenCalledTimes(2);
  });

  it('supports disabled state', () => {
    render(<TextField label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('forwards a ref to the underlying input', () => {
    const ref = createRef<HTMLInputElement | HTMLTextAreaElement>();
    render(<TextField label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders without a visible label when aria-label is provided', () => {
    render(<TextField aria-label="Search" placeholder="Search" />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('requires an accessible name at the type level', () => {
    // @ts-expect-error -- one of label, aria-label or aria-labelledby is required
    const missingName = <TextField placeholder="Search" />;
    const withLabel = <TextField label="Name" />;
    const withAriaLabel = <TextField aria-label="Name" />;
    const withAriaLabelledBy = <TextField aria-labelledby="name-id" />;
    expect([missingName, withLabel, withAriaLabel, withAriaLabelledBy]).toHaveLength(4);
  });

  it('renders a textarea when multiline is true', () => {
    render(<TextField label="Comment" multiline />);
    expect(screen.getByLabelText('Comment').tagName).toBe('TEXTAREA');
  });

  it('sets rows on the textarea when multiline', () => {
    render(<TextField label="Comment" multiline rows={5} />);
    expect(screen.getByLabelText('Comment')).toHaveAttribute('rows', '5');
  });

  it('sets data-multiline on the root when multiline is true', () => {
    render(<TextField label="Comment" multiline />);
    expect(getRoot('Comment')).toHaveAttribute('data-multiline');
  });

  it('forwards a ref to the underlying textarea when multiline', () => {
    const ref = createRef<HTMLInputElement | HTMLTextAreaElement>();
    render(<TextField label="Comment" multiline ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('renders startAdornment', () => {
    render(<TextField label="Search" startAdornment={START_ICON} />);
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
  });

  it('renders endAdornment', () => {
    render(<TextField label="Search" endAdornment={END_ICON} />);
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('applies a plain width through a custom property', () => {
    render(<TextField label="Name" width="20rem" />);
    const root = getRoot();
    expect(root).toHaveClass('ps-width');
    expect(root).toHaveStyle({ '--ps-width': '20rem' });
  });

  it('applies responsive width via the style-prop class and CSS variables', () => {
    render(<TextField label="Name" width={responsiveWidth} />);
    const root = getRoot();
    expect(root).toHaveClass('ps-width');
    expect(root).toHaveStyle({
      '--ps-width': '100%',
      '--ps-width-md': '20rem',
    });
  });

  it('applies spacing and overflow props to the root', () => {
    render(<TextField label="Name" m="md" overflow="hidden" />);
    const root = getRoot();
    expect(root).toHaveClass('ps-m', 'ps-overflow');
    expect(root).toHaveStyle({
      '--ps-m': 'var(--perses-spacing-md)',
      '--ps-overflow': 'hidden',
    });
  });

  it('does not accept a display prop because the stylesheet fixes display', () => {
    // @ts-expect-error display is fixed by the TextField stylesheet
    render(<TextField label="Name" display="block" />);
    const root = getRoot();
    expect(root).not.toHaveClass('ps-display');
    expect(root.style.getPropertyValue('--ps-display')).toBe('');
  });

  it('places className and style on the root, not the input', () => {
    const { container } = render(<TextField label="Name" className="custom" style={COLOR_STYLE} />);
    const root = container.querySelector<HTMLElement>('.ps-TextField');
    expect(root).toHaveClass('custom');
    expect(root?.style.color).toBe('red');

    const input = screen.getByRole('textbox');
    expect(input).not.toHaveClass('custom');
    expect(input.style.color).toBe('');
  });

  it('applies a per-size override custom property to the root', () => {
    const { container } = render(<TextField label="Name" style={SIZE_OVERRIDE_STYLE} />);

    const root = container.querySelector<HTMLElement>('.ps-TextField');
    expect(root?.style.getPropertyValue('--perses-textfield-size-md')).toBe('40px');
  });

  it('merges the style prop and lets it override computed styles', () => {
    render(<TextField label="Name" width="20rem" style={STYLE_OVERRIDE} />);
    expect(getRoot()).toHaveStyle({ width: '99px' });
  });

  it('does not forward style props to the input', () => {
    render(<TextField label="Name" m="md" width="20rem" id="x" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('id', 'x');
    expect(input).not.toHaveAttribute('m');
    expect(input).not.toHaveAttribute('width');
  });

  it('sets readonly on the input when readOnly', () => {
    render(<TextField label="Name" readOnly />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('readonly');
  });

  it('applies every size and status combination', () => {
    const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
    const statuses: Array<Status | undefined> = [undefined, 'error', 'warning', 'success', 'info'];
    for (const size of sizes) {
      for (const status of statuses) {
        const { unmount } = render(<TextField label="Name" size={size} status={status} />);
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
    render(<TextField label="Name" />);
    expect(getRoot()).toHaveAttribute('data-size', 'md');
  });

  describe('accessibility', () => {
    it('names the input from the label via htmlFor/id, with a generated id', () => {
      render(<TextField label="Name" />);
      const input = screen.getByRole('textbox', { name: 'Name' });
      expect(input.id).not.toBe('');
      expect(screen.getByText('Name')).toHaveAttribute('for', input.id);
    });

    it('uses a provided id for both the input and the label', () => {
      render(<TextField label="Name" id="custom" />);
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('id', 'custom');
      expect(screen.getByText('Name')).toHaveAttribute('for', 'custom');
    });

    it('generates distinct ids for multiple fields', () => {
      render(
        <>
          <TextField label="First" />
          <TextField label="Second" />
        </>,
      );
      expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
    });

    it('supports aria-label when there is no visible label', () => {
      render(<TextField aria-label="Search" />);
      expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <span id="lbl">External label</span>
          <TextField aria-labelledby="lbl" />
        </>,
      );
      expect(screen.getByRole('textbox', { name: 'External label' })).toBeInTheDocument();
    });

    it('does not include adornments or helper text in the accessible name', () => {
      render(<TextField label="Amount" helperText="In dollars" startAdornment={DOLLAR} endAdornment={PERCENT} />);
      expect(screen.getByRole('textbox', { name: 'Amount' })).toBeInTheDocument();
    });

    it('links helper text through aria-describedby', () => {
      render(<TextField label="Name" helperText="Shown to your team" />);
      const input = screen.getByRole('textbox', { name: 'Name' });
      expect(input).toHaveAccessibleDescription('Shown to your team');
    });

    it('has no aria-describedby without helper text', () => {
      render(<TextField label="Name" />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });

    it('keeps a consumer aria-describedby alongside the helper text', () => {
      render(
        <>
          <span id="extra">Extra hint</span>
          <TextField label="Name" helperText="Helper" aria-describedby="extra" />
        </>,
      );
      expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Extra hint Helper');
    });

    it('sets aria-invalid for the error status only', () => {
      const statuses: Array<Status | undefined> = [undefined, 'warning', 'success', 'info'];
      const { rerender } = render(<TextField label="Name" status="error" helperText="Required" />);
      expect(screen.getByRole('textbox')).toBeInvalid();
      expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Required');
      for (const status of statuses) {
        rerender(<TextField label="Name" status={status} />);
        expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true');
      }
    });

    it('honors an explicit aria-invalid', () => {
      render(<TextField label="Name" aria-invalid="true" />);
      expect(screen.getByRole('textbox')).toBeInvalid();
    });

    it('marks required fields natively', () => {
      render(<TextField label="Name" required />);
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeRequired();
    });

    it('exposes the disabled state and prevents typing', async () => {
      const handleChange = vi.fn();
      render(<TextField label="Name" disabled onChange={handleChange} />);
      const input = screen.getByRole('textbox', { name: 'Name' });
      expect(input).toBeDisabled();
      await userEvent.type(input, 'a');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('exposes the read-only state', () => {
      render(<TextField label="Name" readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('is reachable and operable by keyboard', () => {
      render(<TextField label="Name" />);
      userEvent.tab();
      const input = screen.getByRole('textbox', { name: 'Name' });
      expect(input).toHaveFocus();
      userEvent.keyboard('abc');
      expect(input).toHaveValue('abc');
    });

    it('focuses the control when the label is clicked', async () => {
      render(<TextField label="Name" />);
      await userEvent.click(screen.getByText('Name'));
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('skips disabled fields in the tab order', async () => {
      render(
        <>
          <TextField label="First" disabled />
          <TextField label="Second" />
        </>,
      );
      userEvent.tab();
      expect(screen.getByLabelText('Second')).toHaveFocus();
    });

    it('gives a multiline textarea the same name, description and invalid wiring', () => {
      render(<TextField label="Comment" multiline status="error" helperText="Too short" required />);
      const textarea = screen.getByRole('textbox', { name: 'Comment' });
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAccessibleDescription('Too short');
      expect(textarea).toBeInvalid();
      expect(textarea).toBeRequired();
    });

    it('lets a multiline textarea be typed into by keyboard', async () => {
      render(<TextField label="Comment" multiline />);
      userEvent.tab();
      userEvent.keyboard('a{enter}b');
      expect(screen.getByRole('textbox')).toHaveValue('a\nb');
    });

    it('forwards a function ref', () => {
      const ref = vi.fn();
      render(<TextField label="Name" ref={ref} />);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });
  });
});
