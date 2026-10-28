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

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';
import { forwardRef, useCallback } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import type { DisplayProps, RadiusProps, SizingProps, SpacingProps } from '../system';
import {
  applyStyleProps,
  compileStyleProps,
  displayProps,
  mergeControlStyle,
  radiusProps,
  sizingProps,
  spacingProps,
} from '../system';
import type { ColorVariant, Size, Status } from '../types';

import '../system/layout.css';
import '../system/radius.css';
import '../system/spacing.css';
import './checkbox.css';

export type CheckboxLabelPosition = 'start' | 'end';
export type CheckboxVariant = 'subtle' | 'solid' | 'outline';

export interface CheckboxChangeEventDetails {
  event: Event;
}

export interface CheckboxStyle extends CSSProperties {
  '--perses-checkbox-border-color'?: string;
  '--perses-checkbox-color'?: string;
  '--perses-checkbox-color-hover'?: string;
  '--perses-checkbox-focus-color'?: string;
  /** Per-step box-size override; falls back to the shared selection-control scale. */
  '--perses-checkbox-size-xs'?: string;
  '--perses-checkbox-size-sm'?: string;
  '--perses-checkbox-size-md'?: string;
  '--perses-checkbox-size-lg'?: string;
}

const CHECKBOX_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps]);
const CHECKBOX_RADIUS_PROPS = compileStyleProps([radiusProps]);

/** A checkbox must have an accessible name: a visible `label`, `aria-label` or `aria-labelledby`. */
export type CheckboxAccessibleName = { label: ReactNode } | { 'aria-label': string } | { 'aria-labelledby': string };

/** Styling-only overrides for the checkbox's documented internal parts. */
export interface CheckboxSlotProps {
  /** The sized control element; accepts the `CheckboxStyle` custom properties. */
  control?: SlotStyleProps<CheckboxStyle>;
  indicator?: SlotStyleProps;
  label?: SlotStyleProps;
}

export type CheckboxProps = CheckboxBaseProps & CheckboxAccessibleName;

interface CheckboxBaseProps
  extends
    Omit<HTMLAttributes<HTMLElement>, 'children' | 'color' | 'onChange' | 'style'>,
    SpacingProps,
    SizingProps,
    DisplayProps,
    RadiusProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean, details: CheckboxChangeEventDetails) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  value?: string;
  uncheckedValue?: string;
  form?: string;
  inputRef?: Ref<HTMLInputElement>;
  label?: ReactNode;
  labelPosition?: CheckboxLabelPosition;
  size?: Size;
  color?: ColorVariant | Status;
  variant?: CheckboxVariant;
  style?: PersesCSSProperties<CheckboxStyle>;
  /**
   * Styles internal parts without changing structure or behavior. On an unlabeled control, top-level styles win
   * conflicting properties over `slotProps.control.style`. With a label, top-level styles stay on the outer wrapper.
   */
  slotProps?: CheckboxSlotProps;
}

/**
 * Spacing, sizing and display style props behave as documented on `Box`. They apply to the outermost element: the
 * label wrapper when a `label` is rendered, otherwise the checkbox control. `label` accepts any content (links, icons,
 * stacks), so consumers own the supporting text and can reference it with `aria-describedby`.
 */
export const Checkbox = forwardRef<HTMLElement, CheckboxProps>(function Checkbox(
  {
    checked,
    defaultChecked,
    onCheckedChange,
    indeterminate = false,
    disabled = false,
    readOnly = false,
    required = false,
    invalid = false,
    name,
    value,
    uncheckedValue,
    form,
    inputRef,
    label,
    labelPosition = 'end',
    size = 'md',
    color = 'default',
    variant = 'subtle',
    className,
    style,
    slotProps,
    id,
    'aria-invalid': ariaInvalidProp,
    ...props
  },
  ref,
) {
  const hasLabel = label !== undefined;
  const {
    className: radiusClassName,
    style: radiusStyle,
    rest: restWithoutRadius,
  } = applyStyleProps(props, CHECKBOX_RADIUS_PROPS);
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(restWithoutRadius, CHECKBOX_STYLE_PROPS, style);
  const domProps = rest as HTMLAttributes<HTMLElement>;
  const callerClassName = clsx(styleClassName, className);
  const controlStyle = hasLabel
    ? mergeControlStyle(radiusStyle, slotProps?.control?.style ?? {})
    : mergeControlStyle(slotProps?.control?.style, mergeControlStyle(radiusStyle, computedStyle));
  const handleCheckedChange = useCallback(
    (nextChecked: boolean, eventDetails: BaseCheckbox.Root.ChangeEventDetails): void => {
      onCheckedChange?.(nextChecked, { event: eventDetails.event });
    },
    [onCheckedChange],
  );

  const control = (
    <BaseCheckbox.Root
      {...domProps}
      ref={ref}
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={handleCheckedChange}
      indeterminate={indeterminate}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={invalid || ariaInvalidProp}
      name={name}
      value={value}
      uncheckedValue={uncheckedValue}
      form={form}
      inputRef={inputRef}
      className={clsx('ps-Checkbox', radiusClassName, !hasLabel && callerClassName, slotProps?.control?.className)}
      style={controlStyle}
      data-invalid={invalid ? '' : undefined}
      data-size={size}
      data-color={color}
      data-variant={variant}
    >
      <BaseCheckbox.Indicator
        className={clsx('ps-Checkbox__indicator', slotProps?.indicator?.className)}
        style={slotProps?.indicator?.style}
      >
        <span className="ps-Checkbox__mark" aria-hidden="true" />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );

  if (!hasLabel) {
    return control;
  }

  return (
    <label
      className={clsx('ps-Checkbox__field', callerClassName)}
      style={computedStyle}
      data-disabled={disabled ? '' : undefined}
      data-label-position={labelPosition}
    >
      {control}
      <span className={clsx('ps-Checkbox__labelText', slotProps?.label?.className)} style={slotProps?.label?.style}>
        {label}
      </span>
    </label>
  );
});
