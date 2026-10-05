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
import type { HTMLAttributes } from 'react';

import { useComponents } from '../../contexts/ComponentsProvider';
import { Icon } from '../Icon/Icon';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icon/icons';

import './table.css';

/**
 * Fully controlled pagination footer for use below a `Table`/`TableContainer`.
 *
 * @example
 * <TablePagination
 *   count={rows.length}
 *   page={page}
 *   rowsPerPage={rowsPerPage}
 *   onPageChange={setPage}
 *   onRowsPerPageChange={setRowsPerPage}
 * />
 */
export interface TablePaginationProps extends HTMLAttributes<HTMLDivElement> {
  count: number;
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
}

export const TablePagination = forwardRef<HTMLDivElement, TablePaginationProps>(function TablePagination(
  {
    count,
    page,
    rowsPerPage,
    rowsPerPageOptions = [10, 25, 50],
    onPageChange,
    onRowsPerPageChange,
    className,
    ...props
  },
  ref,
) {
  const {
    components: { Button },
  } = useComponents();
  const start = count === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min(count, (page + 1) * rowsPerPage);
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);

  return (
    <div ref={ref} className={clsx('ps-TablePagination', className)} {...props}>
      {onRowsPerPageChange && (
        <label className="ps-TablePagination__rowsPerPage">
          Rows per page
          <select value={rowsPerPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))}>
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}
      <span className="ps-TablePagination__range">
        {start}-{end} of {count}
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <Icon>
          <ChevronLeftIcon />
        </Icon>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Next page"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      >
        <Icon>
          <ChevronRightIcon />
        </Icon>
      </Button>
    </div>
  );
});
