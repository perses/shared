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

import { tokens } from '@perses-dev/design-tokens';
import type { SpacingScale } from '@perses-dev/design-tokens';
import clsx from 'clsx';
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';

import './box.css';

export type SpacingToken = Exclude<SpacingScale, '0'> | 0;

function resolveSpacing(token?: SpacingToken): string | undefined {
  if (token === undefined) return undefined;
  if (token === 0) return '0';
  return tokens.spacing[token];
}

function axisSpacing(
  token: SpacingToken | undefined,
  [start, end]: readonly [keyof CSSProperties, keyof CSSProperties],
): CSSProperties {
  if (token === undefined) return {};
  return { [start]: resolveSpacing(token), [end]: resolveSpacing(token) };
}

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
  const computedStyle: CSSProperties = {
    display,
    flexDirection,
    alignItems,
    justifyContent,
    flexWrap,
    flex,
    width,
    height,
    overflow,
    padding: resolveSpacing(p),
    margin: resolveSpacing(m),
    gap: resolveSpacing(gap),
    ...axisSpacing(px, ['paddingLeft', 'paddingRight']),
    ...axisSpacing(py, ['paddingTop', 'paddingBottom']),
    ...axisSpacing(mx, ['marginLeft', 'marginRight']),
    ...axisSpacing(my, ['marginTop', 'marginBottom']),
    ...style,
  };

  return (
    <div ref={ref} {...rest} className={clsx('ps-Box', className)} style={computedStyle}>
      {children}
    </div>
  );
});
