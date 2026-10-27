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
import userEvent from '@testing-library/user-event';
import { createRef, useCallback, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import { defaultComponents, defaultIcons } from '../defaults';
import { TablePagination } from './TablePagination';
import type { TablePaginationSlotProps } from './TablePagination';

const SLOT_PROPS: TablePaginationSlotProps = {
  rowsPerPage: {
    className: 'custom-rows-per-page',
    style: { letterSpacing: '1px', '--app-rows-per-page': 1 },
  },
  select: { className: 'custom-select', style: { fontFamily: 'monospace', '--app-select': 'select' } },
  range: { className: 'custom-range', style: { fontVariantNumeric: 'tabular-nums', '--app-range': 'range' } },
  previousButton: {
    className: 'custom-previous',
    style: { borderRadius: 0, '--app-previous': 'previous' },
  },
  nextButton: { className: 'custom-next', style: { outlineOffset: '2px', '--app-next': 'next' } },
};
const ROOT_STYLE = { marginTop: '4px', '--app-pagination-root': 'root' };
const PREVIOUS_ICON = <span>Custom previous icon</span>;
const NEXT_ICON = <span>Custom next icon</span>;

function createStructuralSlotProps(onSlotEvent: () => void): TablePaginationSlotProps {
  // Nonliteral objects can carry unsupported keys despite the styling-only public type.
  const slotProps = {
    rowsPerPage: {
      className: 'custom-rows-per-page',
      children: 'Wrong label',
      htmlFor: 'missing-select',
      role: 'button',
      'aria-label': 'Wrong label name',
      onClick: onSlotEvent,
    },
    select: {
      className: 'custom-select',
      children: <option value={999}>Wrong option</option>,
      role: 'textbox',
      'aria-label': 'Wrong select name',
      id: 'forged-select',
      name: 'forged-select',
      value: 50,
      defaultValue: 50,
      multiple: true,
      disabled: true,
      onChange: onSlotEvent,
      render: 'input',
    },
    range: { className: 'custom-range', children: 'Wrong range', role: 'alert', onClick: onSlotEvent },
    previousButton: {
      className: 'custom-previous',
      children: 'Wrong previous icon',
      role: 'link',
      'aria-label': 'Wrong previous name',
      name: 'forged-previous',
      type: 'submit',
      disabled: true,
      onClick: onSlotEvent,
      variant: 'solid',
      size: 'lg',
    },
    nextButton: {
      className: 'custom-next',
      children: 'Wrong next icon',
      role: 'link',
      'aria-label': 'Wrong next name',
      name: 'forged-next',
      type: 'submit',
      disabled: true,
      onClick: onSlotEvent,
      variant: 'solid',
      size: 'lg',
    },
    root: { className: 'wrong-root', style: { display: 'none' } },
  };
  return slotProps;
}

function createBoundarySlotProps(onClick: () => void): TablePaginationSlotProps {
  return {
    previousButton: { className: 'custom-previous', disabled: false, onClick },
    nextButton: { className: 'custom-next', disabled: false, onClick },
  } as TablePaginationSlotProps;
}

function ControlledPagination({ slotProps }: { slotProps?: TablePaginationSlotProps }): ReactElement {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handleRowsPerPageChange = useCallback((value: number): void => {
    setRowsPerPage(value);
    setPage(0);
  }, []);

  return (
    <TablePagination
      count={42}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={setPage}
      onRowsPerPageChange={handleRowsPerPageChange}
      previousIcon={PREVIOUS_ICON}
      nextIcon={NEXT_ICON}
      slotProps={slotProps}
    />
  );
}

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

  it('renders the navigation buttons as small ghost IconButtons', () => {
    render(<TablePagination count={42} page={0} rowsPerPage={10} onPageChange={vi.fn()} />, { wrapper: Wrapper });
    const previous = screen.getByRole('button', { name: 'Previous page' });
    expect(previous).toHaveClass('ps-IconButton');
    expect(previous).toHaveAttribute('data-variant', 'ghost');
    expect(previous).toHaveAttribute('data-size', 'sm');
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
    expect(screen.getByText('Rows per page')).toBeInTheDocument();
  });

  it('renders a custom rows-per-page label', () => {
    render(
      <TablePagination
        count={42}
        page={0}
        rowsPerPage={10}
        labelRowsPerPage="Lignes par page"
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Lignes par page')).toBeInTheDocument();
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument();
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

  describe('slot styling', () => {
    it('styles all five parts while preserving root classes, styles, attributes and ref', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <TablePagination
          count={42}
          page={1}
          rowsPerPage={10}
          onPageChange={vi.fn()}
          onRowsPerPageChange={vi.fn()}
          ref={ref}
          id="pagination"
          aria-label="Table pagination"
          data-consumer="pagination"
          className="custom-root"
          style={ROOT_STYLE}
          slotProps={SLOT_PROPS}
        />,
        { wrapper: Wrapper },
      );
      const root = container.firstElementChild;
      const label = screen.getByText('Rows per page');
      const select = screen.getByRole('combobox', { name: 'Rows per page' });
      const range = screen.getByText('11-20 of 42');
      const previous = screen.getByRole('button', { name: 'Previous page' });
      const next = screen.getByRole('button', { name: 'Next page' });

      expect(ref.current).toBe(root);
      expect(root).toHaveAttribute('class', 'ps-TablePagination custom-root');
      expect(root).toHaveAttribute('id', 'pagination');
      expect(root).toHaveAttribute('aria-label', 'Table pagination');
      expect(root).toHaveAttribute('data-consumer', 'pagination');
      expect(root).toHaveStyle({ marginTop: '4px', '--app-pagination-root': 'root' });
      expect(container.querySelector('[slotprops]')).not.toBeInTheDocument();
      expect(label).toHaveClass('ps-TablePagination__rowsPerPage', 'custom-rows-per-page');
      expect(label).toHaveStyle({ letterSpacing: '1px', '--app-rows-per-page': '1' });
      expect(select).toHaveClass('custom-select');
      expect(select).toHaveStyle({ fontFamily: 'monospace', '--app-select': 'select' });
      expect(range).toHaveClass('ps-TablePagination__range', 'custom-range');
      expect(range).toHaveStyle({ fontVariantNumeric: 'tabular-nums', '--app-range': 'range' });
      expect(previous).toHaveClass('ps-ButtonBase', 'ps-IconButton', 'custom-previous');
      expect(previous).toHaveStyle({ borderRadius: 0, '--app-previous': 'previous' });
      expect(next).toHaveClass('ps-ButtonBase', 'ps-IconButton', 'custom-next');
      expect(next).toHaveStyle({ outlineOffset: '2px', '--app-next': 'next' });
      for (const element of [label, select, range, previous, next]) {
        expect(element).not.toHaveClass('custom-root');
        expect(element.style.marginTop).toBe('');
        expect(element.style.getPropertyValue('--app-pagination-root')).toBe('');
      }
    });

    it('keeps styled pagination controlled and functional', async () => {
      render(<ControlledPagination slotProps={SLOT_PROPS} />, { wrapper: Wrapper });
      const previous = screen.getByRole('button', { name: 'Previous page' });
      const next = screen.getByRole('button', { name: 'Next page' });
      const select = screen.getByRole('combobox', { name: 'Rows per page' });
      expect(next).toHaveClass('custom-next');
      expect(previous).toBeDisabled();
      expect(select).toHaveValue('10');

      await userEvent.click(next);
      expect(screen.getByText('11-20 of 42')).toBeInTheDocument();
      expect(previous).toBeEnabled();
      await userEvent.click(previous);
      expect(screen.getByText('1-10 of 42')).toBeInTheDocument();
      await userEvent.click(next);
      await userEvent.selectOptions(select, '25');
      expect(select).toHaveValue('25');
      expect(screen.getByText('1-25 of 42')).toBeInTheDocument();
      expect(previous).toBeDisabled();
      await userEvent.click(next);
      expect(screen.getByText('26-42 of 42')).toBeInTheDocument();
      expect(next).toBeDisabled();
    });

    it('ignores structurally assignable extra keys without replacing content, semantics or handlers', async () => {
      const onSlotEvent = vi.fn();
      const slotProps = createStructuralSlotProps(onSlotEvent);
      const { container } = render(<ControlledPagination slotProps={slotProps} />, { wrapper: Wrapper });
      const label = screen.getByText('Rows per page');
      const select = screen.getByRole('combobox', { name: 'Rows per page' });
      const range = screen.getByText('1-10 of 42');
      const previous = screen.getByRole('button', { name: 'Previous page' });
      const next = screen.getByRole('button', { name: 'Next page' });
      expect(label).toHaveClass('custom-rows-per-page');
      expect(select).toHaveClass('custom-select');
      expect(range).toHaveClass('custom-range');
      expect(previous).toHaveClass('custom-previous');
      expect(next).toHaveClass('custom-next');
      expect(container.firstElementChild).toHaveAttribute('class', 'ps-TablePagination');
      expect(container.firstElementChild).not.toHaveAttribute('style');
      expect(container.querySelector('[slotprops]')).not.toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
      expect(label).not.toHaveAttribute('for');
      expect(label).not.toHaveAttribute('role');
      expect(label).not.toHaveAttribute('aria-label');
      expect(select.tagName).toBe('SELECT');
      expect(select).not.toHaveAttribute('id');
      expect(select).not.toHaveAttribute('name');
      expect(select).not.toHaveAttribute('role');
      expect(select).not.toHaveAttribute('multiple');
      expect(select).not.toHaveAttribute('aria-label');
      expect(select).toHaveValue('10');
      expect(select).toBeEnabled();
      expect(screen.getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual(['10', '25', '50']);
      expect(range.tagName).toBe('SPAN');
      expect(range).not.toHaveAttribute('role');
      expect(previous).toContainElement(screen.getByText('Custom previous icon'));
      expect(next).toContainElement(screen.getByText('Custom next icon'));
      for (const button of [previous, next]) {
        expect(button).not.toHaveAttribute('role');
        expect(button).not.toHaveAttribute('name');
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('data-size', 'sm');
        expect(button).toHaveAttribute('data-variant', 'ghost');
      }
      expect(previous).toBeDisabled();
      expect(next).toBeEnabled();

      await userEvent.click(next);
      expect(screen.getByText('11-20 of 42')).toBeInTheDocument();
      expect(previous).toBeEnabled();
      await userEvent.click(previous);
      expect(screen.getByText('1-10 of 42')).toBeInTheDocument();
      await userEvent.selectOptions(select, '25');
      expect(select).toHaveValue('25');
      expect(screen.getByText('1-25 of 42')).toBeInTheDocument();
      await userEvent.click(label);
      await userEvent.click(range);
      expect(onSlotEvent).not.toHaveBeenCalled();
      expect(screen.queryByText(/^Wrong/)).not.toBeInTheDocument();
    });

    it.each([0, 4])('ignores type-bypassed attempts to enable boundary buttons on page %s', async (page) => {
      const onPageChange = vi.fn();
      const onSlotClick = vi.fn();
      const slotProps = createBoundarySlotProps(onSlotClick);
      render(
        <TablePagination count={42} page={page} rowsPerPage={10} onPageChange={onPageChange} slotProps={slotProps} />,
        { wrapper: Wrapper },
      );
      const buttonName = page === 0 ? 'Previous page' : 'Next page';
      const disabledButton = screen.getByRole('button', { name: buttonName });
      expect(disabledButton).toHaveClass(page === 0 ? 'custom-previous' : 'custom-next');
      expect(disabledButton).toBeDisabled();
      await userEvent.click(disabledButton);
      expect(onPageChange).not.toHaveBeenCalled();
      expect(onSlotClick).not.toHaveBeenCalled();
    });

    it('does not render the optional label or select just because they have slot styles', () => {
      const { container } = render(
        <TablePagination count={42} page={0} rowsPerPage={10} onPageChange={vi.fn()} slotProps={SLOT_PROPS} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByText('1-10 of 42')).toHaveClass('custom-range');
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByText('Rows per page')).not.toBeInTheDocument();
      expect(container.querySelector('label')).not.toBeInTheDocument();
      expect(container.querySelector('.custom-rows-per-page')).not.toBeInTheDocument();
      expect(container.querySelector('.custom-select')).not.toBeInTheDocument();
    });

    it('removes all slot classes and styles on rerender while retaining the existing parts', () => {
      const onPageChange = vi.fn();
      const onRowsPerPageChange = vi.fn();
      const { rerender } = render(
        <TablePagination
          count={42}
          page={0}
          rowsPerPage={10}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className="custom-root"
          style={ROOT_STYLE}
          slotProps={SLOT_PROPS}
        />,
        { wrapper: Wrapper },
      );
      const label = screen.getByText('Rows per page');
      const select = screen.getByRole('combobox');
      const range = screen.getByText('1-10 of 42');
      const previous = screen.getByRole('button', { name: 'Previous page' });
      const next = screen.getByRole('button', { name: 'Next page' });
      for (const element of [label, select, range, previous, next]) {
        expect(element.style.cssText).not.toBe('');
      }

      rerender(
        <TablePagination
          count={42}
          page={0}
          rowsPerPage={10}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className="custom-root"
          style={ROOT_STYLE}
        />,
      );
      expect(screen.getByText('Rows per page')).toBe(label);
      expect(screen.getByRole('combobox')).toBe(select);
      expect(screen.getByText('1-10 of 42')).toBe(range);
      expect(screen.getByRole('button', { name: 'Previous page' })).toBe(previous);
      expect(screen.getByRole('button', { name: 'Next page' })).toBe(next);
      expect(label).toHaveClass('ps-TablePagination__rowsPerPage');
      expect(range).toHaveClass('ps-TablePagination__range');
      expect(previous).toHaveClass('ps-ButtonBase', 'ps-IconButton');
      expect(next).toHaveClass('ps-ButtonBase', 'ps-IconButton');
      for (const element of [label, select, range, previous, next]) {
        expect(element.className).not.toMatch(/custom-(?:rows-per-page|select|range|previous|next)/);
        expect(element.style.cssText).toBe('');
      }
      expect(label.parentElement).toHaveAttribute('class', 'ps-TablePagination custom-root');
      expect(label.parentElement).toHaveStyle({ marginTop: '4px', '--app-pagination-root': 'root' });
      expect(previous).toBeDisabled();
      expect(next).toBeEnabled();
    });
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
