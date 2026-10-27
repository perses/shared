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

import { clsx } from 'clsx';
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type {
  FocusEventHandler,
  HTMLAttributes,
  KeyboardEventHandler,
  PointerEventHandler,
  TdHTMLAttributes,
} from 'react';

import type { DisplayProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps } from '../system';
import type { Size } from '../types';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the table styles.
import './table.css';

const TABLE_CELL_STYLE_PROPS = compileStyleProps([displayProps]);
const KEYBOARD_RESIZE_STEP = 10;

function getStyleWidth(width: string | number | undefined): number | undefined {
  if (typeof width === 'number') return width;
  if (typeof width !== 'string' || !width.endsWith('px')) return undefined;
  const parsedWidth = Number.parseFloat(width);
  return Number.isNaN(parsedWidth) ? undefined : parsedWidth;
}

function getRenderedWidth(handle: HTMLSpanElement, fallback: number): number {
  const cell = handle.parentElement;
  if (!cell) return fallback;
  return cell.offsetWidth || getStyleWidth(cell.style.width) || fallback;
}

function clampResizeWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.min(maxWidth, Math.max(minWidth, width));
}

function updateResizeAriaValue(handle: HTMLSpanElement, width: number): void {
  handle.setAttribute('aria-valuenow', String(width));
  handle.setAttribute('aria-valuetext', `${width} pixels`);
}

export type SortDirection = 'asc' | 'desc';

const ARIA_SORT: Record<SortDirection, 'ascending' | 'descending'> = { asc: 'ascending', desc: 'descending' };

/**
 * Scrollable wrapper for a `Table`.
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
 * Root table element.
 *
 * @example
 * <Table>
 *   <TableHead>...</TableHead>
 *   <TableBody>...</TableBody>
 *   <TableFooter>...</TableFooter>
 * </Table>
 */
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  size?: Size;
  stickyHeader?: boolean;
  /**
   * Shade every second row in each TableBody. Hover and selection styles take precedence.
   * @default false
   */
  striped?: boolean;
  /** @default 'auto' */
  tableLayout?: 'auto' | 'fixed';
}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, size = 'md', stickyHeader, striped, tableLayout = 'auto', ...props },
  ref,
) {
  return (
    <table
      ref={ref}
      data-size={size}
      data-sticky-header={stickyHeader ? '' : undefined}
      data-striped={striped ? '' : undefined}
      data-table-layout={tableLayout}
      className={clsx('ps-Table', className)}
      {...props}
    />
  );
});

export type TableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(function TableHead(
  { className, ...props },
  ref,
) {
  return <thead ref={ref} className={clsx('ps-Table__head', className)} {...props} />;
});

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody ref={ref} className={clsx('ps-Table__body', className)} {...props} />;
});

export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(function TableFooter(
  { className, ...props },
  ref,
) {
  return <tfoot ref={ref} className={clsx('ps-Table__footer', className)} {...props} />;
});

/**
 * A single row.
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
      data-selected={selected ? '' : undefined}
      data-hover={hover ? '' : undefined}
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
interface TableCellBaseProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'onResize'>, DisplayProps {
  header?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: Size;
  sortDirection?: SortDirection | false;
  sticky?: 'left' | 'right';
  /**
   * Prefer a compact column sized to its nonwrapping content plus normal cell padding.
   * Apply to the column's header and body cells. Only applies with automatic table layout;
   * use an explicit `style.width` for fixed-layout or resizable columns.
   * @default false
   */
  fitContent?: boolean;
}

type ResizeHandleAccessibleName =
  | { resizeHandleAriaLabel: string; resizeHandleAriaLabelledBy?: never }
  | { resizeHandleAriaLabel?: never; resizeHandleAriaLabelledBy: string };

type TableCellResizeProps =
  | ({
      resizable: true;
      onResize: (width: number) => void;
      minResizeWidth?: number;
      maxResizeWidth: number;
    } & ResizeHandleAccessibleName)
  | {
      resizable?: false;
      onResize?: never;
      minResizeWidth?: never;
      maxResizeWidth?: never;
      resizeHandleAriaLabel?: never;
      resizeHandleAriaLabelledBy?: never;
    };

