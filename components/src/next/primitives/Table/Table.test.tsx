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

import { Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from './Table';

describe('Table', () => {
  it('renders a table element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('applies the ps-Table class', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveClass('ps-Table');
  });

  it('renders header cells with the columnheader role', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Name</TableCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  });

  it('renders body cells with the cell role', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>42</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell', { name: '42' })).toBeInTheDocument();
  });

  it('renders a footer section', () => {
    render(
      <Table>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('marks a row as selected via data-selected', () => {
    render(
      <Table>
        <TableBody>
          <TableRow selected>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('row')).toHaveAttribute('data-selected', 'true');
  });

  it('aligns cell content via the align prop', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell align="right">42</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell')).toHaveAttribute('data-align', 'right');
  });

  it('merges additional className on Table', () => {
    render(
      <Table className="custom">
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveClass('ps-Table');
    expect(screen.getByRole('table')).toHaveClass('custom');
  });
});
