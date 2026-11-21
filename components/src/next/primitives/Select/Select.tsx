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
import { forwardRef, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';

import { ThemeModeContext } from '../../contexts/ThemeModeProvider';
import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { useFormControlContext } from '../FormControl/FormControlContext';
import { hasContent } from '../hasContent';
import { ChevronDownIcon } from '../Icon';
import type { DisplayProps, RadiusProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, radiusProps, sizingProps, spacingProps } from '../system';
import type { Size, Status } from '../types';
import { BasicEngine } from './BasicEngine';
import { collectItems, optionsFromItems } from './collectItems';
import type { SelectOption } from './collectItems';
import { SearchEngine } from './SearchEngine';
import { SelectItem } from './SelectItem';
import type { SelectValue } from './SelectItem';
import type { SelectEngineProps } from './SelectShell';
import { emptySelection, isEmptySelection, isMultipleValue, optionKey, toCallbackValue } from './selectValue';
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

type OptionCache = ReadonlyMap<SelectValue, SelectOption>;
const EMPTY_OPTION_CACHE: OptionCache = new Map();

function selectedValuesOf(current: SelectCurrentValue): readonly SelectValue[] {
  if (isMultipleValue(current)) return current;
  return isEmptySelection(current) ? [] : [current as SelectValue];
}

/**
 * Remembers the option of every selected value, so a selected value that drops out of `items` (async search replaced
 * them) keeps its label. Values that are no longer selected are pruned. Returns `previous` when nothing changed, so
 * callers can tell by identity; options are compared by label because `children` produce new option objects on
 * every parent render.
 */
function refreshOptionCache(
  previous: OptionCache,
  current: ReadonlyMap<SelectValue, SelectOption>,
  selected: readonly SelectValue[],
): OptionCache {
  const next = new Map<SelectValue, SelectOption>();
  for (const selectedValue of selected) {
    const option = current.get(selectedValue) ?? previous.get(selectedValue);
    if (option) next.set(selectedValue, option);
  }
  const unchanged =
    next.size === previous.size && Array.from(next).every(([key, option]) => previous.get(key)?.label === option.label);
  return unchanged ? previous : next;
}

// Only `overflow` from the display category: `display` stays fixed to inline-flex/flex by the stylesheet.
const SELECT_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, { overflow: displayProps.overflow }]);
const SELECT_RADIUS_PROPS = compileStyleProps([radiusProps]);

export type SelectPlacement = 'top' | 'bottom' | 'left' | 'right';
export type SelectAlign = 'start' | 'center' | 'end';

export interface SelectStyle extends CSSProperties {
  /**
   * Per-step minimum height of the control (the bordered field that holds the value, chips and buttons). Falls back to
   * the shared control-size scale. Set it on the root `style` or on `slotProps.wrapper.style`.
   */
  '--perses-select-size-xs'?: string;
  '--perses-select-size-sm'?: string;
  '--perses-select-size-md'?: string;
  '--perses-select-size-lg'?: string;
}

/** A data-driven option for the `items` prop. */
export interface SelectItemData {
  value: SelectValue;
  /**
   * Plain text for search, typeahead, the search input and chip remove labels. It is also the displayed content (list,
   * trigger, chips) unless `renderItem` is set.
   */
  label: string;
  disabled?: boolean;
}

/** Documented internal styling targets; the root remains styled through top-level `className` and `style`. */
export interface SelectSlotProps {
  /** Visible label; rendered only when `label` is provided. */
  label?: SlotStyleProps;
  /**
   * The bordered field that holds the start and end elements, the value or chips, the trigger or input, the spinner,
   * the clear button and the chevron. It carries the radius props and the `--perses-select-size-<step>` overrides, and
   * is the element the list is anchored to.
   */
  wrapper?: SlotStyleProps<SelectStyle>;
  /**
   * The focusable element: the button in basic mode (it also holds the value), or the search input in searchable
   * mode. In both modes the chevron sits outside this slot, as the last item in the control.
   */
  trigger?: SlotStyleProps;
  /**
   * The container of the selected-value chips; rendered only with `chips`. In basic mode it renders only while
   * something is selected. In searchable mode it also holds the input and is always rendered.
   */
  chips?: SlotStyleProps;
  /** The button that clears the selection; rendered only with `clearable`. */
  clearButton?: SlotStyleProps;
  /** Positions the popup and owns its stacking (`z-index`); portaled to `document.body`. */
  positioner?: SlotStyleProps;
  /** The floating list inside the positioner. */
  popup?: SlotStyleProps;
  /** The listbox that holds the options inside the popup. */
  list?: SlotStyleProps;
  /** Supporting text; rendered only when `helperText` is provided. */
  helper?: SlotStyleProps;
}

