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

import { clsx } from 'clsx';
import { forwardRef } from 'react';

import { Text } from '../Text';
import type { TextProps } from '../Text';
import type { Status } from '../types';

// oxlint-disable-next-line import/no-unassigned-import -- The helper stylesheet is a required bundler side effect.
import './textHelper.css';

export interface TextHelperProps extends Omit<TextProps, 'as' | 'size' | 'weight' | 'color'> {
  /** Visual status; does not announce messages or mark the associated control invalid. */
  status?: Status;
  /** Uses the disabled text color instead of the status color; does not disable the associated control. */
  disabled?: boolean;
}

/**
 * Small supporting text that wraps within its container without determining the container's intrinsic width.
 * The parent must establish an available width. Associate standalone helpers with a control using `id` and
 * `aria-describedby`; compose with Base UI's `Field.Description` for automatic field association.
 */
export const TextHelper = forwardRef<HTMLParagraphElement, TextHelperProps>(function TextHelper(
  { status, disabled, className, ...props },
  ref,
) {
  return (
    <Text
      {...props}
      {...(disabled && { 'data-disabled': true })}
      ref={ref}
      as="p"
      size="xs"
      color={disabled ? 'disabled' : (status ?? 'secondary')}
      data-status={status}
      className={clsx('ps-TextHelper', className)}
    />
  );
});
