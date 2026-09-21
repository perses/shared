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

import { axisSpacing, resolveSpacing } from '../system/spacing';
import type { SpacingToken } from '../system/spacing';

import './box.css';

export type { SpacingToken } from '../system/spacing';

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  display?: CSSProperties['display'];
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  gap?: SpacingToken;
  flexDirection?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  flexWrap?: CSSProperties['flexWrap'];
  flex?: CSSProperties['flex'];
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  overflow?: CSSProperties['overflow'];
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
  if (display !== undefined) computedStyle.display = display;
  if (flexDirection !== undefined) computedStyle.flexDirection = flexDirection;
  if (alignItems !== undefined) computedStyle.alignItems = alignItems;
  if (justifyContent !== undefined) computedStyle.justifyContent = justifyContent;
  if (flexWrap !== undefined) computedStyle.flexWrap = flexWrap;
  if (flex !== undefined) computedStyle.flex = flex;
  if (width !== undefined) computedStyle.width = width;
  if (height !== undefined) computedStyle.height = height;
  if (overflow !== undefined) computedStyle.overflow = overflow;

  const padding = resolveSpacing(p);
  if (padding !== undefined) computedStyle.padding = padding;
  const margin = resolveSpacing(m);
  if (margin !== undefined) computedStyle.margin = margin;
  const gapValue = resolveSpacing(gap);
  if (gapValue !== undefined) computedStyle.gap = gapValue;

  Object.assign(computedStyle, {
    ...axisSpacing(px, ['paddingLeft', 'paddingRight']),
    ...axisSpacing(py, ['paddingTop', 'paddingBottom']),
    ...axisSpacing(mx, ['marginLeft', 'marginRight']),
    ...axisSpacing(my, ['marginTop', 'marginBottom']),
    ...style,
  });

  return (
    <div ref={ref} {...rest} className={clsx('ps-Box', className)} style={computedStyle}>
      {children}
    </div>
  );
});
