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
import { forwardRef, useCallback } from 'react';
import type { ChangeEvent, HTMLAttributes, ReactElement, ReactNode } from 'react';

import { useComponents } from '../../contexts/ComponentsProvider';
import { ChevronLeftIcon, ChevronRightIcon, Icon } from '../Icon';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the table styles.
import './table.css';

/**
 * Fully controlled pagination footer for use below a `Table`.
 *
 * @example
 * <TablePagination
 *   count={rows.length}
 *   page={page}
 *   rowsPerPage={rowsPerPage}
 *   onPageChange={setPage}
 *   onRowsPerPageChange={setRowsPerPage}
 * />
 *
 * @example
 * // Override the page-navigation icons
 * <TablePagination previousIcon={<MyPrevIcon />} nextIcon={<MyNextIcon />} ... />
 */
export interface TablePaginationProps extends HTMLAttributes<HTMLDivElement> {
  /** Total number of rows across all pages. */
  count: number;
  /** Current zero-based page index. */
  page: number;
  /** Number of rows displayed per page. */
  rowsPerPage: number;
  /** Options shown in the rows-per-page select. Defaults to [10, 25, 50]. */
  rowsPerPageOptions?: number[];
  /** Called with the new zero-based page index when a navigation button is clicked. */
  onPageChange: (page: number) => void;
  /** Called with the new page size when a rows-per-page option is selected. The select is only rendered when this is provided. */
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  /** Label for the rows-per-page select. Defaults to 'Rows per page'. */
  labelRowsPerPage?: ReactNode;
  /** Icon for the previous-page button. Defaults to a left chevron. */
  previousIcon?: ReactElement;
  /** Icon for the next-page button. Defaults to a right chevron. */
  nextIcon?: ReactElement;
}

const defaultRowsPerPageOptions = [10, 25, 50];
const defaultPreviousIcon = <ChevronLeftIcon />;
const defaultNextIcon = <ChevronRightIcon />;
const defaultLabelRowsPerPage = 'Rows per page';

export const TablePagination = forwardRef<HTMLDivElement, TablePaginationProps>(function TablePagination(
  {
    count,
    page,
    rowsPerPage,
    rowsPerPageOptions = defaultRowsPerPageOptions,
    onPageChange,
    onRowsPerPageChange,
    labelRowsPerPage = defaultLabelRowsPerPage,
    previousIcon = defaultPreviousIcon,
    nextIcon = defaultNextIcon,
    className,
    ...props
  },
  ref,
) {
  const {
    components: { IconButton },
  } = useComponents();
  const start = count === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min(count, (page + 1) * rowsPerPage);
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);

  const handleRowsPerPageChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onRowsPerPageChange?.(Number(event.target.value)),
    [onRowsPerPageChange],
  );
  const handlePreviousPage = useCallback(() => onPageChange(page - 1), [onPageChange, page]);
  const handleNextPage = useCallback(() => onPageChange(page + 1), [onPageChange, page]);

  return (
    <div ref={ref} className={clsx('ps-TablePagination', className)} {...props}>
      {onRowsPerPageChange && (
        <label className="ps-TablePagination__rowsPerPage">
          {labelRowsPerPage}
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
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
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Previous page"
        disabled={page === 0}
        onClick={handlePreviousPage}
      >
        <Icon>{previousIcon}</Icon>
      </IconButton>
      <IconButton variant="ghost" size="sm" aria-label="Next page" disabled={page >= lastPage} onClick={handleNextPage}>
        <Icon>{nextIcon}</Icon>
      </IconButton>
    </div>
  );
});
