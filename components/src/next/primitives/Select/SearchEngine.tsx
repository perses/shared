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

import { Combobox } from '@base-ui/react/combobox';
import { Field } from '@base-ui/react/field';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ReactElement, ReactNode, Ref } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';

import { hasContent } from '../hasContent';
import { SearchOption } from './SearchOption';
import { SelectChips } from './SelectChips';
import type { SelectValue } from './SelectItem';
import { focusField, SelectShell } from './SelectShell';
import type { SelectEngineProps, SelectShellProps } from './SelectShell';
import { isEmptySelection, isMultipleValue, optionKey } from './selectValue';
import type { SelectCurrentValue } from './selectValue';
import { SelectVisibleValuesContext } from './SelectVisibleValuesContext';
import { useControllableState } from './useControllableState';

/**
 * Tells `SelectItem` and `SelectGroup` which values the engine knows and which of them match the search. `items` is
 * set on the Combobox, so Base UI filters the values and leaves the static children to us.
 */
function VisibleValues({ values, children }: { values: readonly SelectValue[]; children: ReactNode }): ReactElement {
  const filtered = Combobox.useFilteredItems<SelectValue>();
  const known = useMemo(() => new Set(values.map(optionKey)), [values]);
  const visible = useMemo(() => new Set(filtered.map(optionKey)), [filtered]);
  const warned = useRef(false);
  const reportUnknown = useCallback((): void => {
    if (warned.current) return;
    warned.current = true;
    console.warn(
      'Select: searchable mode cannot see `SelectItem`s rendered through wrapper components, so they are never ' +
        'filtered by the typed text. Render `SelectItem` directly in `children`, or pass `items`.',
    );
  }, []);
  const visibility = useMemo(() => ({ known, visible, reportUnknown }), [known, visible, reportUnknown]);
  return <SelectVisibleValuesContext.Provider value={visibility}>{children}</SelectVisibleValuesContext.Provider>;
}

/**
 * The live region: `loadingText` while loading, `emptyText` while the open list has no match. `Combobox.Status` stays
 * mounted so changes to its text are announced.
 */
function SearchStatus({
  loading,
  loadingText,
  emptyText,
  open,
}: Pick<SelectEngineProps, 'loading' | 'loadingText' | 'emptyText' | 'open'>): ReactElement {
  const noMatches = Combobox.useFilteredItems<SelectValue>().length === 0;
  let message: ReactNode = null;
  if (open && loading) message = loadingText;
  else if (open && noMatches) message = emptyText;
  return <Combobox.Status className="ps-Select__status ps-Select__visually-hidden">{message}</Combobox.Status>;
}

/**
 * The typed text. In single mode a closed list shows the selected label, so `defaultInputValue` only applies when the
 * list starts open. Starting from the label avoids a resync, and an `onInputValueChange` call, on mount.
 */
function useSearchInputValue(
  { search, multiple, open }: Pick<SelectEngineProps, 'search' | 'multiple' | 'open'>,
  selectedLabel: string,
): [string, (next: string) => void] {
  const keepsDefaultInputValue = multiple || open;
  const [inputValue, setInputValue] = useControllableState<string>(
    search.inputValue,
    (keepsDefaultInputValue ? search.defaultInputValue : undefined) ?? selectedLabel,
    search.onInputValueChange,
  );
  const typedTextIsControlled = search.inputValue !== undefined;
  // Base UI stops syncing the text with the selection once `inputValue` is passed, so the closed field is kept in
  // step here: after an outside value change, a form reset, a clear, or a selection the parent did not accept.
  // While the list is open the text belongs to the user.
  useEffect(() => {
    if (multiple || typedTextIsControlled || open) return;
    if (inputValue !== selectedLabel) setInputValue(selectedLabel);
  }, [multiple, typedTextIsControlled, open, inputValue, selectedLabel, setInputValue]);
  return [inputValue, setInputValue];
}

/** Adapts the item-based `filter` prop to Base UI, which filters values. `undefined` and `null` pass through. */
function useValueFilter(
  filter: SelectEngineProps['search']['filter'],
  optionsByValue: SelectEngineProps['optionsByValue'],
): ((selected: SelectValue, query: string) => boolean) | null | undefined {
  return useMemo(() => {
    if (!filter) return filter;
    return (selected: SelectValue, query: string): boolean => {
      const option = optionsByValue.get(selected);
      return option ? filter({ value: option.value, label: option.label, disabled: option.disabled }, query) : false;
    };
  }, [filter, optionsByValue]);
}

