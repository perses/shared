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

import { Button as BaseButton } from '@base-ui/react/button';
import clsx from 'clsx';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import type { PersesCSSProperties } from '../../types';
import type { ButtonVariant } from '../Button/Button';
import { applyStyleProps, compileStyleProps, displayProps, sizingProps, spacingProps } from '../system';
import type { DisplayProps, SizingProps, SpacingProps } from '../system';
import type { ColorVariant, Size, Status } from '../types';

import '../Button/buttonBase.css';
import './iconButton.css';
import '../system/layout.css';
import '../system/spacing.css';

const ICON_BUTTON_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps]);

export interface IconButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'color'>,
    SpacingProps,
    SizingProps,
    DisplayProps {
  style?: PersesCSSProperties;
  'aria-label': string;
  variant?: ButtonVariant;
  color?: ColorVariant | Status;
  size?: Size;
}

/**
 * Spacing, sizing and display props accept mobile-first responsive objects with an optional `default`.
 * Values persist at larger breakpoints until overridden. Below the first provided breakpoint,
 * the component's own styling is preserved.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', color = 'default', size = 'md', className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, ICON_BUTTON_STYLE_PROPS, style);
  return (
    <BaseButton
      {...rest}
      ref={ref}
      className={clsx('ps-ButtonBase', 'ps-IconButton', styleClassName, className)}
      style={computedStyle}
      data-variant={variant}
      data-color={color}
      data-size={size}
    >
      {children}
    </BaseButton>
  );
});
