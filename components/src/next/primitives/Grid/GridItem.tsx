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
import type { HTMLAttributes } from 'react';

import { applyStyleProps, compileStyleProps, displayProps, gridProps, sizingProps, spacingProps } from '../system';
import type { DisplayProps, Responsive, SizingProps, SpacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- Registers shared layout utility styles used by style props.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers shared spacing utility styles used by style props.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers this component's styles.
import './grid.css';

export interface GridItemProps
  extends HTMLAttributes<HTMLDivElement>, SpacingProps, SizingProps, Pick<DisplayProps, 'overflow'> {
  /**
   * Number of columns to span, from `1` to the parent `Grid`'s `columns` (a larger span creates implicit
   * columns). Omitted (or omitted at the base of a responsive object) the item takes one column.
   */
  size?: Responsive<number>;
}

const GRID_ITEM_STYLE_PROPS = compileStyleProps([
  gridProps,
  spacingProps,
  sizingProps,
  { overflow: displayProps.overflow },
]);

/**
 * A cell of a `Grid`. `size` sets how many columns it spans, per breakpoint if needed.
 *
 * @example
 * <GridItem size={{ default: 12, md: 6 }}>Full width; half width at `md` and wider (≥ 900 px)</GridItem>
 */
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(function GridItem(
  { size, className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps({ ...rest, gridColumn: size }, GRID_ITEM_STYLE_PROPS, style);

  return (
    <div ref={ref} {...domProps} className={clsx('ps-GridItem', styleClassName, className)} style={computedStyle}>
      {children}
    </div>
  );
});
