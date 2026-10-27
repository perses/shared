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

import { ChevronRightIcon, Icon } from '../Icon';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared button styles.
import '../Button/buttonBase.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the table styles.
import './table.css';

interface TableRowExpandButtonBaseProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> {
  expanded?: boolean;
  icon?: ReactElement;
}

/**
 * A clickable button that toggles a row's expanded state, showing a rotating chevron.
 * Place inside a `TableCell`. The button must have an accessible name: either visible `children`
 * or an `aria-label`.
 *
 * @example
 * <TableCell>
 *   <TableRowExpandButton expanded={isExpanded} onClick={toggleExpanded} aria-label="Expand row" />
 * </TableCell>
 *
 * @example
 * // Override the expand icon
 * <TableRowExpandButton expanded={isExpanded} icon={<CustomChevronIcon />} onClick={toggleExpanded} aria-label="Expand row" />
 */
export type TableRowExpandButtonProps = TableRowExpandButtonBaseProps &
  ({ children: ReactNode; 'aria-label'?: string } | { children?: never; 'aria-label': string });

const defaultExpandIcon = <ChevronRightIcon />;

export const TableRowExpandButton = forwardRef<HTMLButtonElement, TableRowExpandButtonProps>(
  function TableRowExpandButton(
    { expanded, icon = defaultExpandIcon, className, type = 'button', children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-expanded={expanded ?? false}
        data-expanded={expanded ? '' : undefined}
        className={clsx('ps-ButtonBase', 'ps-TableRowExpandButton', className)}
        {...props}
      >
        <Icon className="ps-TableRowExpandButton__icon">{icon}</Icon>
        {children}
      </button>
    );
  },
);
