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
import type { CSSProperties, HTMLAttributes } from 'react';

import { applyStyleProps, compileStyleProps, displayProps, sizingProps, spacingProps } from '../system';
import type { DisplayProps, Responsive, SizingProps, SpacingProps, SpacingToken } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- Registers shared layout utility styles used by style props.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers shared spacing utility styles used by style props.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers this component's styles.
import './grid.css';

/** Inline style for `Grid`, including the custom property that sets the column count. */
export interface GridStyle extends CSSProperties {
  '--ps-grid-columns'?: number;
}

export interface GridProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'style'>,
    Omit<SpacingProps, 'gap'>,
    SizingProps,
    Pick<DisplayProps, 'overflow'> {
  /** Number of equal-width columns. Defaults to `12`. */
  columns?: number;
  /** Space between rows and columns, as a spacing token. */
  spacing?: Responsive<SpacingToken>;
  style?: GridStyle;
}

const GRID_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, { overflow: displayProps.overflow }]);

/**
 * A column grid container. Children are placed in DOM order; use `GridItem` with `size` to span columns.
 * Spacing is a CSS `gap`, so items never need padding workarounds.
 *
 * @example
 * <Grid spacing="lg">
 *   <GridItem size={12}>Title</GridItem>
 *   <GridItem size={4}>Label</GridItem>
 *   <GridItem size={8}>Field</GridItem>
 * </Grid>
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns, spacing, className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps({ ...rest, gap: spacing }, GRID_STYLE_PROPS, { '--ps-grid-columns': columns, ...style });

  return (
    <div ref={ref} {...domProps} className={clsx('ps-Grid', styleClassName, className)} style={computedStyle}>
      {children}
    </div>
  );
});
