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
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { MouseEvent, ReactElement, ReactNode, Ref } from 'react';

import { hasContent } from '../hasContent';
import { SelectChips } from './SelectChips';
import { SelectEngineContext, SelectVisibleValuesContext } from './SelectEngineContext';
import type { SelectValue } from './SelectItem';
import { SelectShell } from './SelectShell';
import type { SelectEngineProps } from './SelectShell';
import { isEmptySelection, isMultipleValue, optionKey } from './selectValue';
import type { SelectCurrentValue } from './selectValue';
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

/** The input-trigger engine: a Base UI `Combobox` whose value, open and typed-text state are owned by `Select`. */
export function SearchEngine(props: SelectEngineProps): ReactElement {
  const {
    forwardedRef,
    focusableProps,
    label,
    labelId,
    placeholder,
    icon,
    size,
    required,
    readOnly,
    disabled,
    name,
    form,
    multiple,
    chips,
    loading,
    loadingText,
    emptyText,
    listHeader,
    value,
    setValue,
    open,
    setOpen,
    options,
    optionsByValue,
    optionNodes,
    renderValue,
    placement,
    align,
    offset,
    themeMode,
    slotProps,
    search,
  } = props;
  const controlRef = useRef<HTMLDivElement | null>(null);
  const values = useMemo(() => options.map((option) => option.value), [options]);
  const selectedValues = isMultipleValue(value) ? value : [];
  const labelOf = (selected: SelectValue): string => optionsByValue.get(selected)?.label ?? String(selected);
  const selectedLabel = !multiple && !isEmptySelection(value) ? labelOf(value as SelectValue) : '';
  // In single mode a closed list shows the selected label (see the resync below), so `defaultInputValue` only applies
  // when the list starts open. Starting from the label avoids a resync, and an `onInputValueChange` call, on mount.
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
  const { filter } = search;
  const baseFilter = useMemo(() => {
    if (!filter) return filter;
    return (selected: SelectValue, query: string): boolean => {
      const option = optionsByValue.get(selected);
      return option ? filter({ value: option.value, label: option.label, disabled: option.disabled }, query) : false;
    };
  }, [filter, optionsByValue]);

  const hasLabel = hasContent(label);
  const showsValueText = multiple && !chips && !isEmptySelection(value);
  const focusInput = (): void => {
    controlRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
  };
  const handleLabelClick = (event: MouseEvent<HTMLLabelElement>): void => {
    // A native label click would click the input, and the input opens the list on click.
    event.preventDefault();
    focusInput();
  };

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

  return (
    <SelectEngineContext.Provider value="search">
      <Combobox.Root<SelectValue, boolean>
        items={values}
        itemToStringLabel={labelOf}
        filter={baseFilter}
        multiple={multiple}
        value={value as SelectValue | SelectValue[] | null}
        onValueChange={(next) => setValue(next as SelectCurrentValue)}
        inputValue={inputValue}
        onInputValueChange={(next) => setInputValue(next)}
        open={open}
        onOpenChange={(next, details) => {
          // The list stays open while several items are picked, so the typed filter survives each selection.
          if (!next && multiple && details.reason === 'item-press') {
            details.cancel();
            return;
          }
          setOpen(next);
        }}
        name={name}
        form={form}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
      >
        <SelectShell
          engine={props}
          controlRef={controlRef}
          Control={Combobox.InputGroup}
          pressIsInside
          onClear={() => setInputValue('')}
          label={
            hasLabel ? (
              <Field.Label
                id={labelId}
                className={clsx('ps-Select__label', slotProps?.label?.className)}
                style={slotProps?.label?.style}
                onClick={handleLabelClick}
              >
                {label}
              </Field.Label>
            ) : null
          }
          field={
            <>
              {showsValueText && (
                <span className="ps-Select__value">
                  {renderValue ? renderValue(value) : selectedValues.map(labelOf).join(', ')}
                </span>
              )}
              {chips ? <SelectChips engine={props}>{input}</SelectChips> : input}
            </>
          }
          trailing={
            hasContent(icon) ? (
              <Combobox.Trigger
                className="ps-Select__toggle"
                tabIndex={-1}
                aria-labelledby={hasLabel ? labelId : focusableProps['aria-labelledby']}
                aria-label={hasLabel ? undefined : focusableProps['aria-label']}
              >
                {icon}
              </Combobox.Trigger>
            ) : null
          }
          status={<SearchStatus loading={loading} loadingText={loadingText} emptyText={emptyText} open={open} />}
          popup={
            <Combobox.Portal>
              <Combobox.Positioner
                className="ps-Select__positioner"
                data-perses-mode={themeMode}
                anchor={controlRef}
                side={placement}
                align={align}
                sideOffset={offset}
              >
                <Combobox.Popup
                  className={clsx('ps-Select__popup', slotProps?.popup?.className)}
                  style={slotProps?.popup?.style}
                  data-size={size}
                >
                  {hasContent(listHeader) && <div className="ps-Select__list-header">{listHeader}</div>}
                  {/* `SearchStatus` is the one live region; Empty's own `role="status"` would announce twice. */}
                  <Combobox.Empty className="ps-Select__empty" role="presentation" aria-live="off">
                    {loading ? loadingText : emptyText}
                  </Combobox.Empty>
                  <Combobox.List
                    className={clsx('ps-Select__list', slotProps?.list?.className)}
                    style={slotProps?.list?.style}
                  >
                    <VisibleValues values={values}>{optionNodes}</VisibleValues>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          }
        />
      </Combobox.Root>
    </SelectEngineContext.Provider>
  );
}
