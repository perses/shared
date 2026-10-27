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
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';

import { ArrowDownIcon, Icon } from '../Icon';
import type { SortDirection } from './Table';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared button styles.
import '../Button/buttonBase.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the table styles.
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
 * // Override the sort-direction icon. The icon must point down: it is shown as-is for
 * // `desc` and rotated 180° for `asc`, exactly like the default arrow.
 * <TableSortLabel active direction={direction} icon={<ChevronDownIcon />} onClick={toggleSort}>
 *   Name
 * </TableSortLabel>
 */
interface TableSortLabelBaseProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> {
  active?: boolean;
  direction?: SortDirection;
  /**
   * Sort-direction indicator. Must point down; it is rendered as-is for `desc` and rotated 180° for `asc`.
   * @default <ArrowDownIcon />
   */
  icon?: ReactElement;
}

type TableSortLabelAccessibleName =
  | { children: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { children?: never; 'aria-label': string; 'aria-labelledby'?: string }
  | { children?: never; 'aria-label'?: never; 'aria-labelledby': string };

export type TableSortLabelProps = TableSortLabelBaseProps & TableSortLabelAccessibleName;

const defaultSortIcon = <ArrowDownIcon />;

export const TableSortLabel = forwardRef<HTMLButtonElement, TableSortLabelProps>(function TableSortLabel(
  { active, direction = 'asc', icon = defaultSortIcon, className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-active={active ? '' : undefined}
      data-direction={direction}
      className={clsx('ps-ButtonBase', 'ps-TableSortLabel', className)}
      {...props}
    >
      {children}
      <Icon className="ps-TableSortLabel__icon">{icon}</Icon>
    </button>
  );
});
