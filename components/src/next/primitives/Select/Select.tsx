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
import { Select as BaseSelect } from '@base-ui/react/select';
import type { SelectPositionerProps } from '@base-ui/react/select';
import { clsx } from 'clsx';
import { forwardRef, useCallback, useId, useMemo } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { ChevronDownIcon, Icon } from '../Icon';
import type { DisplayProps, RadiusProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, radiusProps, sizingProps, spacingProps } from '../system';
import { TextHelper } from '../TextHelper';
import type { Size, Status } from '../types';
import { collectItems } from './collectItems';
import type { SelectValue } from './SelectItem';

// oxlint-disable-next-line import/no-unassigned-import -- Registers shared layout utility styles used by style props.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers shared radius utility styles used by style props.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers shared spacing utility styles used by style props.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers this component's styles.
import './select.css';

/** Mirrors --perses-spacing-xs (4px). */
const SIDE_OFFSET = 4;
const chevronIcon = <ChevronDownIcon />;
const renderIcon = <Icon />;

// Only `overflow` from the display category: `display` stays fixed to inline-flex/flex by the stylesheet.
const SELECT_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, { overflow: displayProps.overflow }]);
const SELECT_RADIUS_PROPS = compileStyleProps([radiusProps]);

export type SelectPlacement = 'top' | 'bottom' | 'left' | 'right';
export type SelectAlign = 'start' | 'center' | 'end';

export interface SelectStyle extends CSSProperties {
  /** Per-step trigger height override; falls back to the shared control-size scale. */
  '--perses-select-size-xs'?: string;
  '--perses-select-size-sm'?: string;
  '--perses-select-size-md'?: string;
  '--perses-select-size-lg'?: string;
}

/** Documented internal styling targets; the root remains styled through top-level `className` and `style`. */
export interface SelectSlotProps {
  /** Visible label; rendered only when `label` is provided. */
  label?: SlotStyleProps;
  /** The button that shows the selected value and opens the list; accepts the `SelectStyle` size overrides. */
  trigger?: SlotStyleProps<SelectStyle>;
  /** The floating list; portaled to `document.body`. */
  popup?: SlotStyleProps;
  /** Supporting text; rendered only when `helperText` is provided. */
  helper?: SlotStyleProps;
}

interface SelectBaseProps
  extends
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      'value' | 'defaultValue' | 'style' | 'type' | 'aria-label' | 'aria-labelledby'
    >,
    SpacingProps,
    SizingProps,
    RadiusProps,
    Pick<DisplayProps, 'overflow'> {
  /** Inline styles for the root; accepts the `--perses-select-size-<step>` override custom properties. */
  style?: PersesCSSProperties<SelectStyle>;
  /** Styling-only overrides for internal parts; does not replace content, behavior, or accessibility attributes. */
  slotProps?: SelectSlotProps;
  /** Hint or validation message, linked to the trigger through `aria-describedby`. */
  helperText?: ReactNode;
  /** Visual status. `error` also sets `aria-invalid` on the trigger. */
  status?: Status;
  fullWidth?: boolean;
  size?: Size;
  required?: boolean;
  readOnly?: boolean;
  /** Shown in the trigger while nothing is selected. */
  placeholder?: ReactNode;
  /** Replaces the default chevron. */
  icon?: ReactNode;
  /** Content before the value. Mark purely decorative icons `aria-hidden`. */
  startElement?: ReactNode;
  /** Content after the value. Mark purely decorative icons `aria-hidden`. */
  endElement?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Side of the trigger the list opens on. Defaults to `bottom`. */
  placement?: SelectPlacement;
  /** Alignment of the list along the trigger. Defaults to `start`. */
  align?: SelectAlign;
  /** Distance from the trigger in pixels. Defaults to 4. */
  offset?: SelectPositionerProps['sideOffset'];
  /** `SelectItem` and `SelectGroup` elements. */
  children?: ReactNode;
}

/**
 * Every Select needs a name for screen readers, so you must pass one of `label`, `aria-label` or
 * `aria-labelledby`. If you pass a visible `label`, that text is the name and the two aria props are blocked:
 * they would replace the visible text with something the user cannot see (WCAG 2.5.3 Label in Name).
 */
type SelectAccessibleName =
  | {
      /** Visible label, associated with the trigger through `htmlFor`/`id`, and used as the accessible name. */
      label: ReactNode;
      'aria-label'?: never;
      'aria-labelledby'?: never;
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
      /** Id of an external element that labels the trigger when there is no visible label. */
      'aria-labelledby': string;
    };

interface SelectSingleProps {
  multiple?: false;
  value?: SelectValue | null;
  defaultValue?: SelectValue | null;
  onValueChange?: (value: SelectValue | null) => void;
  /** Custom trigger content for the current value; defaults to the selected item's `children`. */
  renderValue?: (value: SelectValue | null) => ReactNode;
}

