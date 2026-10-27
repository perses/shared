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
import { forwardRef, useId, useMemo } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import {
  applyStyleProps,
  compileStyleProps,
  displayProps,
  mergeControlStyle,
  sizingProps,
  spacingProps,
} from '../system';
import type { DisplayProps, SizingProps, SpacingProps } from '../system';
import type { ColorVariant, Size, Status } from '../types';

import '../system/layout.css';
import '../system/spacing.css';
import './switch.css';

const SWITCH_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps]);

export interface SwitchStyle extends CSSProperties {
  /** Per-step size override; falls back to the shared selection-control scale. */
  '--perses-switch-size-xs'?: string;
  '--perses-switch-size-sm'?: string;
  '--perses-switch-size-md'?: string;
  '--perses-switch-size-lg'?: string;
}

/** Styling-only overrides for the switch's documented internal parts. */
export interface SwitchSlotProps {
  control?: SlotStyleProps;
  thumb?: SlotStyleProps;
  label?: SlotStyleProps;
}

export interface SwitchProps
  extends
    Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'children' | 'defaultChecked' | 'style'>,
    SpacingProps,
    SizingProps,
    DisplayProps {
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
  /** Color of the track when the switch is on. @default 'default' */
  color?: ColorVariant | Status;
  /** Renders a clickable label next to the switch, wrapping both in a single `<label>`. */
  label?: ReactNode;
  /** Inline style, extended with typed selection-control size override custom properties. */
  style?: PersesCSSProperties<SwitchStyle>;
  /**
   * Styles internal parts without changing structure or behavior. On an unlabeled control, top-level styles win
   * conflicting properties over `slotProps.control.style`. With a label, top-level styles stay on the outer wrapper.
   */
  slotProps?: SwitchSlotProps;
}

/**
 * Headless, restyleable switch built on `@base-ui/react`'s `Switch`. Renders a
 * `role="switch"` element (never a native `<button>`) plus a visually-hidden
 * checkbox input that Base UI uses internally for form semantics.
 *
 * Visual and state variants are exposed as `data-*` attributes (`data-size`, `data-color`,
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
    color = 'default',
    label,
    className,
    style,
    slotProps,
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
): ReactElement {
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, SWITCH_STYLE_PROPS, style);
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const labelId = `${controlId}-label`;
  const hiddenInputId = `${controlId}-input`;
  const hasLabel = Boolean(label);
  const callerClassName = clsx(styleClassName, className);
  const controlStyle = hasLabel
    ? slotProps?.control?.style
    : mergeControlStyle(slotProps?.control?.style, computedStyle);
  const rootElement = useMemo(() => <span id={controlId} />, [controlId]);

  const root = (
    <BaseSwitch.Root
      {...rest}
      ref={ref}
      id={hiddenInputId}
      render={rootElement}
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
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (hasLabel && ariaLabel === undefined ? labelId : undefined)}
      data-size={size}
      data-color={color}
      className={clsx('ps-Switch', !hasLabel && callerClassName, slotProps?.control?.className)}
      style={controlStyle}
    >
      <BaseSwitch.Thumb
        className={clsx('ps-Switch__thumb', slotProps?.thumb?.className)}
        style={slotProps?.thumb?.style}
      />
    </BaseSwitch.Root>
  );

  if (!hasLabel) {
    return root;
  }

  return (
    <label className={clsx('ps-Switch__wrapper', callerClassName)} style={computedStyle} htmlFor={hiddenInputId}>
      {root}
      <span
        id={labelId}
        className={clsx('ps-Switch__label', slotProps?.label?.className)}
        style={slotProps?.label?.style}
        aria-hidden={ariaLabel !== undefined || undefined}
      >
        {label}
      </span>
    </label>
  );
});