function SearchLabel({ engine, wrapperRef }: Pick<SelectShellProps, 'engine' | 'wrapperRef'>): ReactElement {
  const { label, labelId, slotProps } = engine;
  const handleClick = (event: MouseEvent<HTMLLabelElement>): void => {
    // A native label click would click the input, and the input opens the list on click.
    event.preventDefault();
    focusField(wrapperRef.current);
  };
  return (
    <Field.Label
      id={labelId}
      className={clsx('ps-Select__label', slotProps?.label?.className)}
      style={slotProps?.label?.style}
      onClick={handleClick}
    >
      {label}
    </Field.Label>
  );
}

/** The search input, after the chips or the selected labels in multiple mode. */
function SearchField({
  engine,
  labelOf,
}: {
  engine: SelectEngineProps;
  labelOf: (value: SelectValue) => string;
}): ReactElement {
  const { forwardedRef, focusableProps, loading, placeholder, value, multiple, chips, renderValue, slotProps } = engine;
  const input = (
    <Combobox.Input
      {...focusableProps}
      ref={forwardedRef as Ref<HTMLInputElement>}
      aria-busy={loading || undefined}
      placeholder={isEmptySelection(value) && typeof placeholder === 'string' ? placeholder : undefined}
      className={clsx('ps-Select__trigger ps-Select__input', slotProps?.trigger?.className)}
      style={slotProps?.trigger?.style}
    />
  );
  if (chips) {
    return (
      <SelectChips engine={engine} isSearch>
        {input}
      </SelectChips>
    );
  }
  if (!multiple || !isMultipleValue(value) || value.length === 0) return input;
  return (
    <>
      <span className="ps-Select__value">{renderValue ? renderValue(value) : value.map(labelOf).join(', ')}</span>
      {input}
    </>
  );
}

/** The chevron. It stays out of the tab order and shares the field's accessible name. */
function SearchToggle({ engine }: { engine: SelectEngineProps }): ReactElement {
  const { icon, label, labelId, focusableProps } = engine;
  const hasLabel = hasContent(label);
  const ariaLabelledBy = hasLabel ? labelId : focusableProps['aria-labelledby'];
  const ariaLabel = hasLabel ? undefined : focusableProps['aria-label'];
  // Only pass the props that have a value: an explicit `undefined` would replace the label id Base UI wires up from
  // an enclosing FormControl's FormLabel and leave the button unnamed.
  return (
    <Combobox.Trigger
      className="ps-Select__toggle"
      tabIndex={-1}
      {...(ariaLabelledBy !== undefined && { 'aria-labelledby': ariaLabelledBy })}
      {...(ariaLabel !== undefined && { 'aria-label': ariaLabel })}
    >
      {icon}
    </Combobox.Trigger>
  );
}

/**
 * The options for `virtualized`: Virtuoso mounts only the filtered options in view and scrolls the listbox itself. The
 * DOM holds a window of the options, so each one states its position in the filtered list.
 */
function VirtualOptions({
  engine,
  scroller,
  virtuosoRef,
}: {
  engine: SelectEngineProps;
  scroller: HTMLDivElement;
  virtuosoRef: Ref<VirtuosoHandle>;
}): ReactElement {
  const { optionsByValue } = engine;
  const filtered = Combobox.useFilteredItems<SelectValue>();
  const renderOption = (index: number, value: SelectValue): ReactNode => {
    const option = optionsByValue.get(value);
    return (
      <SearchOption
        index={index}
        value={value}
        disabled={option?.disabled}
        aria-setsize={filtered.length}
        aria-posinset={index + 1}
      >
        {option?.content}
      </SearchOption>
    );
  };
  return (
    <Virtuoso
      ref={virtuosoRef}
      customScrollParent={scroller}
      data={filtered}
      computeItemKey={(_, value) => optionKey(value)}
      itemContent={renderOption}
    />
  );
}