/**
 * Props shared by single and multiple selection. Spacing and sizing style props apply to the root; radius props
 * apply to the wrapper. From the display group only `overflow` is accepted: `display` is fixed by the stylesheet
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
  /** Control height and text size. The popup text and row height follow it; `md` keeps Menu's default density. */
  size?: Size;
  required?: boolean;
  /**
   * Locks the value: the selection cannot change, and the clear button and the chips' remove buttons are not rendered.
   * Like Base UI, read-only locks the value, not the interaction: a direct press on the trigger (or the search input)
   * still opens the list so the options can be read. Only presses on the surrounding control area (padding,
   * adornments, chips) do not open it.
   */
  readOnly?: boolean;
  /**
   * Shown while nothing is selected, even when `renderValue` is set. In searchable mode it is the input's placeholder
   * and is used only when it is a string. An empty string `""` counts as
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
  /** Side of the control the list opens on; the list is anchored to the whole control. Defaults to `bottom`. */
  placement?: SelectPlacement;
  /** Alignment of the list along the control. Defaults to `start`. */
  align?: SelectAlign;
  /** Distance from the control in pixels. Defaults to 4. */
  offset?: SelectPositionerProps['sideOffset'];
  /** Shows a button that resets the selection when something is selected. */
  clearable?: boolean;
  /**
   * Shows a spinner and sets `aria-busy` on the trigger. While there are no items the list shows `loadingText` instead
   * of `emptyText`, and screen readers hear `loadingText` for as long as the list is open and `loading` is set.
   * Items stay usable while loading.
   */
  loading?: boolean;
  /**
   * Non-option content rendered above the options in the popup, outside the listbox. It is not in the list's keyboard
   * path: Tab from the field closes the list, so interactive content here (buttons, links) can only be used by
   * pointer while the list is open. Provide a keyboard equivalent, for example a keyboard-reachable "select all" item
   * or a control elsewhere on the page.
   */
  listHeader?: ReactNode;
  /** Shown when there are no options or none matches the search. Defaults to "No results". */
  emptyText?: ReactNode;
  /** Shown in the list while `loading` and there are no items. Defaults to "Loading…". */
  loadingText?: ReactNode;
  /** Accessible name of the clear button. Defaults to "Clear selection". */
  clearAriaLabel?: string;
}

/** Options come from `items` or from `SelectItem` and `SelectGroup` children, never both. */
type SelectOptionsSource =
  | {
      items: readonly SelectItemData[];
      /**
       * Custom content for each option row; defaults to `item.label`. Like `SelectItem` children, it is also shown
       * for a selected item in the basic trigger and in chips (`renderValue` replaces the field content). The row,
       * check indicator and keyboard behavior stay with `Select`, and `label` remains the text used for search,
       * typeahead, the search input and chip remove labels. Every item is rendered again when the function changes,
       * so define it outside the component or memoize it.
       */
      renderItem?: (item: SelectItemData) => ReactNode;
      children?: never;
    }
  | {
      items?: undefined;
      renderItem?: never;
      /** `SelectItem` and `SelectGroup` elements. */
      children?: ReactNode;
    };

