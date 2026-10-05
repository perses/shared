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
import type { ButtonHTMLAttributes, ReactElement } from 'react';

import { Icon } from '../Icon/Icon';
import { SortArrowIcon } from '../Icon/icons';
import type { SortDirection } from './Table';

import './table.css';

/**
 * A clickable column-header label that shows a sort-direction indicator.
 * Typically placed inside a `<TableCell header sortDirection={...}>`.
 *
 * @example
 * <TableCell header sortDirection={direction}>
 *   <TableSortLabel active direction={direction} onClick={toggleSort}>
 *     Name
 *   </TableSortLabel>
 * </TableCell>
 *
 * @example
 * // Override the sort-direction icon
 * <TableSortLabel active direction={direction} icon={<CustomSortIcon />} onClick={toggleSort}>
 *   Name
 * </TableSortLabel>
 */
export interface TableSortLabelProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  direction?: SortDirection;
  icon?: ReactElement;
}

export const TableSortLabel = forwardRef<HTMLButtonElement, TableSortLabelProps>(function TableSortLabel(
  { active, direction = 'asc', icon = <SortArrowIcon />, className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-active={active || undefined}
      data-direction={direction}
      className={clsx('ps-TableSortLabel', className)}
      {...props}
    >
      {children}
      <Icon className="ps-TableSortLabel__icon">{icon}</Icon>
    </button>
  );
});
