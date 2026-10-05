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
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import { defaultComponents, defaultIcons } from '../defaults';
import { TablePagination } from './TablePagination';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

describe('TablePagination', () => {
  it('shows the current range and total count', () => {
    render(<TablePagination count={42} page={0} rowsPerPage={10} onPageChange={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByText('1-10 of 42')).toBeInTheDocument();
  });

  it('clamps the range on the last page', () => {
    render(<TablePagination count={42} page={4} rowsPerPage={10} onPageChange={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByText('41-42 of 42')).toBeInTheDocument();
  });

  it('disables the previous button on the first page', () => {
    render(<TablePagination count={42} page={0} rowsPerPage={10} onPageChange={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    render(<TablePagination count={42} page={4} rowsPerPage={10} onPageChange={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('calls onPageChange with the next page index', () => {
    const onPageChange = vi.fn();
    render(<TablePagination count={42} page={0} rowsPerPage={10} onPageChange={onPageChange} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with the previous page index', () => {
    const onPageChange = vi.fn();
    render(<TablePagination count={42} page={1} rowsPerPage={10} onPageChange={onPageChange} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('renders a rows-per-page select when onRowsPerPageChange is provided', () => {
    render(
      <TablePagination count={42} page={0} rowsPerPage={10} onPageChange={vi.fn()} onRowsPerPageChange={vi.fn()} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onRowsPerPageChange with the selected value', () => {
    const onRowsPerPageChange = vi.fn();
    render(
      <TablePagination
        count={42}
        page={0}
        rowsPerPage={10}
        onPageChange={vi.fn()}
        onRowsPerPageChange={onRowsPerPageChange}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '25' } });
    expect(onRowsPerPageChange).toHaveBeenCalledWith(25);
  });

  it('handles count=0 correctly', () => {
    render(
      <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
        <TablePagination count={0} page={0} rowsPerPage={10} onPageChange={vi.fn()} />
      </ComponentsProvider>,
    );
    expect(screen.getByText('0-0 of 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
