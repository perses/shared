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
import type { InputHTMLAttributes } from 'react';

import './table.css';

/**
 * A checkbox for row selection, including a "select all" indeterminate state.
 * Place inside a `TableCell` rather than using it as a `TableCell` prop.
 *
 * @example
 * <TableCell header>
 *   <TableCheckbox
 *     checked={allSelected}
 *     indeterminate={someSelected && !allSelected}
 *     onChange={toggleSelectAll}
 *   />
 * </TableCell>
 */
export interface TableCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean;
}

export const TableCheckbox = forwardRef<HTMLInputElement, TableCheckboxProps>(function TableCheckbox(
  { indeterminate, className, ...props },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return (
    <input
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      type="checkbox"
      className={clsx('ps-TableCheckbox', className)}
      {...props}
    />
  );
});
