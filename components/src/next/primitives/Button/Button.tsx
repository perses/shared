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
import { isResponsiveValue, responsiveVariantClassNames } from '../system/responsive';
import type { Responsive } from '../system/responsive';

import './button.css';

export type { Breakpoint, Responsive, ResponsiveObject } from '../system/responsive';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonColor = 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  /**
   * Button size. Accepts a single value or a per-breakpoint object, e.g.
   * `{ default: 'md', lg: 'sm' }` to keep a thumb-friendly target on small
   * screens while using a denser button where a pointer is available.
   */
  size?: Responsive<ButtonSize>;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', color = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref,
) {
  const {
    components: { Spinner },
  } = useComponents();
  const isResponsiveSize = isResponsiveValue(size);
  const classes = clsx(
    'ps-Button',
    isResponsiveSize && responsiveVariantClassNames('ps-Button--size', { default: 'md', ...size }),
    className,
  );
  const isDisabled = disabled || loading;

  return (
    <BaseButton
      {...rest}
      ref={ref}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-color={color}
      data-size={isResponsiveSize ? undefined : size}
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
