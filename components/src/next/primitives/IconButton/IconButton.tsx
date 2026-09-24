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

import type { ButtonColor, ButtonSize, ButtonVariant } from '../Button/Button';

import './iconbutton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'color'> {
  'aria-label': string;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', color = 'primary', size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <BaseButton
      {...rest}
      ref={ref}
      className={clsx('ps-ButtonBase', 'ps-IconButton', className)}
      data-variant={variant}
      data-color={color}
      data-size={size}
    >
      {children}
    </BaseButton>
  );
});