function SearchPopup({
  engine,
  wrapperRef,
  values,
  virtuosoRef,
  pointerHighlight,
}: Pick<SelectShellProps, 'engine' | 'wrapperRef'> & {
  values: readonly SelectValue[];
  virtuosoRef: Ref<VirtuosoHandle>;
  /** The highlight came from the pointer, so it gets the hover fill without the keyboard ring. */
  pointerHighlight: boolean;
}): ReactElement {
  const {
    slotProps,
    themeMode,
    placement,
    align,
    offset,
    size,
    listHeader,
    loading,
    loadingText,
    emptyText,
    optionNodes,
    search,
  } = engine;
  // Virtuoso scrolls the listbox, so it can only mount once the listbox exists.
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  return (
    <Combobox.Portal>
      <Combobox.Positioner
        className={clsx('ps-Select__positioner', slotProps?.positioner?.className)}
        style={slotProps?.positioner?.style}
        data-perses-mode={themeMode}
        anchor={wrapperRef}
        side={placement}
        align={align}
        sideOffset={offset}
      >
        <Combobox.Popup
          className={clsx('ps-Select__popup', slotProps?.popup?.className)}
          style={slotProps?.popup?.style}
          data-size={size}
          data-searchable
          data-pointer-highlight={pointerHighlight || undefined}
        >
          {hasContent(listHeader) && <div className="ps-Select__list-header">{listHeader}</div>}
          {/* `SearchStatus` is the one live region; Empty's own `role="status"` would announce twice. */}
          <Combobox.Empty className="ps-Select__empty" role="presentation" aria-live="off">
            {loading ? loadingText : emptyText}
          </Combobox.Empty>
          <Combobox.List
            ref={setScroller}
            className={clsx('ps-Select__list', slotProps?.list?.className)}
            style={slotProps?.list?.style}
          >
            {search.virtualized ? (
              scroller && <VirtualOptions engine={engine} scroller={scroller} virtuosoRef={virtuosoRef} />
            ) : (
              <VisibleValues values={values}>{optionNodes}</VisibleValues>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  );
}

/** The input-trigger engine: a Base UI `Combobox` whose value, open and typed-text state are owned by `Select`. */
export function SearchEngine(props: SelectEngineProps): ReactElement {
  const {
    label,
    icon,
    required,
    readOnly,
    disabled,
    name,
    form,
    multiple,
    loading,
    loadingText,
    emptyText,
    value,
    setValue,
    open,
    setOpen,
    options,
    optionsByValue,
    search,
  } = props;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const values = useMemo(() => options.map((option) => option.value), [options]);
  const labelOf = (selected: SelectValue): string => optionsByValue.get(selected)?.label ?? String(selected);
  const selectedLabel = !multiple && !isEmptySelection(value) ? labelOf(value as SelectValue) : '';
  const [inputValue, setInputValue] = useSearchInputValue(props, selectedLabel);
  const filter = useValueFilter(search.filter, optionsByValue);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [pointerHighlight, setPointerHighlight] = useState(false);

  const handleOpenChange = (next: boolean, details: Combobox.Root.ChangeEventDetails): void => {
    // The list stays open while several items are picked, so the typed filter survives each selection.
    if (!next && multiple && details.reason === 'item-press') {
      details.cancel();
      return;
    }
    setOpen(next);
  };
  // Base UI scrolls only mounted options into view, and a keyboard or programmatic highlight can land outside the
  // virtualized window; a pointer highlight is already under the pointer. Without virtualization the ref stays null.
  // The pointer source also drops the keyboard ring, as hovering does in basic mode.
  const handleItemHighlighted = (_: SelectValue | undefined, details: Combobox.Root.HighlightEventDetails): void => {
    const fromPointer = details.reason === 'pointer';
    setPointerHighlight(fromPointer);
    if (!fromPointer && details.index >= 0) virtuosoRef.current?.scrollIntoView({ index: details.index });
  };
  // Base UI resets the scroll of a regular list on typed input, but leaves a virtualized list to its scroller.
  const handleInputValueChange = (next: string, details: Combobox.Root.ChangeEventDetails): void => {
    if (details.reason === 'input-change') virtuosoRef.current?.scrollToIndex(0);
    setInputValue(next);
  };

  return (
    <Combobox.Root<SelectValue, boolean>
      items={values}
      itemToStringLabel={labelOf}
      filter={filter}
      multiple={multiple}
      value={value as SelectValue | SelectValue[] | null}
      onValueChange={(next) => setValue(next as SelectCurrentValue)}
      inputValue={inputValue}
      onInputValueChange={handleInputValueChange}
      open={open}
      onOpenChange={handleOpenChange}
      virtualized={search.virtualized}
      onItemHighlighted={handleItemHighlighted}
      name={name}
      form={form}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
    >
      <SelectShell
        engine={props}
        wrapperRef={wrapperRef}
        Wrapper={Combobox.InputGroup}
        pressIsInside
        onClear={() => setInputValue('')}
        label={hasContent(label) ? <SearchLabel engine={props} wrapperRef={wrapperRef} /> : null}
        field={<SearchField engine={props} labelOf={labelOf} />}
        trailing={hasContent(icon) ? <SearchToggle engine={props} /> : null}
        liveRegion={<SearchStatus loading={loading} loadingText={loadingText} emptyText={emptyText} open={open} />}
        popup={
          <SearchPopup
            engine={props}
            wrapperRef={wrapperRef}
            values={values}
            virtuosoRef={virtuosoRef}
            pointerHighlight={pointerHighlight}
          />
        }
      />
    </Combobox.Root>
  );
}
