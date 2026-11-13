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
import type { SelectPositionerProps } from '@base-ui/react/select';
import { clsx } from 'clsx';
import { forwardRef, useCallback, useContext, useEffect, useId, useMemo } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

import { ThemeModeContext } from '../../contexts/ThemeModeProvider';
import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { hasContent } from '../hasContent';
import { ChevronDownIcon } from '../Icon';
import type { DisplayProps, RadiusProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, radiusProps, sizingProps, spacingProps } from '../system';
import type { Size, Status } from '../types';
import { BasicEngine } from './BasicEngine';
import { collectItems, optionKey, optionsFromItems } from './collectItems';
import { SelectItem } from './SelectItem';
import type { SelectValue } from './SelectItem';
import type { SelectEngineProps } from './SelectShell';
import { emptySelection, isEmptySelection, toCallbackValue } from './selectValue';
import type { SelectCurrentValue } from './selectValue';
import { useControllableState } from './useControllableState';

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
const chevronIcon = <ChevronDownIcon className="ps-Select__chevron" />;
const defaultChipRemoveAriaLabel = (label: string): string => `Remove ${label}`;
const defaultMoreChipsLabel = (count: number): string => `${count} more selected`;

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

/** A data-driven option for the `items` prop. */
export interface SelectItemData {
  value: SelectValue;
  /** Text shown in the list, the field and chips; also what search matches against. */
  label: string;
  disabled?: boolean;
}

/** Documented internal styling targets; the root remains styled through top-level `className` and `style`. */
export interface SelectSlotProps {
  /** Visible label; rendered only when `label` is provided. */
  label?: SlotStyleProps;
  /** The field that holds the value, chips, input and buttons; accepts the `SelectStyle` size overrides. */
  control?: SlotStyleProps<SelectStyle>;
  /** The focusable element in either mode: the button, or the search input. */
  trigger?: SlotStyleProps;
  /** The selected-value chips; rendered only with `chips`. */
  chips?: SlotStyleProps;
  /** The button that clears the selection; rendered only with `clearable`. */
  clearButton?: SlotStyleProps;
  /** The floating list; portaled to `document.body`. */
  popup?: SlotStyleProps;
  /** The listbox that holds the options inside the popup. */
  list?: SlotStyleProps;
  /** Supporting text; rendered only when `helperText` is provided. */
  helper?: SlotStyleProps;
}

/**
 * Props shared by single and multiple selection. Spacing and sizing style props apply to the root; radius props
 * apply to the control. From the display group only `overflow` is accepted: `display` is fixed by the stylesheet
 * (`inline-flex`, or `flex` with `fullWidth`) and is ignored if passed.
 */
interface SelectBaseProps
  extends
    Omit<
      HTMLAttributes<HTMLElement>,
      'defaultValue' | 'onChange' | 'style' | 'children' | 'aria-label' | 'aria-labelledby'
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
  name?: string;
  form?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Visual status. `error` also sets `aria-invalid` on the trigger. */
  status?: Status;
  fullWidth?: boolean;
  /** Trigger height and text size. The popup text and row height follow it; `md` keeps Menu's default density. */
  size?: Size;
  required?: boolean;
  readOnly?: boolean;
  /**
   * Shown in the trigger while nothing is selected, even when `renderValue` is set. An empty string `""` counts as
   * nothing selected (the same rule as a native `<select>`), so do not combine a placeholder with a `SelectItem`
   * whose value is `""`: selecting that item would show the placeholder instead of its label. `Select` logs a
   * console warning in that case.
   */
  placeholder?: ReactNode;
  /**
   * Replaces the default chevron; pass `null` to render no icon. Only the default chevron flips while the list is
   * open; a custom icon stays still.
   */
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
  /** Shows a button that resets the selection when something is selected. */
  clearable?: boolean;
  /** Shows a spinner, sets `aria-busy` and shows `loadingText` while there are no items. */
  loading?: boolean;
  /** Non-option content rendered above the options in the popup, outside the listbox. */
  listHeader?: ReactNode;
  /** Shown when no option matches. Defaults to "No results". */
  emptyText?: ReactNode;
  /** Shown while `loading` and there are no items. Defaults to "Loading…". */
  loadingText?: ReactNode;
  /** Accessible name of the clear button. Defaults to "Clear selection". */
  clearAriaLabel?: string;
}

