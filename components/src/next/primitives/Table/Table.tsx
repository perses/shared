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

import clsx from 'clsx';
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes, PointerEventHandler, TdHTMLAttributes } from 'react';

import type { DisplayProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps } from '../system';
import type { Size } from '../types';

import '../system/layout.css';
import './table.css';

const TABLE_CELL_STYLE_PROPS = compileStyleProps([displayProps]);

export type SortDirection = 'asc' | 'desc';

/**
 * Root table element. Renders a native `<table>`.
 *
 * Row selection is composed from the `Checkbox` primitive rather than a table-specific control:
 * `<TableCell><Checkbox aria-label="Select row" /></TableCell>`.
 *
 * @example
 * <Table>
 *   <TableHead>...</TableHead>
 *   <TableBody>...</TableBody>
 * </Table>
 */
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  size?: Size;
  stickyHeader?: boolean;
  tableLayout?: 'auto' | 'fixed';
}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, size = 'md', stickyHeader, tableLayout, ...props },
  ref,
) {
  return (
    <table
      ref={ref}
      data-size={size}
      data-sticky-header={stickyHeader || undefined}
      data-table-layout={tableLayout === 'fixed' ? 'fixed' : undefined}
      className={clsx('ps-Table', className)}
      {...props}
    />
  );
});

/**
 * Scrollable wrapper for a `Table`. Renders a native `<div>` with `overflow: auto`.
 *
 * @example
 * <TableContainer>
 *   <Table stickyHeader>...</Table>
 * </TableContainer>
 */
export type TableContainerProps = HTMLAttributes<HTMLDivElement>;

export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(function TableContainer(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('ps-TableContainer', className)} {...props} />;
});

/**
 * Groups header rows. Renders a native `<thead>`.
 */
export type TableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(function TableHead(
  { className, ...props },
  ref,
) {
  return <thead ref={ref} className={clsx('ps-Table__head', className)} {...props} />;
});

/**
 * Groups data rows. Renders a native `<tbody>`.
 */
export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody ref={ref} className={clsx('ps-Table__body', className)} {...props} />;
});

/**
 * Groups summary rows. Renders a native `<tfoot>`.
 */
export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(function TableFooter(
  { className, ...props },
  ref,
) {
  return <tfoot ref={ref} className={clsx('ps-Table__footer', className)} {...props} />;
});

/**
 * A single row. Renders a native `<tr>`.
 *
 * @example
 * <TableRow selected>
 *   <TableCell>Value</TableCell>
 * </TableRow>
 */
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  hover?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, selected, hover, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      data-selected={selected || undefined}
      data-hover={hover || undefined}
      className={clsx('ps-Table__row', className)}
      {...props}
    />
  );
});

/**
 * A single cell. Renders `<th scope="col">` when `header` is true, otherwise `<td>`.
 *
 * `display`/`overflow` style props behave as documented on `Box`; use a responsive `display` object to hide a column
 * per breakpoint, e.g. `display={{ default: 'none', md: 'table-cell' }}`.
 *
 * @example
 * <TableCell header align="right">Value</TableCell>
 */
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement>, DisplayProps {
  header?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: Size;
  sortDirection?: SortDirection | false;
  /** Pins the cell to the left or right edge of a horizontally scrolling table. */
  sticky?: 'left' | 'right';
  /** Renders a drag handle that reports the cell's new width via `onResize`. Requires `Table`'s `tableLayout="fixed"`. */
  resizable?: boolean;
  onResize?: (width: number) => void;
  /** Minimum width, in pixels, enforced while dragging the resize handle. @default 40 */
  minResizeWidth?: number;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  {
    className,
    header,
    align = 'left',
    size,
    sortDirection,
    sticky,
    resizable,
    onResize,
    minResizeWidth = 40,
    style,
    children,
    ...props
  },
  ref,
) {
  let ariaSort: 'ascending' | 'descending' | undefined;
  if (sortDirection === 'asc') {
    ariaSort = 'ascending';
  } else if (sortDirection === 'desc') {
    ariaSort = 'descending';
  }

  const resizeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return (): void => {
      resizeCleanupRef.current?.();
      resizeCleanupRef.current = null;
    };
  }, []);

  const handleResizePointerDown = useCallback<PointerEventHandler<HTMLSpanElement>>(
    (event) => {
      if (!onResize) return;
      event.preventDefault();
      const startX = event.pageX;
      const startWidth = event.currentTarget.parentElement?.offsetWidth ?? 0;
      // Listen on the cell's own document: when the table is rendered through a
      // portal into another document (e.g. an iframe), the global `document` is
      // the wrong one and drag events would never arrive.
      const ownerDocument = event.currentTarget.ownerDocument;
      const handlePointerMove = (moveEvent: PointerEvent): void => {
        onResize(Math.max(minResizeWidth, startWidth + (moveEvent.pageX - startX)));
      };
      const controller = new AbortController();
      const cleanup = (): void => {
        controller.abort();
        resizeCleanupRef.current = null;
      };
      resizeCleanupRef.current = cleanup;
      ownerDocument.addEventListener('pointermove', handlePointerMove, { signal: controller.signal });
      ownerDocument.addEventListener('pointerup', cleanup, { signal: controller.signal });
    },
    [onResize, minResizeWidth],
  );

  const { className: styleClassName, style: cellStyle, rest } = applyStyleProps(props, TABLE_CELL_STYLE_PROPS, style);

  const cellProps = {
    scope: header ? 'col' : undefined,
    'data-align': align,
    'data-size': size,
    'data-sticky': sticky,
    'data-resizable': resizable || undefined,
    'aria-sort': ariaSort,
    className: clsx('ps-Table__cell', styleClassName, className),
    style: cellStyle,
    ...rest,
  };

  const content = (
    <>
      {children}
      {resizable && (
        <span
          className="ps-Table__resizeHandle"
          onPointerDown={handleResizePointerDown}
          role="separator" /* oxlint-disable-line jsx-a11y/prefer-tag-over-role */
          aria-orientation="vertical"
          aria-label="Resize column"
          tabIndex={-1}
        />
      )}
    </>
  );

  return header ? (
    <th ref={ref} {...cellProps}>
      {content}
    </th>
  ) : (
    <td ref={ref} {...cellProps}>
      {content}
    </td>
  );
});