export type TableCellProps = TableCellBaseProps & TableCellResizeProps;

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  {
    className,
    header,
    align = 'left',
    size,
    sortDirection,
    sticky,
    fitContent,
    resizable,
    onResize,
    minResizeWidth = 40,
    maxResizeWidth,
    resizeHandleAriaLabel,
    resizeHandleAriaLabelledBy,
    style,
    children,
    ...props
  },
  ref,
) {
  const ariaSort = sortDirection ? ARIA_SORT[sortDirection] : undefined;

  const resizeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!resizable) return;
    return (): void => {
      resizeCleanupRef.current?.();
      resizeCleanupRef.current = null;
    };
  }, [resizable]);

  const resolvedMaxResizeWidth = resizable ? Math.max(minResizeWidth, maxResizeWidth) : 0;
  const initialResizeWidth = resizable
    ? clampResizeWidth(getStyleWidth(style?.width) ?? minResizeWidth, minResizeWidth, resolvedMaxResizeWidth)
    : 0;

  const handleResizeFocus = useCallback<FocusEventHandler<HTMLSpanElement>>(
    (event) => {
      const renderedWidth = getRenderedWidth(event.currentTarget, initialResizeWidth);
      updateResizeAriaValue(
        event.currentTarget,
        clampResizeWidth(renderedWidth, minResizeWidth, resolvedMaxResizeWidth),
      );
    },
    [initialResizeWidth, minResizeWidth, resolvedMaxResizeWidth],
  );

  const handleResizeKeyDown = useCallback<KeyboardEventHandler<HTMLSpanElement>>(
    (event) => {
      if (!onResize || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      const currentWidth = Number(event.currentTarget.getAttribute('aria-valuenow'));
      const renderedWidth = getRenderedWidth(event.currentTarget, initialResizeWidth);
      const width = Number.isNaN(currentWidth) ? renderedWidth : currentWidth;
      const step = event.shiftKey ? 1 : KEYBOARD_RESIZE_STEP;
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const nextWidth = clampResizeWidth(width + direction * step, minResizeWidth, resolvedMaxResizeWidth);
      updateResizeAriaValue(event.currentTarget, nextWidth);
      onResize(nextWidth);
    },
    [initialResizeWidth, minResizeWidth, onResize, resolvedMaxResizeWidth],
  );

  const handleResizePointerDown = useCallback<PointerEventHandler<HTMLSpanElement>>(
    (event) => {
      if (!onResize) return;
      event.preventDefault();
      resizeCleanupRef.current?.();
      const startX = event.pageX;
      const handle = event.currentTarget;
      const startWidth = clampResizeWidth(getRenderedWidth(handle, 0), minResizeWidth, resolvedMaxResizeWidth);
      const pointerId = event.pointerId;
      updateResizeAriaValue(handle, startWidth);
      const ownerDocument = handle.ownerDocument;
      const handlePointerMove = (moveEvent: PointerEvent): void => {
        if (moveEvent.pointerId !== pointerId) return;
        const nextWidth = clampResizeWidth(
          startWidth + (moveEvent.pageX - startX),
          minResizeWidth,
          resolvedMaxResizeWidth,
        );
        updateResizeAriaValue(handle, nextWidth);
        onResize(nextWidth);
      };
      const controller = new AbortController();
      const cleanup = (): void => {
        controller.abort();
        resizeCleanupRef.current = null;
      };
      const handlePointerEnd = (endEvent: PointerEvent): void => {
        if (endEvent.pointerId === pointerId) cleanup();
      };
      resizeCleanupRef.current = cleanup;
      ownerDocument.addEventListener('pointermove', handlePointerMove, { signal: controller.signal });
      ownerDocument.addEventListener('pointerup', handlePointerEnd, { signal: controller.signal });
      ownerDocument.addEventListener('pointercancel', handlePointerEnd, { signal: controller.signal });
    },
    [minResizeWidth, onResize, resolvedMaxResizeWidth],
  );

  const { className: styleClassName, style: cellStyle, rest } = applyStyleProps(props, TABLE_CELL_STYLE_PROPS, style);

  const cellProps = {
    scope: header ? 'col' : undefined,
    'data-align': align,
    'data-size': size,
    'data-sticky': sticky,
    'data-fit-content': fitContent ? '' : undefined,
    'data-resizable': resizable ? '' : undefined,
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
          onFocus={handleResizeFocus}
          onKeyDown={handleResizeKeyDown}
          onPointerDown={handleResizePointerDown}
          /* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an <hr> cannot be a focusable, draggable handle inside a <th> */
          role="separator"
          aria-orientation="vertical"
          aria-label={resizeHandleAriaLabel}
          aria-labelledby={resizeHandleAriaLabelledBy}
          aria-valuemin={minResizeWidth}
          aria-valuemax={resolvedMaxResizeWidth}
          aria-valuenow={initialResizeWidth}
          aria-valuetext={`${initialResizeWidth} pixels`}
          tabIndex={0}
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
