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
import { useMemo, useRef } from 'react';
import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from 'react';

import { hasContent } from '../hasContent';
import { CloseIcon } from '../Icon';
import { IconButton } from '../IconButton';
import { Spinner } from '../Spinner';
import { TextHelper } from '../TextHelper';
import type { Size, Status } from '../types';
import type { SelectOption } from './collectItems';
import type { SelectAlign, SelectItemData, SelectPlacement, SelectSlotProps } from './Select';
import type { SelectValue } from './SelectItem';
import { emptySelection, isEmptySelection } from './selectValue';
import type { SelectCurrentValue } from './selectValue';

const closeIcon = <CloseIcon aria-hidden="true" />;

/** Everything an engine needs from `Select`: already normalized, and always controlled. */
export interface SelectEngineProps {
  forwardedRef: Ref<HTMLElement>;
  /** Pass-through attributes for the focusable element (the trigger button). */
  focusableProps: Omit<HTMLAttributes<HTMLElement>, 'children'> & { id: string; autoFocus?: boolean };

  label: ReactNode;
  /** Id for the visible label, so a control outside the label's association can reference it. */
  labelId: string;
  helperText: ReactNode;
  placeholder: ReactNode;
  icon: ReactNode;
  startElement: ReactNode;
  endElement: ReactNode;

  size: Size;
  status?: Status;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  name?: string;
  form?: string;

  multiple: boolean;
  /** Search settings; only the search engine reads them. */
  search: {
    /** `undefined` keeps Base UI's case- and accent-insensitive match; `null` leaves filtering to the consumer. */
    filter?: ((item: SelectItemData, query: string) => boolean) | null;
    inputValue?: string;
    defaultInputValue?: string;
    onInputValueChange?: (value: string) => void;
  };
  /** Shows a button that resets the selection while something is selected. */
  clearable: boolean;
  clearAriaLabel: string;
  /** Shows a spinner and marks the focusable element busy. Items stay usable. */
  loading: boolean;
  /** Shown in the popup while `loading` and there are no items. */
  loadingText: ReactNode;
  /** Shown in the popup when there are no items and nothing is loading. */
  emptyText: ReactNode;
  /** Non-option content above the list, outside the listbox. */
  listHeader: ReactNode;
  value: SelectCurrentValue;
  setValue: (next: SelectCurrentValue) => void;
  open: boolean;
  setOpen: (next: boolean) => void;

  /** Shows the selected values as removable chips (multiple only). */
  chips: boolean;
  /** While focus is outside the field and the list is closed, show this many chips, then "+N". */
  limitChips?: number;
  chipRemoveAriaLabel: (label: string) => string;
  moreChipsLabel: (count: number) => string;

  options: SelectOption[];
  /** The same options keyed by value, for looking up the label and content of selected values. */
  optionsByValue: ReadonlyMap<SelectValue, SelectOption>;
  optionNodes: ReactNode;
  /** Already placeholder-aware: it is not called while nothing is selected and a placeholder is set. */
  renderValue?: (value: SelectCurrentValue) => ReactNode;

  placement: SelectPlacement;
  align: SelectAlign;
  /** Same type as the public `offset` prop, which Base UI allows to be a function as well as a number. */
  offset: SelectPositionerProps['sideOffset'];
  themeMode: string | undefined;

  slotProps?: SelectSlotProps;
  /** Radius classes merged with `slotProps.control.className`. */
  controlClassName?: string;
  /** Radius variables merged with `slotProps.control.style`. */
  controlStyle?: CSSProperties;
}

export interface SelectShellProps {
  engine: SelectEngineProps;
  controlRef: RefObject<HTMLDivElement | null>;
  label: ReactNode;
  /** The focusable part of the control: the trigger button or the search input. */
  field: ReactNode;
  /** Content after the end element, such as the clear button and the chevron. */
  trailing?: ReactNode;
  /** The live status region. */
  status?: ReactNode;
  popup: ReactNode;
  Control?: ElementType;
  /**
   * True when Base UI treats a press on the control as inside its reference (the search input group), so the outside
   * press leaves the list open and the shell has to close it. False when the outside press already closes the list.
   */
  pressIsInside?: boolean;
  /** Called after the clear button has reset the value, before focus returns to the field. */
  onClear?: () => void;
}

