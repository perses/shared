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
    render(<Chip label="Error" color="error" />);
    expect(screen.getByText('Error').closest('.ps-Chip')).toHaveAttribute('data-color', 'error');
  });

  it('defaults to the small filled variant', () => {
    render(<Chip label="Production" />);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'small');
    expect(chip).toHaveAttribute('data-variant', 'filled');
  });

  it('sets data-size and data-variant attributes', () => {
    render(<Chip label="Production" size="medium" variant="outlined" />);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'medium');
    expect(chip).toHaveAttribute('data-variant', 'outlined');
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
