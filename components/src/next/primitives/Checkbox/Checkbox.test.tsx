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
import type { CSSProperties } from 'react';

import type { ColorVariant, Size, Status } from '../types';
import { Checkbox } from './Checkbox';
import type { CheckboxStyle, CheckboxVariant } from './Checkbox';

const POSITION_STYLE: CSSProperties = { position: 'absolute' };
const RESPONSIVE_WIDTH = { default: 100, md: 200 };
const WIDTH_OVERRIDE = { '--ps-width': '50px' } as CSSProperties;
const MARGIN_STYLE = { marginTop: '8px' };
const SIZES: Size[] = ['xs', 'sm', 'md', 'lg'];
const VARIANTS: CheckboxVariant[] = ['solid', 'subtle', 'outline'];
const COLORS: Array<ColorVariant | Status> = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
const handleKeyboardInteraction = (): void => undefined;
describe('Checkbox', () => {
  it('renders an unchecked checkbox with default variants', () => {
    render(<Checkbox aria-label="Select item" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Select item' });
    expect(checkbox).toHaveClass('ps-Checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('data-unchecked');
    expect(checkbox).toHaveAttribute('data-size', 'md');
    expect(checkbox).toHaveAttribute('data-color', 'default');
    expect(checkbox).toHaveAttribute('data-variant', 'subtle');
  });

  it.each(VARIANTS)('preserves selection and interaction states with variant=%s', async (variant) => {
    const handleCheckedChange = vi.fn();
    const { rerender } = render(
      <Checkbox label="Select item" variant={variant} onCheckedChange={handleCheckedChange} />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Select item' });
    expect(checkbox).toHaveAttribute('data-variant', variant);
    expect(checkbox).not.toHaveAttribute('variant');
    expect(checkbox.closest('label')).not.toHaveAttribute('data-variant');

    await userEvent.click(screen.getByText('Select item'));
    expect(checkbox).toBeChecked();
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);

    rerender(<Checkbox label="Select item" variant={variant} indeterminate />);
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');

    rerender(<Checkbox label="Select item" variant={variant} disabled onCheckedChange={handleCheckedChange} />);
    await userEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);

    rerender(<Checkbox label="Select item" variant={variant} readOnly onCheckedChange={handleCheckedChange} />);
    checkbox.focus();
    await userEvent.keyboard(' ');
    expect(checkbox).toHaveFocus();
    expect(checkbox).toBeChecked();
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
  });

  it('supports controlled state and reports changes', async () => {
    const handleCheckedChange = vi.fn();
    render(<Checkbox aria-label="Select item" checked={false} onCheckedChange={handleCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select item' }));

    expect(handleCheckedChange).toHaveBeenCalledWith(true, { event: expect.any(Event) });
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('supports controlled visual-only checkboxes inside clickable option rows', async () => {
    const handleOptionClick = vi.fn();
    // Native select/option elements cannot contain the checkbox used by this custom listbox fixture.
    /* oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role */
    render(
      <ul role="listbox">
        <li role="option" aria-selected tabIndex={0} onClick={handleOptionClick} onKeyDown={handleKeyboardInteraction}>
          <Checkbox aria-label="Select option" checked />
          Option label
        </li>
      </ul>,
    );
    /* oxlint-enable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role */

    const checkbox = screen.getByRole('checkbox', { name: 'Select option' });
    await userEvent.click(checkbox);

    expect(handleOptionClick).toHaveBeenCalledTimes(1);
    expect(checkbox).toBeChecked();
  });

  it('supports uncontrolled state', async () => {
    render(<Checkbox aria-label="Select item" defaultChecked />);

    const checkbox = screen.getByRole('checkbox', { name: 'Select item' });
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute('data-unchecked');
  });

  it('supports keyboard toggling', async () => {
    const handleCheckedChange = vi.fn();
    render(<Checkbox aria-label="Select item" onCheckedChange={handleCheckedChange} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Select item' });
    checkbox.focus();
    await userEvent.keyboard(' ');

    expect(handleCheckedChange).toHaveBeenCalledWith(true, { event: expect.any(Event) });
    expect(checkbox).toBeChecked();
  });

  it('exposes checked and indeterminate state', () => {
    const { rerender } = render(<Checkbox aria-label="Select item" checked />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-checked');

    rerender(<Checkbox aria-label="Select item" checked={false} indeterminate />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox).toHaveAttribute('data-indeterminate');
    expect(checkbox.querySelector('.ps-Checkbox__indicator')).toBeInTheDocument();
  });

  it('supports disabled, read-only, required, and invalid states', async () => {
    const handleCheckedChange = vi.fn();
    const { rerender } = render(
      <Checkbox
        aria-label="Select item"
        checked={false}
        disabled
        required
        invalid
        onCheckedChange={handleCheckedChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAttribute('data-disabled');
    expect(checkbox).toHaveAttribute('data-invalid');
    await userEvent.click(checkbox);
    expect(handleCheckedChange).not.toHaveBeenCalled();

    rerender(<Checkbox aria-label="Select item" checked disabled />);
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute('data-checked');

    rerender(<Checkbox aria-label="Select item" readOnly onCheckedChange={handleCheckedChange} />);
    expect(checkbox).toHaveAttribute('aria-readonly', 'true');
    expect(checkbox).toHaveAttribute('data-readonly');
    await userEvent.click(checkbox);
    expect(handleCheckedChange).not.toHaveBeenCalled();
  });

  it.each([false, undefined])('removes the invalid marker when invalid becomes %s', (invalid) => {
    const { rerender } = render(<Checkbox aria-label="Select item" invalid />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-invalid', '');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');

    rerender(<Checkbox aria-label="Select item" invalid={invalid} />);
    expect(checkbox).not.toHaveAttribute('data-invalid');

    rerender(<Checkbox aria-label="Select item" invalid />);
    expect(checkbox).toHaveAttribute('data-invalid', '');
  });

  it.each([false, undefined])('removes the label disabled marker when disabled becomes %s', (disabled) => {
    const { rerender } = render(<Checkbox label="Select item" disabled />);
    const field = screen.getByRole('checkbox').closest('label');
    expect(field).toHaveAttribute('data-disabled', '');

    rerender(<Checkbox label="Select item" disabled={disabled} />);
    expect(field).not.toHaveAttribute('data-disabled');

    rerender(<Checkbox label="Select item" disabled />);
    expect(field).toHaveAttribute('data-disabled', '');
  });

  it('renders a clickable visible label', async () => {
    render(<Checkbox label="Accept terms" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    await userEvent.click(screen.getByText('Accept terms'));

    expect(checkbox).toBeChecked();
  });

  it('accepts composed label content and preserves a consumer-provided aria-describedby', () => {
    render(
      <>
        <span id="external-description">External guidance</span>
        <Checkbox
          aria-describedby="external-description"
          label={
            <>
              Accept <a href="/terms">the terms</a>
            </>
          }
        />
      </>,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAccessibleDescription('External guidance');
    expect(screen.getByRole('link', { name: 'the terms' })).toBeInTheDocument();
  });

  it('exposes size, color, and label position for customization', () => {
    const { container } = render(
      <Checkbox label="Select item" labelPosition="start" size="sm" color="success" className="custom" />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('ps-Checkbox');
    expect(checkbox).not.toHaveClass('custom');
    expect(checkbox).toHaveAttribute('data-size', 'sm');
    expect(checkbox).toHaveAttribute('data-color', 'success');
    const field = container.querySelector('.ps-Checkbox__field');
    expect(field).toHaveClass('custom');
    expect(field).toHaveAttribute('data-label-position', 'start');
  });

  it('supports compact and standard table sizes without ripple markup', () => {
    const { container } = render(
      <>
        <Checkbox aria-label="Compact row" size="sm" />
        <Checkbox aria-label="Standard row" size="md" />
      </>,
    );

    expect(screen.getByRole('checkbox', { name: 'Compact row' })).toHaveAttribute('data-size', 'sm');
    expect(screen.getByRole('checkbox', { name: 'Standard row' })).toHaveAttribute('data-size', 'md');
    expect(container.querySelector('.MuiTouchRipple-root')).not.toBeInTheDocument();
  });

  it('supports table positioning and keyboard tab exclusion', () => {
    render(<Checkbox aria-label="Select table row" style={POSITION_STYLE} tabIndex={-1} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Select table row' });
    expect(checkbox).toHaveStyle({ position: 'absolute' });
    expect(checkbox).toHaveAttribute('tabindex', '-1');
  });

  it('applies a per-size override custom property to the control', () => {
    const style: CheckboxStyle = { '--perses-checkbox-size-md': '40px' };
    render(<Checkbox aria-label="Row" size="md" style={style} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.style.getPropertyValue('--perses-checkbox-size-md')).toBe('40px');
  });

  it('places a per-size override on the field wrapper so it inherits to the control when labeled', () => {
    const style: CheckboxStyle = { '--perses-checkbox-size-md': '40px' };
    const { container } = render(<Checkbox label="Accept" size="md" style={style} />);

    const field = container.querySelector<HTMLElement>('.ps-Checkbox__field');
    expect(field?.style.getPropertyValue('--perses-checkbox-size-md')).toBe('40px');
  });

  it('supports form values and a hidden input ref', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<Checkbox aria-label="Select item" defaultChecked name="selected" value="item-1" inputRef={inputRef} />);

    expect(inputRef.current).toHaveAttribute('type', 'checkbox');
    expect(inputRef.current).toHaveAttribute('name', 'selected');
    expect(inputRef.current).toHaveAttribute('value', 'item-1');
    expect(inputRef.current).toBeChecked();
  });

  it('forwards native props and the root ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Checkbox ref={ref} aria-label="Select item" tabIndex={-1} data-testid="checkbox" />);

    const checkbox = screen.getByTestId('checkbox');
    expect(ref.current).toBe(checkbox);
    expect(checkbox).toHaveAttribute('tabindex', '-1');
  });

  describe('style props', () => {
    it('applies style props to the control when there is no field', () => {
      render(<Checkbox aria-label="Select item" m="md" width={RESPONSIVE_WIDTH} />);

      const checkbox = screen.getByRole('checkbox') as HTMLElement;
      expect(checkbox).toHaveClass('ps-m', 'ps-width');
      expect(checkbox.style.getPropertyValue('--ps-width')).toBe('100px');
      expect(checkbox.style.getPropertyValue('--ps-width-md')).toBe('200px');
    });

    it('applies style props to the field wrapper when a label is rendered', () => {
      render(<Checkbox label="Accept" m="md" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toHaveClass('ps-m');
      expect(checkbox.closest('.ps-Checkbox__field')).toHaveClass('ps-m');
    });

    it('applies the raw style prop to the field wrapper when a label is rendered', () => {
      render(<Checkbox label="Accept" style={MARGIN_STYLE} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toHaveStyle(MARGIN_STYLE);
      expect(checkbox.closest('.ps-Checkbox__field')).toHaveStyle(MARGIN_STYLE);
    });

    it('lets the style prop override computed variables', () => {
      render(<Checkbox aria-label="Select item" width={100} style={WIDTH_OVERRIDE} />);
      expect(screen.getByRole('checkbox')).toHaveStyle({ '--ps-width': '50px' });
    });

    it('does not leak style props to the DOM', () => {
      render(<Checkbox aria-label="Select item" m="sm" />);
      expect(screen.getByRole('checkbox')).not.toHaveAttribute('m');
    });
  });

  describe('size and color combinations', () => {
    it.each(SIZES.flatMap((size) => COLORS.map((color) => [size, color] as const)))(
      'renders size=%s color=%s in every state',
      (size, color) => {
        render(
          <>
            <Checkbox aria-label="unchecked" size={size} color={color} />
            <Checkbox aria-label="checked" size={size} color={color} defaultChecked />
            <Checkbox aria-label="mixed" size={size} color={color} indeterminate />
            <Checkbox aria-label="disabled" size={size} color={color} disabled />
            <Checkbox aria-label="readonly" size={size} color={color} readOnly />
            <Checkbox aria-label="invalid" size={size} color={color} invalid />
          </>,
        );

        const boxes = screen.getAllByRole('checkbox');
        expect(boxes).toHaveLength(6);
        for (const box of boxes) {
          expect(box).toHaveAttribute('data-size', size);
          expect(box).toHaveAttribute('data-color', color);
        }
        expect(screen.getByRole('checkbox', { name: 'mixed' })).toHaveAttribute('aria-checked', 'mixed');
      },
    );

    it.each(['start', 'end'] as const)('renders labelPosition=%s', (labelPosition) => {
      const { container } = render(<Checkbox label="Label" labelPosition={labelPosition} />);
      expect(container.querySelector('.ps-Checkbox__field')).toHaveAttribute('data-label-position', labelPosition);
    });
  });

  describe('accessibility', () => {
    it('is named by a visible label, aria-label or aria-labelledby', () => {
      render(
        <>
          <Checkbox label="Visible" />
          <Checkbox aria-label="Aria label" />
          <span id="external-name">External name</span>
          <Checkbox aria-labelledby="external-name" />
        </>,
      );

      expect(screen.getByRole('checkbox', { name: 'Visible' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Aria label' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'External name' })).toBeInTheDocument();
    });

    it('is reachable with Tab and toggles with Space but not Enter', async () => {
      render(<Checkbox label="Accept" />);

      await userEvent.tab();
      const checkbox = screen.getByRole('checkbox', { name: 'Accept' });
      expect(checkbox).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      expect(checkbox).not.toBeChecked();

      await userEvent.keyboard(' ');
      expect(checkbox).toBeChecked();

      await userEvent.keyboard(' ');
      expect(checkbox).not.toBeChecked();
    });

    it('skips disabled checkboxes when tabbing and ignores keyboard input', async () => {
      const handleCheckedChange = vi.fn();
      render(
        <>
          <Checkbox aria-label="Disabled" disabled onCheckedChange={handleCheckedChange} />
          <Checkbox aria-label="Enabled" />
        </>,
      );

      await userEvent.tab();
      expect(screen.getByRole('checkbox', { name: 'Enabled' })).toHaveFocus();
      await userEvent.keyboard(' ');
      expect(handleCheckedChange).not.toHaveBeenCalled();
    });

    it('keeps read-only checkboxes focusable but unchangeable', async () => {
      render(<Checkbox aria-label="Read only" readOnly checked />);

      await userEvent.tab();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveFocus();
      await userEvent.keyboard(' ');
      expect(checkbox).toBeChecked();
    });

    it('exposes aria-checked for checked, unchecked and mixed states', () => {
      const { rerender } = render(<Checkbox aria-label="State" checked={false} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');

      rerender(<Checkbox aria-label="State" checked />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');

      rerender(<Checkbox aria-label="State" checked={false} indeterminate />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('wires aria-invalid and aria-required only when set', () => {
      const { rerender } = render(<Checkbox aria-label="Terms" />);
      expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-invalid');
      expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-required');

      rerender(<Checkbox aria-label="Terms" invalid required />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-required', 'true');
    });

    it('preserves a consumer-provided aria-invalid when the invalid prop is not set', () => {
      render(<Checkbox aria-label="Terms" aria-invalid="grammar" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'grammar');
    });

    it('hides the decorative mark from assistive technology', () => {
      const { container } = render(<Checkbox aria-label="Item" checked />);
      expect(container.querySelector('.ps-Checkbox__mark')).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
