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

import type { PersesCSSProperties } from '../../types';
import {
  applyStyleProps,
  compileStyleProps,
  displayProps,
  flexboxProps,
  radiusProps,
  sizingProps,
  spacingProps,
} from '../system';
import type { DisplayProps, FlexboxProps, RadiusProps, SizingProps, SpacingProps } from '../system';

import './box.css';
import '../system/layout.css';
import '../system/radius.css';
import '../system/spacing.css';

export type {
  Breakpoint,
  CornerRadiusValue,
  RadiusProps,
  RadiusValue,
  Responsive,
  ResponsiveObject,
  SpacingValue,
} from '../system';

export interface BoxProps
  extends HTMLAttributes<HTMLDivElement>, SpacingProps, SizingProps, FlexboxProps, DisplayProps, RadiusProps {
  style?: PersesCSSProperties;
}

const BOX_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, flexboxProps, displayProps, radiusProps]);

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box({ className, style, children, ...rest }, ref) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(rest, BOX_STYLE_PROPS, style);

  return (
    <div ref={ref} {...domProps} className={clsx('ps-Box', styleClassName, className)} style={computedStyle}>
      {children}
    </div>
  );
});
