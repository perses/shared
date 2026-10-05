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
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import { defaultComponents, defaultIcons } from '../defaults';
import { Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow } from './Table';
import { TablePagination } from './TablePagination';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

// jsdom has no PointerEvent constructor, so pointer interactions are simulated with a
// MouseEvent whose `pageX` is overridden (pageX is otherwise a read-only computed property).
function firePointerEvent(target: EventTarget, type: string, pageX: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pageX', { value: pageX, configurable: true });
  target.dispatchEvent(event);
}

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

  it('passes through a custom scope attribute on TableCell, overriding the default', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell header scope="row">
              Row header
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('rowheader')).toHaveAttribute('scope', 'row');
  });

  it('passes through colSpan on TableCell', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>Spans two columns</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '2');
  });

  it('defaults to medium size on the table element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveAttribute('data-size', 'md');
  });

  it('applies the size prop to the table element', () => {
    render(
      <Table size="sm">
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveAttribute('data-size', 'sm');
  });

  it('allows a single cell to override the table-level size', () => {
    render(
      <Table size="sm">
        <TableBody>
          <TableRow>
            <TableCell size="lg">Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell')).toHaveAttribute('data-size', 'lg');
  });

  it('only marks a row hoverable via data-hover when the hover prop is set', () => {
    render(
      <Table>
        <TableBody>
          <TableRow hover>
            <TableCell>Hoverable</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('row')).toHaveAttribute('data-hover', 'true');
  });

  it('does not set data-hover when the hover prop is omitted', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Not hoverable</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('row')).not.toHaveAttribute('data-hover');
  });

  it('renders TableContainer with the ps-TableContainer class', () => {
    render(
      <TableContainer data-testid="container">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>,
    );
    expect(screen.getByTestId('container')).toHaveClass('ps-TableContainer');
  });

  it('marks the table as sticky-header via data-sticky-header', () => {
    render(
      <Table stickyHeader>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveAttribute('data-sticky-header', 'true');
  });

  it('sets aria-sort to ascending when sortDirection is asc', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header sortDirection="asc">
              Name
            </TableCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sets aria-sort to descending when sortDirection is desc', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header sortDirection="desc">
              Name
            </TableCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending');
  });

  it('omits aria-sort when sortDirection is not provided', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Name</TableCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).not.toHaveAttribute('aria-sort');
  });

  it('omits aria-sort when sortDirection is false', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header sortDirection={false}>
              Name
            </TableCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).not.toHaveAttribute('aria-sort');
  });

  it('applies a plain display value as an inline style', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell display="none">Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell', { hidden: true })).toHaveStyle({ display: 'none' });
  });

  it('creates responsive display variables for a breakpoint-keyed display value', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell display={{ default: 'table-cell', xs: 'none' }}>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = screen.getByRole('cell');
    expect(cell).toHaveClass('ps-responsive-display');
    expect(cell).toHaveStyle({
      '--ps-responsive-display-default': 'table-cell',
      '--ps-responsive-display-xs': 'none',
    });
  });

  it('does not apply the responsive display class when display is omitted', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell')).not.toHaveClass('ps-responsive-display');
  });

  it('applies the tableLayout prop to the table element', () => {
    render(
      <Table tableLayout="fixed">
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveAttribute('data-table-layout', 'fixed');
  });

  it('omits data-table-layout when tableLayout is not fixed', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).not.toHaveAttribute('data-table-layout');
  });

  it('pins a cell via the sticky prop', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell sticky="left">Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell')).toHaveAttribute('data-sticky', 'left');
  });

  it('does not set data-sticky when the sticky prop is omitted', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell')).not.toHaveAttribute('data-sticky');
  });

  it('renders a resize handle when resizable is set', () => {
    render(
      <Table tableLayout="fixed">
        <TableBody>
          <TableRow>
            <TableCell resizable>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('does not render a resize handle when resizable is omitted', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('calls onResize with the dragged width when the resize handle is dragged wider', () => {
    const onResize = vi.fn();
    render(
      <Table tableLayout="fixed">
        <TableBody>
          <TableRow>
            <TableCell resizable onResize={onResize}>
              Value
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    firePointerEvent(screen.getByRole('separator'), 'pointerdown', 100);
    firePointerEvent(document, 'pointermove', 150);
    expect(onResize).toHaveBeenCalledWith(50);
    firePointerEvent(document, 'pointerup', 150);
  });

  it('clamps onResize to minResizeWidth when dragged narrower than the minimum', () => {
    const onResize = vi.fn();
    render(
      <Table tableLayout="fixed">
        <TableBody>
          <TableRow>
            <TableCell resizable onResize={onResize}>
              Value
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    firePointerEvent(screen.getByRole('separator'), 'pointerdown', 100);
    firePointerEvent(document, 'pointermove', 50);
    expect(onResize).toHaveBeenCalledWith(40);
    firePointerEvent(document, 'pointerup', 50);
  });

  it('stops reporting resize after the handle is released', () => {
    const onResize = vi.fn();
    render(
      <Table tableLayout="fixed">
        <TableBody>
          <TableRow>
            <TableCell resizable onResize={onResize}>
              Value
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    firePointerEvent(screen.getByRole('separator'), 'pointerdown', 100);
    firePointerEvent(document, 'pointermove', 150);
    firePointerEvent(document, 'pointerup', 150);
    onResize.mockClear();
    firePointerEvent(document, 'pointermove', 200);
    expect(onResize).not.toHaveBeenCalled();
  });

  it('stops reporting resize after the cell unmounts mid-drag', () => {
    const onResize = vi.fn();
    const { unmount } = render(
      <Table tableLayout="fixed">
        <TableBody>
          <TableRow>
            <TableCell resizable onResize={onResize}>
              Value
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    firePointerEvent(screen.getByRole('separator'), 'pointerdown', 100);
    firePointerEvent(document, 'pointermove', 150);
    expect(onResize).toHaveBeenCalledWith(50);

    unmount();
    onResize.mockClear();
    firePointerEvent(document, 'pointermove', 200);
    firePointerEvent(document, 'pointerup', 200);
    expect(onResize).not.toHaveBeenCalled();
  });

  it('composes a TablePagination inside a footer cell with colSpan', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>
              <TablePagination count={10} page={0} rowsPerPage={5} onPageChange={vi.fn()} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('1-5 of 10')).toBeInTheDocument();
    expect(screen.getByText('1-5 of 10').closest('td')).toHaveAttribute('colspan', '2');
  });
});
