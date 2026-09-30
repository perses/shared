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

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import clsx from 'clsx';
import { forwardRef, useId } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import type { Size } from '../types';

import './switch.css';

export interface SwitchProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'children' | 'defaultChecked'> {
  /** Whether the switch is on. Omit and use `defaultChecked` for an uncontrolled switch. */
  checked?: boolean;
  /** The switch's initial state when uncontrolled. Ignored if `checked` is provided. */
  defaultChecked?: boolean;
  /** Called when the switch is toggled, with the new value and Base UI event details. */
  onCheckedChange?: (checked: boolean, eventDetails: BaseSwitch.Root.ChangeEventDetails) => void;
  /** Prevents interaction and dims the control. */
  disabled?: boolean;
  /** Requires the switch to be on before a surrounding form can submit. */
  required?: boolean;
  /** Allows focus but blocks toggling, matching the native `readonly` behavior on inputs. */
  readOnly?: boolean;
  /** Name submitted with a surrounding form. */
  name?: string;
  /** Id of the form the switch belongs to, when rendered outside of it. */
  form?: string;
  /** Value submitted with a surrounding form when the switch is on. */
  value?: string;
  /** Value submitted with a surrounding form when the switch is off. */
  uncheckedValue?: string;
  /** Visual size of the track and thumb. @default 'md' */
  size?: Size;
  /** Renders a clickable label next to the switch, wrapping both in a single `<label>`. */
  label?: ReactNode;
}

/**
 * Headless, restyleable switch built on `@base-ui/react`'s `Switch`. Renders a
 * `role="switch"` element (never a native `<button>`) plus a visually-hidden
 * checkbox input that Base UI uses internally for form semantics.
 *
 * Visual and state variants are exposed as `data-*` attributes (`data-size`,
 * plus Base UI's own `data-checked`/`data-unchecked`/`data-disabled`/`data-readonly`/
 * `data-required`) so a host application can restyle or replace this primitive.
 *
 * @example
 * // Controlled, no label
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 *
 * @example
 * // With a label, matching the MUI `FormControlLabel` pattern it replaces
 * <Switch checked={enabled} onCheckedChange={setEnabled} label="Enable feature" />
 */
export const Switch = forwardRef<HTMLElement, SwitchProps>(function Switch(
  {
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    required,
    readOnly,
    name,
    form,
    value,
    uncheckedValue,
    size = 'md',
    label,
    className,
    id,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  },
  ref,
): ReactElement {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const labelId = `${controlId}-label`;

  const root = (
    <BaseSwitch.Root
      {...rest}
      ref={ref}
      id={controlId}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      name={name}
      form={form}
      value={value}
      uncheckedValue={uncheckedValue}
      aria-labelledby={ariaLabelledBy ?? (label ? labelId : undefined)}
      data-size={size}
      className={clsx('ps-Switch', className)}
    >
      <BaseSwitch.Thumb className="ps-Switch__thumb" />
    </BaseSwitch.Root>
  );

  if (!label) {
    return root;
  }

  return (
    <label className="ps-Switch__wrapper" htmlFor={controlId}>
      {root}
      <span id={labelId} className="ps-Switch__label">
        {label}
      </span>
    </label>
  );
});
