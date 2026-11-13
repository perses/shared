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

import { Select as BaseSelect } from '@base-ui/react/select';
import { clsx } from 'clsx';
import { useMemo, useRef } from 'react';
import type { ReactElement, ReactNode, Ref } from 'react';

import { hasContent } from '../hasContent';
import { Icon } from '../Icon';
import { SelectChips } from './SelectChips';
import type { SelectValue } from './SelectItem';
import { SelectShell } from './SelectShell';
import type { SelectEngineProps } from './SelectShell';
import { isEmptySelection, isMultipleValue } from './selectValue';
import type { SelectCurrentValue } from './selectValue';

const renderIcon = <Icon />;

/** The button-trigger engine: a Base UI `Select` whose value and open state are owned by `Select`. */
export function BasicEngine(props: SelectEngineProps): ReactElement {
  const {
    forwardedRef,
    focusableProps,
    label,
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
  } = props;
  const controlRef = useRef<HTMLDivElement | null>(null);
  const baseItems = useMemo(() => options.map((option) => ({ value: option.value, label: option.content })), [options]);
  const values = isMultipleValue(value) ? value : [];
  // The chips sit outside the button, so the trigger keeps the labels for screen readers (they are visually hidden).
  const renderTriggerValue = (current: SelectCurrentValue): ReactNode => {
    if (isEmptySelection(current)) return placeholder;
    const labels = values.map((selected) => optionsByValue.get(selected)?.label ?? String(selected));
    return <span className="ps-Select__visually-hidden">{labels.join(', ')}</span>;
  };

  return (
    <BaseSelect.Root<SelectValue, boolean>
      items={baseItems}
      multiple={multiple}
      value={value as SelectValue | SelectValue[] | null}
      onValueChange={(next) => setValue(next as SelectCurrentValue)}
      name={name}
      form={form}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
      open={open}
      onOpenChange={(next) => setOpen(next)}
      modal={false}
    >
      <SelectShell
        engine={props}
        controlRef={controlRef}
        label={
          hasContent(label) ? (
            <BaseSelect.Label
              className={clsx('ps-Select__label', slotProps?.label?.className)}
              style={slotProps?.label?.style}
            >
              {label}
            </BaseSelect.Label>
          ) : null
        }
        field={
          <>
            {chips && values.length > 0 && <SelectChips engine={props} />}
            <BaseSelect.Trigger
              {...focusableProps}
              ref={forwardedRef as Ref<HTMLButtonElement>}
              className={clsx('ps-Select__trigger', slotProps?.trigger?.className)}
              style={slotProps?.trigger?.style}
            >
              <BaseSelect.Value className="ps-Select__value" placeholder={placeholder}>
                {chips ? renderTriggerValue : renderValue}
              </BaseSelect.Value>
              {hasContent(icon) && (
                <BaseSelect.Icon className="ps-Select__icon" render={renderIcon}>
                  {icon}
                </BaseSelect.Icon>
              )}
            </BaseSelect.Trigger>
          </>
        }
        popup={
          <BaseSelect.Portal>
            <BaseSelect.Positioner
              className="ps-Select__positioner"
              data-perses-mode={themeMode}
              anchor={controlRef}
              side={placement}
              align={align}
              sideOffset={offset}
              alignItemWithTrigger={false}
            >
              <BaseSelect.Popup
                className={clsx('ps-Select__popup', slotProps?.popup?.className)}
                style={slotProps?.popup?.style}
                data-size={size}
              >
                <BaseSelect.List
                  className={clsx('ps-Select__list', slotProps?.list?.className)}
                  style={slotProps?.list?.style}
                >
                  {optionNodes}
                </BaseSelect.List>
              </BaseSelect.Popup>
            </BaseSelect.Positioner>
          </BaseSelect.Portal>
        }
      />
    </BaseSelect.Root>
  );
}