/** Virtualization needs the search engine and data items; see `virtualized`. */
type SelectVirtualizationProps =
  | {
      virtualized?: false;
    }
  | {
      /**
       * Mounts only the options in view, for lists of thousands of items. Requires `searchable` and `items`:
       * `SelectItem` children and `SelectGroup` are not supported, and the basic (button) mode cannot be
       * virtualized. Rows should share one height: rows not yet rendered are sized like the first one. Each option
       * carries `aria-setsize` and `aria-posinset`, so screen readers announce its position in the filtered list.
       */
      virtualized: true;
      searchable: true;
      items: readonly SelectItemData[];
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
      /** Id of an external element that labels the trigger when there is no visible label. */
      'aria-labelledby': string;
      labelledByFormControl?: never;
    }
  | {
      label?: undefined;
      'aria-label'?: never;
      'aria-labelledby'?: never;
      /**
       * The enclosing `FormControl` provides the label and helper text. The select skips its own `Field.Root`, label
       * and helper, inherits `size`, `disabled`, `required` and `status` from the wrapper, and `FormLabel` names the
       * trigger Local `size`/`status`/`required` win; a disabled wrapper always disables the control.
       */
      labelledByFormControl: true;
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
      /**
       * Renders an input in the field that filters the options. Fixed for the component's lifetime: changing it
       * remounts the Select and resets its uncontrolled state.
       *
       * The input can only show text, so in single mode it shows the selected label and `renderValue` is ignored. In
       * multiple mode without `chips`, the selected labels (or `renderValue`) are shown before the input. `placeholder`
       * is used only when it is a string.
       */
      searchable: true;
      /**
       * Decides whether an option matches the typed text. Defaults to a case- and accent-insensitive match on the
       * option's label. Pass `null` to disable local filtering, for example when `items` come from a server search.
       */
      filter?: ((item: SelectItemData, query: string) => boolean) | null;
      /**
       * The typed text, when controlled. You then own the text: `Select` no longer resets it to the selected label.
       */
      inputValue?: string;
      /**
       * Initial typed text. In single mode, while the list is closed and `inputValue` is uncontrolled, the text
       * resyncs to the selected item's label (or to empty when nothing is selected), so `defaultInputValue` only takes
       * effect when the list starts open (for example with `defaultOpen`). Use controlled `inputValue` to keep other
       * text while the list is closed.
       */
      defaultInputValue?: string;
      /**
       * Called when the typed text changes, including when `Select` resets it, for example to the selected label
       * after a selection or to an empty string after clearing.
       */
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
      /**
       * While the list is closed and focus is not in the chips or the search input, show this many chips, then "+N".
       * Focus on the basic trigger keeps them collapsed.
       */
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
  SelectVirtualizationProps &
  SelectSelectionProps;

/**
 * Dropdown that picks one or more `SelectItem`s, with an optional label and helper text. Spacing (`p`, `m`, …),
 * sizing and `overflow` props style the root; radius props style the bordered wrapper. Values can be tokens
 * (`"sm"`), pixel numbers (`12`), CSS lengths or responsive objects (`{ default: 'sm', md: 0 }`).
 * Native attributes, handlers, and `ref` stay on the focusable element: the trigger button, or the input when
 * `searchable`.
 *
 * Two engines share one look. By default the field is a button that opens the list (a Base UI `Select`). With
 * `searchable` it is an input that filters the list as you type (a Base UI `Combobox`). `searchable` is fixed for the
 * component's lifetime: changing it remounts the Select and resets its uncontrolled value, open state and typed
 * text. Native `onChange` is not passed through; use `onValueChange` and `onInputValueChange`.
 *
 * `multiple` selects several items. With `chips` the selection shows as removable chips, and `limitChips` collapses
 * them to "+N" while the list is closed and focus is not in the chips or the search input (focus on the basic trigger
 * keeps them collapsed). In basic mode the chip `×` is a pointer shortcut only (it is not a tab stop): keyboard users
 * deselect items in the list. In searchable mode Backspace and the arrow keys move between the chips and the input.
 * `clearable` adds a button that resets the selection.
 *
 * Searchable limits: the input can only show text, so in single mode it shows the selected item's label and
 * `renderValue` is ignored; in multiple mode without `chips` the joined labels (or `renderValue`) appear before the
 * input; `placeholder` is used only when it is a string.
 *
 * The list portals to `document.body` and propagates the nearest `ThemeModeProvider` mode so it stays dark on a
 * dark page. Without a provider it inherits the document theme; other ancestor token overrides do not cross the portal.
 *
 * While the list is closed the trigger shows the selected item's `children`, read from the `SelectItem` elements
 * in `children` (through `SelectGroup` and fragments). If you write a custom component that returns a `SelectItem`
 * (for example `<MyOption />`), its label cannot be read this way and the trigger falls back to `String(value)`;
 * supply the text with `renderValue` in that case. With `searchable` such an item is still listed but is never
 * filtered by the typed text, its chip and field text fall back to `String(value)`, and `Select` warns once. Render
 * `SelectItem` directly in `children`, or pass `items`, to make the item searchable.
 *
 * For long lists, `searchable virtualized` with `items` mounts only the options in view. `renderItem` customizes how
 * each data item is rendered in the list, in either mode.
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
 *
 * @example
 * // Inside a FormControl the wrapper owns the label and helper text.
 * <FormControl>
 *   <FormLabel>Unit</FormLabel>
 *   <Select labelledByFormControl value={unit} onValueChange={setUnit}>…</Select>
 * </FormControl>
 */
export const Select = forwardRef<HTMLElement, SelectProps>(function Select(props, ref) {
  // The mode is fixed for a mounted Select: changing `searchable` remounts it and resets the uncontrolled state.
  return <SelectRoot key={props.searchable ? 'search' : 'basic'} {...props} forwardedRef={ref} />;
});

type SelectRootProps = SelectProps & { forwardedRef: Ref<HTMLElement> };

function SelectRoot({
  label,
  helperText: helperTextProp,
  status: statusProp,
  fullWidth,
  size: sizeProp,
  required: requiredProp,
  readOnly,
  disabled: disabledProp,
  labelledByFormControl: _labelledByFormControl,
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
  renderItem,
  searchable,
  virtualized = false,
  filter,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  chips = false,
  limitChips,
  chipRemoveAriaLabel = defaultChipRemoveAriaLabel,
  moreChipsLabel = defaultMoreChipsLabel,
  clearable = false,
  loading = false,
  listHeader,
  emptyText = 'No results',
  loadingText = 'Loading…',
  clearAriaLabel = 'Clear selection',
  className,
  style,
  slotProps,
  id,
  children,
  forwardedRef,
  ...props
}: SelectRootProps): ReactElement {
  const generatedId = useId();
  const labelId = useId();
  const mode = useContext(ThemeModeContext);
  const formControl = useFormControlContext();
  const size = sizeProp ?? formControl.size ?? 'md';
  const status = statusProp ?? formControl.status;
  const invalid = status === 'error';
  const disabled = disabledProp ?? formControl.disabled;
  const required = requiredProp ?? formControl.required;
  const helperText = formControl.inFormControl ? undefined : helperTextProp;
  const triggerId = id ?? generatedId;
  const isMultiple = multiple === true;
  // Only the search engine virtualizes; a basic-mode caller that bypasses the types still gets its full list.
  const isVirtualized = virtualized && searchable === true;
  // `children` is usually a new value on every parent render; the memo still skips the walk when Select re-renders
  // on its own (for example a theme mode change) or the consumer passes stable children.
  const options = useMemo(
    () => (items ? optionsFromItems(items, renderItem) : collectItems(children)),
    [items, renderItem, children],
  );
  const optionNodes = useMemo(() => {
    // The virtualized list renders its own options from the filtered values.
    if (isVirtualized) return null;
    return items
      ? options.map((option) => (
          <SelectItem
            key={optionKey(option.value)}
            value={option.value}
            disabled={option.disabled}
            label={option.label}
          >
            {option.content}
          </SelectItem>
        ))
      : children;
  }, [isVirtualized, items, options, children]);
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
  const optionsByCurrent = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const selectedValues = useMemo(() => selectedValuesOf(currentValue), [currentValue]);
  const [optionCache, setOptionCache] = useState<OptionCache>(() =>
    refreshOptionCache(EMPTY_OPTION_CACHE, optionsByCurrent, selectedValues),
  );
  const nextOptionCache = refreshOptionCache(optionCache, optionsByCurrent, selectedValues);
  // Adjusting state while rendering (React's documented alternative to an effect) keeps the cache in step with the
  // same render that needs it.
  if (nextOptionCache !== optionCache) setOptionCache(nextOptionCache);
  // The cache holds only selected values; current options take precedence over cached ones.
  const optionsByValue = useMemo(
    () => new Map([...nextOptionCache, ...optionsByCurrent]),
    [optionsByCurrent, nextOptionCache],
  );
  const [isOpen, setIsOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const {
    className: radiusClassName,
    style: radiusStyle,
    rest: restWithoutRadius,
  } = applyStyleProps(props, SELECT_RADIUS_PROPS, slotProps?.wrapper?.style);
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(restWithoutRadius, SELECT_STYLE_PROPS, style);
  const { display: _display, ...restWithoutDisplay } = rest as typeof rest & { display?: unknown };

  const engineProps: SelectEngineProps = {
    forwardedRef,
    focusableProps: { ...(invalid && { 'aria-invalid': true }), ...restWithoutDisplay, id: triggerId },
    label,
    labelId,
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
    search: { filter, inputValue, defaultInputValue, onInputValueChange, virtualized: isVirtualized },
    clearable,
    clearAriaLabel,
    loading,
    loadingText,
    emptyText,
    listHeader,
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
    wrapperClassName: clsx(radiusClassName, slotProps?.wrapper?.className),
    wrapperStyle: radiusStyle,
  };

  const engine = searchable ? <SearchEngine {...engineProps} /> : <BasicEngine {...engineProps} />;
  const rootClassName = clsx('ps-Select', styleClassName, className);

  if (formControl.inFormControl) {
    return (
      <div
        className={rootClassName}
        style={computedStyle}
        data-disabled={disabled || undefined}
        data-size={size}
        data-status={status}
        data-full-width={fullWidth || undefined}
      >
        {engine}
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
    >
      {engine}
    </Field.Root>
  );
}