/** Options come from `items` or from `SelectItem` and `SelectGroup` children, never both. */
type SelectOptionsSource =
  | {
      items: SelectItemData[];
      children?: never;
    }
  | {
      items?: undefined;
      /** `SelectItem` and `SelectGroup` elements. */
      children?: ReactNode;
    };

/**
 * Every Select needs a name for screen readers, so you must pass one of `label`, `aria-label` or
 * `aria-labelledby`. If you pass a visible `label`, that text is the name and the two aria props are blocked:
 * they would replace the visible text with something the user cannot see (WCAG 2.5.3 Label in Name).
 */
type SelectAccessibleName =
  | {
      /**
       * Visible label, associated with the trigger through `aria-labelledby` and used as the accessible name.
       * Clicking it focuses the trigger without opening the list, like the label of a native `<select>`.
       */
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

type SelectSearchProps =
  | {
      searchable?: false;
      filter?: never;
      inputValue?: never;
      defaultInputValue?: never;
      onInputValueChange?: never;
    }
  | {
      /** Renders an input in the field that filters the options. Fixed for the component's lifetime. */
      searchable: true;
      /** Custom matching; `null` disables local filtering (server-side search). */
      filter?: ((item: SelectItemData, query: string) => boolean) | null;
      inputValue?: string;
      defaultInputValue?: string;
      onInputValueChange?: (inputValue: string) => void;
    };

type SelectSelectionProps =
  | {
      multiple?: false;
      value?: SelectValue | null;
      defaultValue?: SelectValue | null;
      onValueChange?: (value: SelectValue | null) => void;
      /**
       * Custom field content for the current value; defaults to the selected item's `children`. While nothing is
       * selected and a `placeholder` is set, the placeholder is shown and this is not called; otherwise it receives
       * `null` (or `""`) for an empty selection.
       */
      renderValue?: (value: SelectValue | null) => ReactNode;
      chips?: never;
      limitChips?: never;
      chipRemoveAriaLabel?: never;
      moreChipsLabel?: never;
    }
  | {
      /** Allows several items to be selected; `value` becomes an array and the field joins the item labels. */
      multiple: true;
      value?: readonly SelectValue[];
      defaultValue?: readonly SelectValue[];
      onValueChange?: (value: SelectValue[]) => void;
      /**
       * Custom field content for the current values; defaults to the selected items' `children` joined by `, `.
       * While nothing is selected and a `placeholder` is set, the placeholder is shown and this is not called;
       * otherwise it receives an empty array.
       */
      renderValue?: (value: SelectValue[]) => ReactNode;
      chips?: false;
      limitChips?: never;
      chipRemoveAriaLabel?: never;
      moreChipsLabel?: never;
    }
  | {
      multiple: true;
      value?: readonly SelectValue[];
      defaultValue?: readonly SelectValue[];
      onValueChange?: (value: SelectValue[]) => void;
      /** Shows the selected items as removable chips. */
      chips: true;
      /** While focus is outside the field and the list is closed, show this many chips, then "+N". */
      limitChips?: number;
      renderValue?: never;
      /** Accessible name of a chip's remove button. Defaults to `(label) => \`Remove ${label}\``. */
      chipRemoveAriaLabel?: (label: string) => string;
      /** Screen-reader text for "+N". Defaults to `(count) => \`${count} more selected\``. */
      moreChipsLabel?: (count: number) => string;
    };

export type SelectProps = SelectBaseProps &
  SelectAccessibleName &
  SelectOptionsSource &
  SelectSearchProps &
  SelectSelectionProps;

/**
 * Dropdown that picks one or more `SelectItem`s, with an optional label and helper text. Spacing (`p`, `m`, …),
 * sizing and `overflow` props style the root wrapper; radius props style the control. Values can be tokens
 * (`"sm"`), pixel numbers (`12`), CSS lengths or responsive objects (`{ default: 'sm', md: 0 }`).
 * Native button attributes, handlers, and `ref` stay on the trigger.
 *
 * The list portals to `document.body` and propagates the nearest `ThemeModeProvider` mode so it stays dark on a
 * dark page. Without a provider it inherits the document theme; other ancestor token overrides do not cross the portal.
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
export const Select = forwardRef<HTMLElement, SelectProps>(function Select(
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
    items,
    searchable: _searchable,
    filter: _filter,
    inputValue: _inputValue,
    defaultInputValue: _defaultInputValue,
    onInputValueChange: _onInputValueChange,
    chips = false,
    limitChips,
    chipRemoveAriaLabel = defaultChipRemoveAriaLabel,
    moreChipsLabel = defaultMoreChipsLabel,
    clearable = false,
    loading: _loading,
    listHeader: _listHeader,
    emptyText: _emptyText,
    loadingText: _loadingText,
    clearAriaLabel = 'Clear selection',
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
  const mode = useContext(ThemeModeContext);
  const triggerId = id ?? generatedId;
  const isMultiple = multiple === true;
  // `children` is usually a new value on every parent render; the memo still skips the walk when Select re-renders
  // on its own (for example a theme mode change) or the consumer passes stable children.
  const options = useMemo(() => (items ? optionsFromItems(items) : collectItems(children)), [items, children]);
  const optionsByValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const optionNodes = useMemo(
    () =>
      items
        ? items.map((item) => (
            <SelectItem key={optionKey(item.value)} value={item.value} disabled={item.disabled}>
              {item.label}
            </SelectItem>
          ))
        : children,
    [items, children],
  );
  const showsPlaceholder = hasContent(placeholder);
  const placeholderConflict = showsPlaceholder && options.some((option) => option.value === '');
  useEffect(() => {
    if (placeholderConflict) {
      console.warn(
        'Select: `placeholder` should not be combined with a `SelectItem` whose value is "" because "" means nothing is selected, so selecting that item shows the placeholder. Give the item a value such as "all" or "none".',
      );
    }
  }, [placeholderConflict]);
  const renderTriggerValue = useMemo(() => {
    if (!renderValue) return undefined;
    const render = renderValue as (current: SelectCurrentValue) => ReactNode;
    return (current: SelectCurrentValue): ReactNode =>
      showsPlaceholder && isEmptySelection(current) ? placeholder : render(toCallbackValue(current));
  }, [renderValue, showsPlaceholder, placeholder]);
  const handleValueChange = useCallback(
    (next: SelectCurrentValue) =>
      (onValueChange as ((value: SelectValue | SelectValue[] | null) => void) | undefined)?.(toCallbackValue(next)),
    [onValueChange],
  );
  const [currentValue, setCurrentValue] = useControllableState<SelectCurrentValue>(
    value as SelectCurrentValue | undefined,
    (defaultValue as SelectCurrentValue | undefined) ?? emptySelection(isMultiple),
    handleValueChange,
  );
  const [isOpen, setIsOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const {
    className: radiusClassName,
    style: radiusStyle,
    rest: restWithoutRadius,
  } = applyStyleProps(props, SELECT_RADIUS_PROPS, slotProps?.control?.style);
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(restWithoutRadius, SELECT_STYLE_PROPS, style);
  const { display: _display, ...restWithoutDisplay } = rest as typeof rest & { display?: unknown };

  const engineProps: SelectEngineProps = {
    forwardedRef: ref,
    focusableProps: { ...restWithoutDisplay, id: triggerId },
    label,
    helperText,
    placeholder,
    icon,
    startElement,
    endElement,
    size,
    status,
    required,
    readOnly,
    disabled,
    name,
    form,
    multiple: isMultiple,
    clearable,
    clearAriaLabel,
    chips,
    limitChips,
    chipRemoveAriaLabel,
    moreChipsLabel,
    value: currentValue,
    setValue: setCurrentValue,
    open: isOpen,
    setOpen: setIsOpen,
    options,
    optionsByValue,
    optionNodes,
    renderValue: renderTriggerValue,
    placement,
    align,
    offset,
    themeMode: mode,
    slotProps,
    controlClassName: clsx(radiusClassName, slotProps?.control?.className),
    controlStyle: radiusStyle,
  };

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
      <BasicEngine {...engineProps} />
    </Field.Root>
  );
});
