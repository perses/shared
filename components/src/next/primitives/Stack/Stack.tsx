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

import { displayProps } from '../system/display';
import type { DisplayProps } from '../system/display';
import { flexboxProps } from '../system/flexbox';
import type { FlexboxProps } from '../system/flexbox';
import type { Responsive } from '../system/responsive';
import { sizingProps } from '../system/sizing';
import type { SizingProps } from '../system/sizing';
import { spacingProps } from '../system/spacing';
import type { SpacingProps, SpacingToken } from '../system/spacing';
import { applyStyleProps, compileStyleProps } from '../system/styleProps';

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
  direction?: Responsive<'row' | 'column'>;
  spacing?: Responsive<SpacingToken>;
}

const STACK_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, flexboxProps, displayProps]);

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = 'column', spacing, className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps({ ...rest, display: 'flex', flexDirection: direction, gap: spacing }, STACK_STYLE_PROPS, style);

  return (
    <div
      ref={ref}
      {...(domProps as HTMLAttributes<HTMLDivElement>)}
      className={clsx('ps-Stack', styleClassName, className)}
      style={computedStyle}
    >
      {children}
    </div>
  );
});
