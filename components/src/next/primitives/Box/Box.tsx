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
import { sizingProps } from '../system/sizing';
import type { SizingProps } from '../system/sizing';
import { spacingProps } from '../system/spacing';
import type { SpacingProps } from '../system/spacing';
import { applyStyleProps, compileStyleProps } from '../system/styleProps';

import './box.css';
import '../system/layout.css';
import '../system/spacing.css';

export type { SpacingToken } from '../system/spacing';
export type { Breakpoint, Responsive, ResponsiveObject } from '../system/responsive';

export interface BoxProps
  extends HTMLAttributes<HTMLDivElement>, SpacingProps, SizingProps, FlexboxProps, DisplayProps {}

const BOX_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, flexboxProps, displayProps]);

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box({ className, style, children, ...rest }, ref) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(rest, BOX_STYLE_PROPS, style);

  return (
    <div
      ref={ref}
      {...(domProps as HTMLAttributes<HTMLDivElement>)}
      className={clsx('ps-Box', styleClassName, className)}
      style={computedStyle}
    >
      {children}
    </div>
  );
});
