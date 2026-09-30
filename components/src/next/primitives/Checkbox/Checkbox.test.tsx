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
import { createElement, createRef } from 'react';

import { Checkbox } from './Checkbox';
import type { CheckboxStyle } from './Checkbox';

const TERMS_LINK = <a href="/terms">Read the terms</a>;
const TABLE_CHECKBOX_STYLE: CheckboxStyle = {
  position: 'absolute',
  '--perses-checkbox-border-color': 'rgb(10, 20, 30)',
  '--perses-checkbox-color': 'rgb(10, 20, 30)',
};
const handleKeyboardInteraction = (): void => undefined;
describe('Checkbox', () => {
  it('renders an unchecked checkbox with default variants', () => {
    render(<Checkbox aria-label="Select item" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Select item' });
    expect(checkbox).toHaveClass('ps-Checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('data-unchecked');
    expect(checkbox).toHaveAttribute('data-size', 'md');
    expect(checkbox).toHaveAttribute('data-color', 'primary');
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
    render(
      createElement(
        'ul',
        { role: 'listbox' },
        createElement(
          'li',
          {
            role: 'option',
            'aria-selected': true,
            tabIndex: 0,
            onClick: handleOptionClick,
            onKeyDown: handleKeyboardInteraction,
          },
          <Checkbox aria-label="Select option" checked />,
          'Option label',
        ),
      ),
    );

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
      <Checkbox aria-label="Select item" disabled required invalid onCheckedChange={handleCheckedChange} />,
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

  it('renders a clickable visible label', async () => {
    render(<Checkbox label="Accept terms" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    await userEvent.click(screen.getByText('Accept terms'));

    expect(checkbox).toBeChecked();
  });

  it('associates description text and renders body content', () => {
    render(<Checkbox aria-label="Accept terms" description="Required to continue" body={TERMS_LINK} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(checkbox).toHaveAccessibleDescription('Required to continue');
    expect(screen.getByRole('link', { name: 'Read the terms' })).toBeInTheDocument();
  });

  it('preserves a consumer-provided aria-describedby value', () => {
    render(
      <>
        <span id="external-description">External guidance</span>
        <Checkbox aria-label="Select item" aria-describedby="external-description" description="Local guidance" />
      </>,
    );

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('External guidance Local guidance');
  });

  it('exposes size, color, and label position for customization', () => {
    const { container } = render(
      <Checkbox label="Select item" labelPosition="start" size="sm" color="success" className="custom" />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('ps-Checkbox', 'custom');
    expect(checkbox).toHaveAttribute('data-size', 'sm');
    expect(checkbox).toHaveAttribute('data-color', 'success');
    expect(container.querySelector('.ps-Checkbox__field')).toHaveAttribute('data-label-position', 'start');
    expect(container.querySelector('.ps-Checkbox__field')).toHaveAttribute('data-size', 'sm');
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

  it('supports table positioning, dynamic colors, and keyboard tab exclusion', () => {
    render(<Checkbox aria-label="Select table row" style={TABLE_CHECKBOX_STYLE} tabIndex={-1} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Select table row' });
    expect(checkbox).toHaveStyle({ position: 'absolute' });
    expect(checkbox.style.getPropertyValue('--perses-checkbox-border-color')).toBe('rgb(10, 20, 30)');
    expect(checkbox.style.getPropertyValue('--perses-checkbox-color')).toBe('rgb(10, 20, 30)');
    expect(checkbox).toHaveAttribute('tabindex', '-1');
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
});
