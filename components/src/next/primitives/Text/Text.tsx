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

import type { FontSizeScale } from '@perses-dev/design-tokens';
import { clsx } from 'clsx';
import { createElement, forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';

import { applyStyleProps, compileStyleProps, displayProps, sizingProps, spacingProps } from '../system';
import type { DisplayProps, SizingProps, SpacingProps } from '../system';
import type { Status } from '../types';

import '../system/layout.css';
import '../system/spacing.css';
import './text.css';

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'>, SpacingProps, SizingProps, DisplayProps {
  /** Semantic element to render. Typography is independent of the chosen element. Defaults to `span`. */
  as?: 'span' | 'p' | 'div' | 'strong' | 'em' | 'small';
  /** Font-size token. Defaults to `md`. */
  size?: FontSizeScale;
  /** Font-weight token; inherits the element's weight when omitted. */
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  /** Semantic text/status color or any CSS color value. Defaults to `primary`; `style.color` takes precedence. */
  color?: 'primary' | 'secondary' | 'disabled' | Status | CSSProperties['color'];
}

const TEXT_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps]);
const SEMANTIC_TEXT_COLORS = new Set([
  'inherit',
  'primary',
  'secondary',
  'disabled',
  'error',
  'warning',
  'success',
  'info',
]);

/** Token-based text with no default margins or control-specific width containment. */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'span', size = 'md', weight, color = 'primary', className, style, children, ...props },
  ref,
) {
  // Keep named colors stylesheet-driven so existing theme and CSS overrides continue to work.
  const colorStyle = SEMANTIC_TEXT_COLORS.has(color) ? style : { color, ...style };
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, TEXT_STYLE_PROPS, colorStyle);

  return createElement(
    as,
    {
      ...rest,
      ref,
      className: clsx('ps-Text', styleClassName, className),
      style: computedStyle,
      'data-size': size,
      'data-weight': weight,
      'data-color': color,
    },
    children,
  );
});