/**
 * Layout shared by every engine: label, the bordered control (start element, field, end element, trailing
 * content), helper text, status region and popup. The engine supplies the parts that depend on Base UI context.
 */
export function SelectShell({
  engine,
  controlRef,
  label,
  field,
  trailing,
  status,
  popup,
  Control = 'div',
  pressIsInside = false,
  onClear,
}: SelectShellProps): ReactElement {
  const {
    slotProps,
    helperText,
    startElement,
    endElement,
    disabled,
    readOnly,
    open,
    setOpen,
    clearable,
    clearAriaLabel,
    multiple,
    value,
    setValue,
  } = engine;
  const showClear = clearable && !isEmptySelection(value) && !disabled && !readOnly;
  const helperStatus = engine.status;
  const wasOpenOnPress = useRef(false);
  const renderHelper = useMemo<NonNullable<Field.Description.Props['render']>>(
    () =>
      (descriptionProps, state): ReactElement => (
        <TextHelper {...descriptionProps} status={helperStatus} disabled={state.disabled} />
      ),
    [helperStatus],
  );

  const handlePointerDownCapture = (): void => {
    // Base UI's outside press closes the list on pointerdown, before mousedown fires. Capture the open state here,
    // before that close, because by mousedown `open` already reads as closed.
    wasOpenOnPress.current = open;
  };

  const handleMouseDown = (event: MouseEvent<HTMLElement>): void => {
    const baseEvent = event as MouseEvent<HTMLElement> & { preventBaseUIHandler?: () => void };
    if (disabled || readOnly || event.button !== 0) {
      // Base UI's search input group opens the list on a press unless it is disabled; block that for a read-only
      // field. Direct presses on the trigger or input are not blocked here: they still open the list (by design).
      if (readOnly) baseEvent.preventBaseUIHandler?.();
      return;
    }
    // Real controls (trigger, input, clear and chip buttons, links) handle their own presses.
    if ((event.target as Element).closest('button, input, a')) return;
    event.preventDefault();
    controlRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
    // The shell owns a control press end to end, so Base UI's own press handler on the control (the search input
    // group opens the list on press) must not call `setOpen` a second time.
    baseEvent.preventBaseUIHandler?.();
    // The list was open at press time, so the control toggles like the trigger: a press closes it and never reopens it.
    if (wasOpenOnPress.current) {
      // Base UI's outside press has already closed the list, unless the press counts as inside.
      if (pressIsInside) setOpen(false);
      return;
    }
    setOpen(true);
  };

  const handleClear = (): void => {
    setValue(emptySelection(multiple));
    onClear?.();
    controlRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
  };

  return (
    <>
      {label}
      <Control
        ref={controlRef}
        className={clsx('ps-Select__control', engine.controlClassName)}
        style={engine.controlStyle}
        data-open={open ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
        onPointerDownCapture={handlePointerDownCapture}
        onMouseDown={handleMouseDown}
      >
        {hasContent(startElement) && (
          <span className="ps-Select__adornment ps-Select__adornment--start">{startElement}</span>
        )}
        {field}
        {hasContent(endElement) && <span className="ps-Select__adornment ps-Select__adornment--end">{endElement}</span>}
        {engine.loading && <Spinner aria-hidden="true" className="ps-Select__spinner" />}
        {showClear && (
          <IconButton
            aria-label={clearAriaLabel}
            size="xs"
            variant="ghost"
            className={clsx('ps-Select__clear', slotProps?.clearButton?.className)}
            style={slotProps?.clearButton?.style}
            onClick={handleClear}
          >
            {closeIcon}
          </IconButton>
        )}
        {trailing}
      </Control>
      {hasContent(helperText) && (
        <Field.Description
          className={clsx('ps-Select__helper', slotProps?.helper?.className)}
          style={slotProps?.helper?.style}
          render={renderHelper}
        >
          {helperText}
        </Field.Description>
      )}
      {status}
      {popup}
    </>
  );
}
