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
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

import type { DisplayProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, sizingProps, spacingProps } from '../system';
import type { Size, Status } from '../types';

import '../system/layout.css';
import '../system/spacing.css';
import './textField.css';

// Render function rather than a bare element so the label/aria props Base UI merges in are visible to lint.
const renderTextarea: NonNullable<Field.Control.Props['render']> = (props) => <textarea {...props} />;

export interface TextFieldStyle extends CSSProperties {
  /** Per-step height override; falls back to the shared control-size scale. */
  '--perses-textfield-size-xs'?: string;
  '--perses-textfield-size-sm'?: string;
  '--perses-textfield-size-md'?: string;
  '--perses-textfield-size-lg'?: string;
}

// Only `overflow` from the display category: `display` stays fixed to inline-flex/flex by the stylesheet, so
// compiling it would strip a `display` value from the DOM and let `.ps-display` override the default.
const TEXT_FIELD_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, { overflow: displayProps.overflow }]);

interface TextFieldBaseProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'size' | 'width' | 'height' | 'style' | 'aria-label' | 'aria-labelledby'
    >,
    SpacingProps,
    SizingProps,
    Pick<DisplayProps, 'overflow'> {
  /** Inline styles for the root; accepts the `--perses-textfield-size-<step>` override custom properties. */
  style?: TextFieldStyle;
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
}

/**
 * Accessible-name contract: at least one of `label`, `aria-label` or `aria-labelledby` is required so the control
 * always has an accessible name.
 */
type TextFieldAccessibleName =
  | {
      /** Visible label, associated with the control through `htmlFor`/`id`. */
      label: ReactNode;
      'aria-label'?: string;
      'aria-labelledby'?: string;
    }
  | {
      label?: undefined;
      /** Accessible name when there is no visible label. */
      'aria-label': string;
      'aria-labelledby'?: string;
    }
  | {
      label?: undefined;
      'aria-label'?: string;
      /** Id of an external element that labels the control when there is no visible label. */
      'aria-labelledby': string;
    };

export type TextFieldProps = TextFieldBaseProps & TextFieldAccessibleName;

/**
 * Text input with label, helper text and adornments. Spacing, sizing and `overflow` style props apply to the root
 * element and behave as documented on `Box`; `display` is fixed by the stylesheet. Native input attributes go to the
 * control.
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
          render={multiline ? renderTextarea : undefined}
          {...(multiline && { rows })}
        />
        {endAdornment && <span className="ps-TextField__adornment ps-TextField__adornment--end">{endAdornment}</span>}
      </div>
      {helperText && <Field.Description className="ps-TextField__helper">{helperText}</Field.Description>}
    </Field.Root>
  );
});