interface SelectMultipleProps {
  /** Allows several items to be selected; `value` becomes an array and the trigger joins the item labels. */
  multiple: true;
  value?: SelectValue[];
  defaultValue?: SelectValue[];
  onValueChange?: (value: SelectValue[]) => void;
  /** Custom trigger content for the current values; defaults to the selected items' `children` joined by `, `. */
  renderValue?: (value: SelectValue[]) => ReactNode;
}

export type SelectProps = SelectBaseProps & SelectAccessibleName & (SelectSingleProps | SelectMultipleProps);

/**
 * Dropdown that picks one or more `SelectItem`s, with an optional label and helper text. Spacing (`p`, `m`, …),
 * sizing and `overflow` props style the root wrapper; radius props style the trigger. Values can be tokens
 * (`"sm"`), pixel numbers (`12`), CSS lengths or responsive objects (`{ default: 'sm', md: 0 }`).
 * Native button attributes, handlers, and `ref` stay on the trigger.
 *
 * The list portals to `document.body`, so ancestor-scoped themes and token overrides do not reach it.
 *
 * While the list is closed the trigger shows the selected item's `children`, read from the `SelectItem` elements
 * in `children` (through `SelectGroup` and fragments). If you write a custom component that returns a `SelectItem`
 * (for example `<MyOption />`), its label cannot be read this way and the trigger falls back to `String(value)`;
 * supply the text with `renderValue` in that case.
 *
 * @example
 * <Select label="Unit" value={unit} onValueChange={setUnit}>
 *   <SelectItem value="bytes">Bytes</SelectItem>
 *   <SelectItem value="seconds">Seconds</SelectItem>
 * </Select>
 *
 * @example
 * <Select label="Columns" multiple value={columns} onValueChange={setColumns}>
 *   <SelectGroup label="Labels">
 *     <SelectItem value="alertname">alertname</SelectItem>
 *   </SelectGroup>
 * </Select>
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    label,
    helperText,
    status,
    fullWidth,
    size = 'md',
    required,
    readOnly,
    disabled,
    name,
    form,
    placeholder,
    icon = chevronIcon,
    startElement,
    endElement,
    open,
    defaultOpen,
    onOpenChange,
    placement = 'bottom',
    align = 'start',
    offset = SIDE_OFFSET,
    multiple,
    value,
    defaultValue,
    onValueChange,
    renderValue,
    className,
    style,
    slotProps,
    id,
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const items = useMemo(() => collectItems(children), [children]);
  const handleValueChange = useCallback(
    (next: SelectValue | SelectValue[] | null) => (onValueChange as ((value: typeof next) => void) | undefined)?.(next),
    [onValueChange],
  );
  const handleOpenChange = useCallback((next: boolean) => onOpenChange?.(next), [onOpenChange]);
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
  } = applyStyleProps(props, SELECT_RADIUS_PROPS, slotProps?.trigger?.style);
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(restWithoutRadius, SELECT_STYLE_PROPS, style);
  const { display: _display, ...restWithoutDisplay } = rest as typeof rest & { display?: unknown };

  return (
    <Field.Root
      className={clsx('ps-Select', styleClassName, className)}
      style={computedStyle}
      disabled={disabled}
      invalid={status === 'error' ? true : undefined}
      data-size={size}
      data-status={status}
      data-full-width={fullWidth || undefined}
    >
      <BaseSelect.Root<SelectValue, boolean>
        items={items}
        multiple={multiple}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        name={name}
        form={form}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        modal={false}
      >
        {label && (
          <Field.Label
            className={clsx('ps-Select__label', slotProps?.label?.className)}
            style={slotProps?.label?.style}
            htmlFor={triggerId}
          >
            {label}
          </Field.Label>
        )}
        <BaseSelect.Trigger
          {...restWithoutDisplay}
          ref={ref}
          id={triggerId}
          className={clsx('ps-Select__trigger', radiusClassName, slotProps?.trigger?.className)}
          style={radiusStyle}
        >
          {startElement && <span className="ps-Select__adornment ps-Select__adornment--start">{startElement}</span>}
          <BaseSelect.Value className="ps-Select__value" placeholder={placeholder}>
            {renderValue}
          </BaseSelect.Value>
          {endElement && <span className="ps-Select__adornment ps-Select__adornment--end">{endElement}</span>}
          <BaseSelect.Icon className="ps-Select__icon" render={renderIcon}>
            {icon}
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            className="ps-Select__positioner"
            side={placement}
            align={align}
            sideOffset={offset}
            alignItemWithTrigger={false}
          >
            <BaseSelect.Popup
              className={clsx('ps-Select__popup', slotProps?.popup?.className)}
              style={slotProps?.popup?.style}
            >
              {children}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
        {helperText && (
          <Field.Description
            className={clsx('ps-Select__helper', slotProps?.helper?.className)}
            style={slotProps?.helper?.style}
            render={renderHelper}
          >
            {helperText}
          </Field.Description>
        )}
      </BaseSelect.Root>
    </Field.Root>
  );
});
