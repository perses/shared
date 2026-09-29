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

import { Chip } from './Chip';

const noop = (): void => {};

describe('Chip', () => {
  it('renders the label', () => {
    render(<Chip label="Production" />);
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('applies the ps-Chip class', () => {
    render(<Chip label="Production" />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toBeInTheDocument();
  });

  it('defaults to default color', () => {
    render(<Chip label="Production" />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveAttribute('data-color', 'default');
  });

  it('sets data-color attribute', () => {
    render(<Chip label="Secondary" color="secondary" />);
    expect(screen.getByText('Secondary').closest('.ps-Chip')).toHaveAttribute('data-color', 'secondary');
  });

  it('sets data-status attribute independently of color', () => {
    render(<Chip label="Error" color="secondary" status="error" />);
    const chip = screen.getByText('Error').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-color', 'secondary');
    expect(chip).toHaveAttribute('data-status', 'error');
  });

  it('defaults to the sm filled variant', () => {
    render(<Chip label="Production" />);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'sm');
    expect(chip).toHaveAttribute('data-variant', 'filled');
  });

  it('sets data-size and data-variant attributes', () => {
    render(<Chip label="Production" size="md" variant="outlined" />);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip).toHaveAttribute('data-variant', 'outlined');
  });

  it('renders an optional leading icon', () => {
    render(<Chip label="Production" icon={<svg data-testid="leading-icon" />} />);
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
  });

  it('uses children when label is omitted', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('renders a delete button when onDelete is provided', () => {
    render(<Chip label="Removable" onDelete={noop} />);
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('calls onDelete when the delete button is clicked', async () => {
    const handleDelete = vi.fn();
    render(<Chip label="Removable" onDelete={handleDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('uses a custom delete icon when provided', () => {
    render(<Chip label="Removable" onDelete={noop} deleteIcon={<svg data-testid="delete-icon" />} />);
    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
  });

  it('does not propagate delete clicks to the chip', async () => {
    const handleClick = vi.fn();
    const handleDelete = vi.fn();
    render(<Chip label="Removable" onClick={handleClick} onDelete={handleDelete} />);

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders separate sibling controls when a Chip is clickable and removable', () => {
    render(<Chip label="Removable" onClick={noop} onDelete={noop} />);

    const chip = screen.getByText('Removable').closest('.ps-Chip');
    expect(chip).not.toHaveAttribute('role', 'button');
    expect(screen.getByRole('button', { name: 'Removable' })).toHaveClass('ps-Chip__action');
    expect(screen.getByRole('button', { name: /remove removable/i })).toBeInTheDocument();
  });

  it('renders clickable Chips as keyboard-operable buttons', async () => {
    const handleClick = vi.fn();
    render(<Chip label="Show all" onClick={handleClick} />);

    const chip = screen.getByRole('button', { name: 'Show all' });
    await userEvent.click(chip);
    await userEvent.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('renders href Chips as links', () => {
    render(<Chip label="Documentation" href="/docs" target="_blank" />);
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('target', '_blank');
  });

  it('prevents interactions when disabled', async () => {
    const handleClick = vi.fn();
    const handleDelete = vi.fn();
    render(<Chip label="Disabled" disabled onClick={handleClick} onDelete={handleDelete} />);

    await userEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(handleClick).not.toHaveBeenCalled();
    expect(handleDelete).not.toHaveBeenCalled();
  });

  it('supports a custom close-button aria label and properties', () => {
    render(
      <Chip
        label="Production"
        onDelete={noop}
        closeBtnAriaLabel="Remove production environment"
        closeBtnProps={{ 'data-testid': 'close-button' }}
      />,
    );

    expect(screen.getByTestId('close-button')).toHaveAccessibleName('Remove production environment');
  });

  it('renders a custom close button without nesting it in another button', async () => {
    const handleDelete = vi.fn();
    render(<Chip label="Production" onDelete={handleDelete} closeBtn={<button type="button">Remove custom</button>} />);

    const closeButton = screen.getByRole('button', { name: /remove production/i });
    expect(closeButton.parentElement).toHaveClass('ps-Chip');
    await userEvent.click(closeButton);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('sets a label max width for truncation', () => {
    render(<Chip label="Production" textMaxWidth="12ch" />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({ '--chip-label-max-width': '12ch' });
  });

  it('renders no delete button when onDelete is omitted', () => {
    render(<Chip label="Fixed" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('merges additional className', () => {
    render(<Chip label="Production" className="custom" />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveClass('custom');
  });

  it('forwards div attributes', () => {
    render(<Chip label="Production" aria-describedby="chip-description" data-testid="production-chip" />);
    expect(screen.getByTestId('production-chip')).toHaveAttribute('aria-describedby', 'chip-description');
  });
});
