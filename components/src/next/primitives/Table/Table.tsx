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
import { forwardRef, useEffect, useRef } from 'react';
import type { CSSProperties, HTMLAttributes, PointerEvent as ReactPointerEvent, TdHTMLAttributes } from 'react';

import { responsiveClassName, responsiveStyle } from '../system/responsive';
import type { Responsive } from '../system/responsive';
import type { Size } from '../types';

import './table.css';
import '../system/responsive.css';

export type { Breakpoint, Responsive, ResponsiveObject } from '../system/responsive';

/**
 * Root table element. Renders a native `<table>`.
 *
 * @example
 * <Table>
 *   <TableHead>...</TableHead>
 *   <TableBody>...</TableBody>
 * </Table>
 */
export type SortDirection = 'asc' | 'desc';

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
 * @example
 * <TableCell header align="right">Value</TableCell>
 */
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  header?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: Size;
  sortDirection?: SortDirection | false;
  /** Shows or hides the cell per breakpoint, e.g. to hide a column on small screens. */
  display?: Responsive<CSSProperties['display']>;
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
    display,
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
  const Component = header ? 'th' : 'td';
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

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLSpanElement>): void => {
    if (!onResize) return;
    const startX = event.pageX;
    const startWidth = event.currentTarget.parentElement?.offsetWidth ?? 0;
    const handlePointerMove = (moveEvent: PointerEvent): void => {
      onResize(Math.max(minResizeWidth, startWidth + (moveEvent.pageX - startX)));
    };
    const cleanup = (): void => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      resizeCleanupRef.current = null;
    };
    const handlePointerUp = (): void => {
      cleanup();
    };
    resizeCleanupRef.current = cleanup;
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <Component
      ref={ref as never}
      scope={header ? 'col' : undefined}
      data-align={align}
      data-size={size}
      data-sticky={sticky}
      data-resizable={resizable || undefined}
      aria-sort={ariaSort}
      className={clsx('ps-Table__cell', responsiveClassName('display', display), className)}
      style={{
        ...(typeof display !== 'object' ? { display } : undefined),
        ...responsiveStyle('display', display),
        ...style,
      }}
      {...props}
    >
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
    </Component>
  );
});
