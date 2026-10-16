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

import { TableSortLabel } from './TableSortLabel';

describe('TableSortLabel', () => {
  it('renders its children inside a button', () => {
    render(<TableSortLabel>Name</TableSortLabel>);
    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
  });

  it('defaults direction to asc', () => {
    render(<TableSortLabel>Name</TableSortLabel>);
    expect(screen.getByRole('button')).toHaveAttribute('data-direction', 'asc');
  });

  it('reflects the direction prop', () => {
    render(<TableSortLabel direction="desc">Name</TableSortLabel>);
    expect(screen.getByRole('button')).toHaveAttribute('data-direction', 'desc');
  });

  it('marks active via data-active', () => {
    render(<TableSortLabel active>Name</TableSortLabel>);
    expect(screen.getByRole('button')).toHaveAttribute('data-active', 'true');
  });

  it('does not set data-active when inactive', () => {
    render(<TableSortLabel>Name</TableSortLabel>);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-active');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<TableSortLabel onClick={onClick}>Name</TableSortLabel>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a custom icon when the icon prop is provided', () => {
    render(<TableSortLabel icon={<svg data-testid="custom-icon" />}>Name</TableSortLabel>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
