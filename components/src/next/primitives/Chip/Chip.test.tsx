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
import type { CSSProperties, FormEvent } from 'react';

import { Chip } from './Chip';

const noop = (): void => {};
const customChipStyle: CSSProperties & { '--chip-label-max-width': string } = {
  marginTop: 4,
  '--chip-label-max-width': '20ch',
};
const startElement = <svg data-testid="start-element" />;
const closeIcon = <svg data-testid="close-icon" />;

describe('Chip', () => {
  it('renders its children', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('applies the ps-Chip class', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production').closest('.ps-Chip')).toBeInTheDocument();
  });

  it('defaults to default color', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveAttribute('data-color', 'default');
  });

  it('sets data-color attribute', () => {
    render(<Chip color="secondary">Secondary</Chip>);
    expect(screen.getByText('Secondary').closest('.ps-Chip')).toHaveAttribute('data-color', 'secondary');
  });

  it('sets data-status attribute independently of color', () => {
    render(
      <Chip color="secondary" status="error">
        Error
      </Chip>,
    );
    const chip = screen.getByText('Error').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-color', 'secondary');
    expect(chip).toHaveAttribute('data-status', 'error');
  });

  it('defaults to the sm solid variant', () => {
    render(<Chip>Production</Chip>);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'sm');
    expect(chip).toHaveAttribute('data-variant', 'solid');
  });

  it('sets data-size and data-variant attributes', () => {
    render(
      <Chip size="md" variant="outline">
        Production
      </Chip>,
    );
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip).toHaveAttribute('data-variant', 'outline');
  });

  it('renders an optional start element', () => {
    render(<Chip startElement={startElement}>Production</Chip>);
    expect(screen.getByTestId('start-element')).toBeInTheDocument();
  });

  it('supports interactive elements inside children', async () => {
    const handleClose = vi.fn();
    render(
      <Chip onClose={handleClose} closeAriaLabel="Remove variable">
        <input aria-label="Variable label" defaultValue="production" />
        <button type="button">Edit label</button>
      </Chip>,
    );

    const input = screen.getByRole('textbox', { name: 'Variable label' });
    const editButton = screen.getByRole('button', { name: 'Edit label' });

    await userEvent.type(input, ' west');
    expect(input).toHaveValue('production west');
    await userEvent.tab();
    expect(editButton).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(handleClose).not.toHaveBeenCalled();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove variable' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders a close button when onClose is provided', () => {
    render(<Chip onClose={noop}>Removable</Chip>);
    expect(screen.getByRole('button', { name: 'Remove Removable' })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const handleClose = vi.fn();
    render(<Chip onClose={handleClose}>Removable</Chip>);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('uses a custom close icon when provided', () => {
    render(
      <Chip onClose={noop} closeIcon={closeIcon}>
        Removable
      </Chip>,
    );
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('supports a custom close aria label', () => {
    render(
      <Chip onClose={noop} closeAriaLabel="Remove production environment">
        Production
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Remove production environment' })).toBeInTheDocument();
  });

  it('does not propagate close-button clicks to a parent', async () => {
    const handleClick = vi.fn();
    const handleClose = vi.fn();
    render(
      <div role="presentation" onClick={handleClick}>
        <Chip onClose={handleClose}>Removable</Chip>
      </div>,
    );

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports onClick and onClose together', async () => {
    const handleClick = vi.fn();
    const handleClose = vi.fn();
    render(
      <Chip onClick={handleClick} onClose={handleClose}>
        Selectable
      </Chip>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Selectable' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Remove Selectable' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard activation of the close button separate from onClick', async () => {
    const handleClick = vi.fn();
    const handleClose = vi.fn();
    render(
      <Chip onClick={handleClick} onClose={handleClose}>
        Selectable
      </Chip>,
    );

    screen.getByRole('button', { name: 'Remove Selectable' }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(handleClose).toHaveBeenCalledTimes(2);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders clickable Chips as keyboard-operable buttons', async () => {
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Show all</Chip>);

    const chip = screen.getByRole('button', { name: 'Show all' });
    await userEvent.click(chip);
    chip.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('does not submit a form when selecting or removing a Chip', async () => {
    const handleSubmit = vi.fn((event: FormEvent<HTMLFormElement>): void => event.preventDefault());
    const handleClick = vi.fn();
    const handleClose = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <Chip onClick={handleClick}>Selectable</Chip>
        <Chip onClose={handleClose}>Removable</Chip>
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Selectable' }));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Removable' }));

    expect(handleClick).toHaveBeenCalledTimes(3);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it.each(['clickable', 'removable'] as const)('prevents interactions on a disabled %s Chip', async (mode) => {
    const handleAction = vi.fn();
    render(
      mode === 'clickable' ? (
        <Chip disabled onClick={handleAction}>
          Disabled
        </Chip>
      ) : (
        <Chip disabled onClose={handleAction}>
          Disabled
        </Chip>
      ),
    );

    await userEvent.click(screen.getByRole('button'));

    expect(handleAction).not.toHaveBeenCalled();
  });

  it('keeps visual props on the container and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Chip
        ref={ref}
        color="secondary"
        status="warning"
        size="md"
        variant="outline"
        disabled
        className="custom-chip"
        style={customChipStyle}
        maxWidth={120}
        onClose={noop}
      >
        Production
      </Chip>,
    );

    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(ref.current).toBe(chip);
    expect(chip).toHaveClass('custom-chip');
    expect(chip).toHaveAttribute('data-color', 'secondary');
    expect(chip).toHaveAttribute('data-status', 'warning');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip).toHaveAttribute('data-variant', 'outline');
    expect(chip).toHaveAttribute('data-disabled', 'true');
    expect(chip).toHaveStyle({ '--chip-label-max-width': '120px', marginTop: '4px' });
  });

  it.each([
    [120, '120px'],
    [0, '0px'],
    ['12ch', '12ch'],
  ])('sets maxWidth %s as the CSS length %s', (maxWidth, expected) => {
    render(
      <Chip maxWidth={maxWidth} style={customChipStyle}>
        Production
      </Chip>,
    );
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({
      '--chip-label-max-width': expected,
      marginTop: '4px',
    });
  });

  it('restores the style-defined width when maxWidth is removed', () => {
    const { rerender } = render(
      <Chip maxWidth={120} style={customChipStyle}>
        Production
      </Chip>,
    );

    rerender(<Chip style={customChipStyle}>Production</Chip>);

    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({
      '--chip-label-max-width': '20ch',
      marginTop: '4px',
    });
  });

  it('renders no close button when onClose is omitted', () => {
    render(<Chip>Fixed</Chip>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('merges additional className', () => {
    render(<Chip className="custom">Production</Chip>);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveClass('custom');
  });

  it('forwards div attributes', () => {
    render(
      <Chip aria-describedby="chip-description" data-testid="production-chip">
        Production
      </Chip>,
    );
    expect(screen.getByTestId('production-chip')).toHaveAttribute('aria-describedby', 'chip-description');
  });
});
