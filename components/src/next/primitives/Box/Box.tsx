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
import type { CSSProperties, HTMLAttributes } from 'react';

import { responsiveClassName, responsiveStyle } from '../system/responsive';
import type { Responsive } from '../system/responsive';
import { responsiveSpacingStyle, spacingClassName } from '../system/spacing';
import type { SpacingToken } from '../system/spacing';

import './box.css';
import '../system/responsive.css';
import '../system/spacing.css';

export type { SpacingToken } from '../system/spacing';
export type { Breakpoint, Responsive, ResponsiveObject } from '../system/responsive';

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  display?: Responsive<CSSProperties['display']>;
  p?: Responsive<SpacingToken>;
  px?: Responsive<SpacingToken>;
  py?: Responsive<SpacingToken>;
  m?: Responsive<SpacingToken>;
  mx?: Responsive<SpacingToken>;
  my?: Responsive<SpacingToken>;
  gap?: Responsive<SpacingToken>;
  flexDirection?: Responsive<CSSProperties['flexDirection']>;
  alignItems?: Responsive<CSSProperties['alignItems']>;
  justifyContent?: Responsive<CSSProperties['justifyContent']>;
  flexWrap?: Responsive<CSSProperties['flexWrap']>;
  flex?: Responsive<CSSProperties['flex']>;
  width?: Responsive<CSSProperties['width']>;
  height?: Responsive<CSSProperties['height']>;
  overflow?: Responsive<CSSProperties['overflow']>;
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  {
    display,
    p,
    px,
    py,
    m,
    mx,
    my,
    gap,
    flexDirection,
    alignItems,
    justifyContent,
    flexWrap,
    flex,
    width,
    height,
    overflow,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const computedStyle: CSSProperties = {};
  if (typeof display !== 'object') computedStyle.display = display;
  if (typeof flexDirection !== 'object') computedStyle.flexDirection = flexDirection;
  if (typeof alignItems !== 'object') computedStyle.alignItems = alignItems;
  if (typeof justifyContent !== 'object') computedStyle.justifyContent = justifyContent;
  if (typeof flexWrap !== 'object') computedStyle.flexWrap = flexWrap;
  if (typeof flex !== 'object') computedStyle.flex = flex;
  if (typeof width !== 'object') computedStyle.width = width;
  if (typeof height !== 'object') computedStyle.height = height;
  if (typeof overflow !== 'object') computedStyle.overflow = overflow;

  Object.assign(
    computedStyle,
    responsiveStyle('display', display),
    responsiveStyle('flex-direction', flexDirection),
    responsiveStyle('align-items', alignItems),
    responsiveStyle('justify-content', justifyContent),
    responsiveStyle('flex-wrap', flexWrap),
    responsiveStyle('flex', flex),
    responsiveStyle('width', width),
    responsiveStyle('height', height),
    responsiveStyle('overflow', overflow),
    responsiveSpacingStyle('p', p),
    responsiveSpacingStyle('px', px),
    responsiveSpacingStyle('py', py),
    responsiveSpacingStyle('m', m),
    responsiveSpacingStyle('mx', mx),
    responsiveSpacingStyle('my', my),
    responsiveSpacingStyle('gap', gap),
    style,
  );

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(
        'ps-Box',
        spacingClassName('p', p),
        spacingClassName('px', px),
        spacingClassName('py', py),
        spacingClassName('m', m),
        spacingClassName('mx', mx),
        spacingClassName('my', my),
        spacingClassName('gap', gap),
        responsiveClassName('display', display),
        responsiveClassName('flex-direction', flexDirection),
        responsiveClassName('align-items', alignItems),
        responsiveClassName('justify-content', justifyContent),
        responsiveClassName('flex-wrap', flexWrap),
        responsiveClassName('flex', flex),
        responsiveClassName('width', width),
        responsiveClassName('height', height),
        responsiveClassName('overflow', overflow),
        className,
      )}
      style={computedStyle}
    >
      {children}
    </div>
  );
});
