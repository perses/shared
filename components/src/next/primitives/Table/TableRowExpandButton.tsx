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
import { ChevronRightIcon } from '../Icon/icons';

import './table.css';

/**
 * A clickable button that toggles a row's expanded state, showing a rotating chevron.
 * Place inside a `TableCell`.
 *
 * @example
 * <TableCell>
 *   <TableRowExpandButton expanded={isExpanded} onClick={toggleExpanded} aria-label="Expand row" />
 * </TableCell>
 *
 * @example
 * // Override the expand icon
 * <TableRowExpandButton expanded={isExpanded} icon={<CustomChevronIcon />} onClick={toggleExpanded} />
 */
export interface TableRowExpandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  expanded?: boolean;
  icon?: ReactElement;
}

export const TableRowExpandButton = forwardRef<HTMLButtonElement, TableRowExpandButtonProps>(
  function TableRowExpandButton(
    { expanded, icon = <ChevronRightIcon />, className, type = 'button', children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        data-expanded={expanded || undefined}
        className={clsx('ps-TableRowExpandButton', className)}
        {...props}
      >
        <Icon className="ps-TableRowExpandButton__icon">{icon}</Icon>
        {children}
      </button>
    );
  },
);
