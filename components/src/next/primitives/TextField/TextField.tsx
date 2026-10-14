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

import { Field } from '@base-ui/react/field';
import clsx from 'clsx';
import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import type { DisplayProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, sizingProps, spacingProps } from '../system';
import type { Size, Status } from '../types';

import '../system/layout.css';
import '../system/spacing.css';
import './textField.css';

const TEXTAREA = <textarea />;
const TEXT_FIELD_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps]);

export interface TextFieldProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'width' | 'height'>,
    SpacingProps,
    SizingProps,
    DisplayProps {
  /** Visible label. Without it, provide `aria-label` or `aria-labelledby` so the field has an accessible name. */
  label?: ReactNode;
  /** Hint or validation message, linked to the control through `aria-describedby`. */
  helperText?: ReactNode;
  /** Visual status. `error` also sets `aria-invalid` on the control. */
  status?: Status;
  fullWidth?: boolean;
  size?: Size;
  /** Renders a `textarea` instead of an `input`. */
  multiline?: boolean;
  rows?: number;
  /** Decorative content before the control. Mark purely decorative icons `aria-hidden`. */
  startAdornment?: ReactNode;
  /** Decorative content after the control. Mark purely decorative icons `aria-hidden`. */
  endAdornment?: ReactNode;
  'data-testid'?: string;
}

/**
 * Text input with label, helper text and adornments. Spacing, sizing and display style props apply to the root
 * element and behave as documented on `Box`; native input attributes go to the control.
 */
export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(function TextField(
  {
    label,
    helperText,
    status,
    fullWidth,
    size = 'md',
    multiline = false,
    rows,
    startAdornment,
    endAdornment,
    className,
    style,
    id,
    disabled,
    'data-testid': dataTestId,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, TEXT_FIELD_STYLE_PROPS, style);

  return (
    <Field.Root
      className={clsx('ps-TextField', styleClassName, className)}
      style={computedStyle}
      disabled={disabled}
      invalid={status === 'error' ? true : undefined}
      data-testid={dataTestId}
      data-size={size}
      data-status={status}
      data-full-width={fullWidth || undefined}
      data-multiline={multiline || undefined}
    >
      {label && (
        <Field.Label className="ps-TextField__label" htmlFor={inputId}>
          {label}
        </Field.Label>
      )}
      <div className="ps-TextField__wrapper">
        {startAdornment && (
          <span className="ps-TextField__adornment ps-TextField__adornment--start">{startAdornment}</span>
        )}
        <Field.Control
          {...rest}
          ref={ref}
          id={inputId}
          className="ps-TextField__input"
          render={multiline ? TEXTAREA : undefined}
          {...(multiline && { rows })}
        />
        {endAdornment && <span className="ps-TextField__adornment ps-TextField__adornment--end">{endAdornment}</span>}
      </div>
      {helperText && <Field.Description className="ps-TextField__helper">{helperText}</Field.Description>}
    </Field.Root>
  );
});
