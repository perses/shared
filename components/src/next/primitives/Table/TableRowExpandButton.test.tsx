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

import { fireEvent, render, screen } from '@testing-library/react';

import { TableRowExpandButton } from './TableRowExpandButton';

const customIcon = <svg data-testid="custom-icon" />;

describe('TableRowExpandButton', () => {
  it('renders a button', () => {
    render(<TableRowExpandButton aria-label="Expand row" />);
    expect(screen.getByRole('button', { name: 'Expand row' })).toBeInTheDocument();
  });

  it('does not set data-expanded by default', () => {
    render(<TableRowExpandButton aria-label="Expand row" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-expanded');
  });

  it('sets aria-expanded to false by default', () => {
    render(<TableRowExpandButton aria-label="Expand row" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles aria-expanded with the expanded prop', () => {
    const { rerender } = render(<TableRowExpandButton aria-label="Expand row" expanded={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    rerender(<TableRowExpandButton aria-label="Collapse row" expanded />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('accepts visible children as the accessible name', () => {
    render(<TableRowExpandButton>Details</TableRowExpandButton>);
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it('rejects a button with neither children nor aria-label at the type level', () => {
    // @ts-expect-error -- an accessible name (children or aria-label) is required
    render(<TableRowExpandButton expanded />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('reflects the expanded prop', () => {
    render(<TableRowExpandButton aria-label="Collapse row" expanded />);
    expect(screen.getByRole('button')).toHaveAttribute('data-expanded', 'true');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<TableRowExpandButton aria-label="Expand row" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a custom icon when the icon prop is provided', () => {
    render(<TableRowExpandButton aria-label="Expand row" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
