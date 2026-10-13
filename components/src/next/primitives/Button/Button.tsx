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

import { useComponents } from '../../contexts/ComponentsProvider';
import { Icon } from '../Icon/Icon';
import type { DisplayProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, sizingProps, spacingProps } from '../system';
import type { ColorVariant, Size, Status } from '../types';

import '../system/layout.css';
import '../system/spacing.css';
import './button.css';
import './buttonBase.css';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';

const BUTTON_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps]);

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>, SpacingProps, SizingProps, DisplayProps {
  variant?: ButtonVariant;
  color?: ColorVariant | Status;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    color = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const {
    components: { Spinner },
  } = useComponents();
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, BUTTON_STYLE_PROPS, style);
  const classes = clsx('ps-ButtonBase', 'ps-Button', styleClassName, className);
  const isDisabled = disabled || loading;

  return (
    <BaseButton
      {...rest}
      ref={ref}
      className={classes}
      style={computedStyle}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-loading={loading || undefined}
    >
      {loading && (
        <Icon className="ps-Button__spinner">
          <Spinner />
        </Icon>
      )}
      {children}
    </BaseButton>
  );
});
