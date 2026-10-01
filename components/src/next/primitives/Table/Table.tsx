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
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactElement, TdHTMLAttributes } from 'react';

import './table.css';

export type TableProps = HTMLAttributes<HTMLTableElement>;

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table({ className, ...props }, ref) {
  return <table ref={ref} className={clsx('ps-Table', className)} {...props} />;
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

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, selected, ...props },
  ref,
) {
  return <tr ref={ref} data-selected={selected || undefined} className={clsx('ps-Table__row', className)} {...props} />;
});

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  header?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, header, align = 'left', ...props },
  ref,
): ReactElement {
  const Component = header ? 'th' : 'td';
  return (
    <Component
      ref={ref as never}
      scope={header ? 'col' : undefined}
      data-align={align}
      className={clsx('ps-Table__cell', className)}
      {...props}
    />
  );
});
