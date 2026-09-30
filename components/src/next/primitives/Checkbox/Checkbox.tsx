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
import { forwardRef, useCallback, useId, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';

import type { ColorVariant, Size, Status } from '../types';

import * as checkboxStyles from './checkbox.css';

void checkboxStyles;

export type CheckboxColor = ColorVariant | Status;
export type CheckboxSize = Size;
export type CheckboxLabelPosition = 'start' | 'end';

export interface CheckboxChangeEventDetails {
  event: Event;
}

export interface CheckboxStyle extends CSSProperties {
  '--perses-checkbox-border-color'?: string;
  '--perses-checkbox-color'?: string;
  '--perses-checkbox-color-hover'?: string;
  '--perses-checkbox-focus-color'?: string;
}

export interface CheckboxProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'color' | 'onChange' | 'style'> {
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
  description?: ReactNode;
  body?: ReactNode;
  labelPosition?: CheckboxLabelPosition;
  size?: CheckboxSize;
  color?: CheckboxColor;
  style?: CheckboxStyle;
}

export const Checkbox = forwardRef<HTMLElement, CheckboxProps>(function Checkbox(
  {
    checked,
    defaultChecked = false,
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
    description,
    body,
    labelPosition = 'end',
    size = 'md',
    color = 'primary',
    className,
    id,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const generatedDescriptionId = useId();
  const isControlled = checked !== undefined;
  const isChecked = checked ?? uncontrolledChecked;
  const hasSupportingContent = description !== undefined || body !== undefined;
  const hasFieldContent = label !== undefined || hasSupportingContent;
  const descriptionId = description === undefined ? undefined : `${id ?? generatedDescriptionId}-description`;
  const resolvedAriaDescribedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(' ') || undefined;
  const handleCheckedChange = useCallback(
    (nextChecked: boolean, eventDetails: BaseCheckbox.Root.ChangeEventDetails) => {
      if (!isControlled) {
        setUncontrolledChecked(nextChecked);
      }
      onCheckedChange?.(nextChecked, { event: eventDetails.event });
    },
    [isControlled, onCheckedChange],
  );

  const control = (
    <BaseCheckbox.Root
      {...rest}
      ref={ref}
      id={id}
      checked={isChecked}
      onCheckedChange={handleCheckedChange}
      indeterminate={indeterminate}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={invalid || undefined}
      name={name}
      value={value}
      uncheckedValue={uncheckedValue}
      form={form}
      inputRef={inputRef}
      aria-describedby={resolvedAriaDescribedBy}
      className={clsx('ps-Checkbox', className)}
      data-checked={isChecked || undefined}
      data-unchecked={!isChecked && !indeterminate ? '' : undefined}
      data-indeterminate={indeterminate || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-required={required || undefined}
      data-invalid={invalid || undefined}
      data-size={size}
      data-color={color}
    >
      <BaseCheckbox.Indicator className="ps-Checkbox__indicator">
        <span className="ps-Checkbox__mark" aria-hidden="true" />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );

  if (!hasFieldContent) {
    return control;
  }

  return (
    <div
      className="ps-Checkbox__field"
      data-disabled={disabled || undefined}
      data-label-position={labelPosition}
      data-size={size}
    >
      <label className="ps-Checkbox__label">
        {control}
        {label !== undefined && <span className="ps-Checkbox__labelText">{label}</span>}
      </label>
      {hasSupportingContent && (
        <div className="ps-Checkbox__supportingContent">
          {description !== undefined && (
            <span id={descriptionId} className="ps-Checkbox__description">
              {description}
            </span>
          )}
          {body !== undefined && <div className="ps-Checkbox__body">{body}</div>}
        </div>
      )}
    </div>
  );
});
