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

import {
  applyStyleProps,
  compileStyleProps,
  displayProps,
  flexboxProps,
  isResponsiveValue,
  sizingProps,
  spacingProps,
} from '../system';
import type { DisplayProps, FlexboxProps, Responsive, SizingProps, SpacingProps, SpacingToken } from '../system';

import './stack.css';
import '../system/layout.css';
import '../system/spacing.css';

export interface StackProps
  extends
    HTMLAttributes<HTMLDivElement>,
    Omit<SpacingProps, 'gap'>,
    SizingProps,
    Omit<FlexboxProps, 'flexDirection'>,
    Pick<DisplayProps, 'overflow'> {
  /** Main axis of the stack. Defaults to `column`. */
  direction?: Responsive<'row' | 'column'>;
  /** Space between children, as a spacing token. */
  spacing?: Responsive<SpacingToken>;
}

// Only `overflow` from the display category: `display` stays fixed to flex by the stylesheet, so
// compiling it would strip a `display` value from the DOM and let `.ps-display` override the default.
const STACK_STYLE_PROPS = compileStyleProps([
  spacingProps,
  sizingProps,
  flexboxProps,
  { overflow: displayProps.overflow },
]);

// A responsive `direction` without a `default` breakpoint leaves the base unset, so the engine's
// `revert` fallback resolves to the UA `row` instead of the documented `column`. Seed `column`.
function withDirectionDefault(
  direction: Responsive<'row' | 'column'> | undefined,
): Responsive<'row' | 'column'> | undefined {
  if (isResponsiveValue(direction) && direction.default === undefined) {
    return { ...direction, default: 'column' };
  }
  return direction;
}

/**
 * Lays out its children in a flex row or column. It is a purely presentational `div`: it keeps DOM order,
 * so keyboard and screen-reader order follow the source. Pass `role` and `aria-*` attributes when the group
 * needs semantics.
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction, spacing, className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(
    { ...rest, flexDirection: withDirectionDefault(direction), gap: spacing },
    STACK_STYLE_PROPS,
    style,
  );

  return (
    <div ref={ref} {...domProps} className={clsx('ps-Stack', styleClassName, className)} style={computedStyle}>
      {children}
    </div>
  );
});
