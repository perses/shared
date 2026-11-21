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
import { forwardRef, useId, useMemo } from 'react';
import type { CSSProperties, InputHTMLAttributes, ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { useFormControlState } from '../FormControl/FormControlContext';
import { hasContent } from '../hasContent';
import type { DisplayProps, RadiusProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, radiusProps, sizingProps, spacingProps } from '../system';
import { TextHelper } from '../TextHelper';
import type { Size, Status } from '../types';

import '../system/layout.css';
import '../system/radius.css';
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

/** Documented internal styling targets; the root remains styled through top-level `className` and `style`. */
export interface TextFieldSlotProps {
  /** Visible label; rendered only when `label` is provided. */
  label?: SlotStyleProps;
  /** Bordered wrapper around the control and start/end elements; accepts the `TextFieldStyle` size custom properties. */
  wrapper?: SlotStyleProps<TextFieldStyle>;
  /** Native input, or textarea when `multiline` is true. */
  input?: SlotStyleProps;
  /** Supporting text; rendered only when `helperText` is provided. */
  helper?: SlotStyleProps;
}

// Only `overflow` from the display category: `display` stays fixed to inline-flex/flex by the stylesheet, so
// compiling it would strip a `display` value from the DOM and let `.ps-display` override the default.
const TEXT_FIELD_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, { overflow: displayProps.overflow }]);
const TEXT_FIELD_RADIUS_PROPS = compileStyleProps([radiusProps]);

interface TextFieldBaseProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'size' | 'width' | 'height' | 'style' | 'aria-label' | 'aria-labelledby'
    >,
    SpacingProps,
    SizingProps,
    RadiusProps,
    Pick<DisplayProps, 'overflow'> {
  /** Inline styles for the root; accepts the `--perses-textfield-size-<step>` override custom properties. */
  style?: PersesCSSProperties<TextFieldStyle>;
  /** Styling-only overrides for internal parts; does not replace content, behavior, or accessibility attributes. */
  slotProps?: TextFieldSlotProps;
  /** Hint or validation message, linked to the control through `aria-describedby`. */
  helperText?: ReactNode;
  /** Visual status. `error` also sets `aria-invalid` on the control. */
  status?: Status;
  fullWidth?: boolean;
  size?: Size;
  /** Renders a `textarea` instead of an `input`. */
  multiline?: boolean;
  rows?: number;
  /** Content before the control. Mark purely decorative icons `aria-hidden`. */
  startElement?: ReactNode;
  /** Content after the control. Mark purely decorative icons `aria-hidden`. */
  endElement?: ReactNode;
}

/**
 * Accessible-name contract: at least one of `label`, `aria-label` or `aria-labelledby` is required so the control
 * always has an accessible name. When a visible `label` is provided it is the accessible name; `aria-label` and
 * `aria-labelledby` are disallowed there because either would silently override the visible text and produce a
 * Label-in-Name mismatch (WCAG 2.5.3).
 */
type TextFieldAccessibleName =
  | {
      /** Visible label, associated with the control through `htmlFor`/`id`, and used as the accessible name. */
      label: ReactNode;
      'aria-label'?: never;
      'aria-labelledby'?: never;
      labelledByFormControl?: never;
    }
  | {
      label?: undefined;
      /** Accessible name when there is no visible label. */
      'aria-label': string;
      'aria-labelledby'?: string;
      labelledByFormControl?: never;
    }
  | {
      label?: undefined;
      'aria-label'?: string;
      /** Id of an external element that labels the control when there is no visible label. */
      'aria-labelledby': string;
      labelledByFormControl?: never;
    }
  | {
      label?: undefined;
      'aria-label'?: never;
      'aria-labelledby'?: never;
      /**
       * The enclosing `FormControl` provides the label and helper text. The field skips its own `Field.Root`, label
       * and helper, inherits `size`, `disabled`, `required` and `status` from the wrapper, and `FormLabel` links to
       * the input Local `size`/`status`/`required` win; a disabled wrapper always disables the control.
       */
      labelledByFormControl: true;
    };

export type TextFieldProps = TextFieldBaseProps & TextFieldAccessibleName;

/**
 * Text input with label, helper text and optional start/end elements. Spacing, sizing and `overflow` style props apply to the root
 * element and behave as documented on `Box`; `display` is fixed by the stylesheet. Native attributes, handlers, and
 * `ref` stay on the control.
 *
 * @example
 * <TextField label="Name" helperText="Shown to your team" />
 *
 * @example
 * // Inside a FormControl the wrapper owns the label and helper text.
 * <FormControl required>
 *   <FormLabel>Name</FormLabel>
 *   <TextField labelledByFormControl />
 *   <FormHelperText>Shown to your team</FormHelperText>
 * </FormControl>
 */
export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(function TextField(
  {
    label,
    helperText,
    status: statusProp,
    fullWidth,
    size: sizeProp,
    multiline = false,
    rows,
    startElement,
    endElement,
    className,
    style,
    slotProps,
    id,
    disabled: disabledProp,
    required: requiredProp,
    labelledByFormControl: _labelledByFormControl,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { inFormControl, size, status, invalid, disabled, required } = useFormControlState({
    size: sizeProp,
    status: statusProp,
    disabled: disabledProp,
    required: requiredProp,
  });
  const renderHelper = useMemo<NonNullable<Field.Description.Props['render']>>(
    () =>
      (descriptionProps, state): ReactElement => (
        <TextHelper {...descriptionProps} status={status} disabled={state.disabled} />
      ),
    [status],
  );
  const {
    className: radiusClassName,
    style: radiusStyle,
    rest: restWithoutRadius,
  } = applyStyleProps(props, TEXT_FIELD_RADIUS_PROPS, slotProps?.wrapper?.style);
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(restWithoutRadius, TEXT_FIELD_STYLE_PROPS, style);
  const { display: _display, ...restWithoutDisplay } = rest as typeof rest & { display?: unknown };
  const rootClassName = clsx('ps-TextField', styleClassName, className);
  const control = (
    <div className={clsx('ps-TextField__wrapper', radiusClassName, slotProps?.wrapper?.className)} style={radiusStyle}>
      {hasContent(startElement) && (
        <span className="ps-TextField__adornment ps-TextField__adornment--start">{startElement}</span>
      )}
      <Field.Control
        {...(invalid && { 'aria-invalid': true })}
        {...restWithoutDisplay}
        ref={ref}
        id={inputId}
        disabled={disabled}
        required={required}
        className={clsx('ps-TextField__input', slotProps?.input?.className)}
        style={slotProps?.input?.style}
        render={multiline ? renderTextarea : undefined}
        {...(multiline && { rows })}
      />
      {hasContent(endElement) && (
        <span className="ps-TextField__adornment ps-TextField__adornment--end">{endElement}</span>
      )}
    </div>
  );

  if (inFormControl) {
    return (
      <div
        className={rootClassName}
        style={computedStyle}
        data-disabled={disabled || undefined}
        data-size={size}
        data-status={status}
        data-full-width={fullWidth || undefined}
        data-multiline={multiline || undefined}
      >
        {control}
      </div>
    );
  }

  return (
    <Field.Root
      className={rootClassName}
      style={computedStyle}
      disabled={disabled}
      invalid={invalid}
      data-size={size}
      data-status={status}
      data-full-width={fullWidth || undefined}
      data-multiline={multiline || undefined}
    >
      {hasContent(label) && (
        <Field.Label
          className={clsx('ps-TextField__label', slotProps?.label?.className)}
          style={slotProps?.label?.style}
          htmlFor={inputId}
        >
          {label}
        </Field.Label>
      )}
      {control}
      {hasContent(helperText) && (
        <Field.Description
          className={clsx('ps-TextField__helper', slotProps?.helper?.className)}
          style={slotProps?.helper?.style}
          render={renderHelper}
        >
          {helperText}
        </Field.Description>
      )}
    </Field.Root>
  );
});
