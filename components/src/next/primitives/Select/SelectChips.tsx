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
import { clsx } from 'clsx';
import type { MouseEvent, ReactElement, ReactNode } from 'react';

import type { ChipSize } from '../Chip/Chip';
import { CloseIcon } from '../Icon';
import type { Size } from '../types';
import { focusField } from './SelectShell';
import type { SelectEngineProps } from './SelectShell';
import { isMultipleValue, optionKey } from './selectValue';

// oxlint-disable-next-line import/no-unassigned-import -- Registers the Chip styles that the selected-value chips reuse.
import '../Chip/chip.css';

const closeIcon = <CloseIcon aria-hidden="true" />;

/** Field `xs`/`sm` use `xs` chips and field `md`/`lg` use `sm` chips, so chips stay smaller than the field. */
function chipSize(size: Size): ChipSize {
  return size === 'xs' || size === 'sm' ? 'xs' : 'sm';
}

/**
 * The shell owns a press on the control end to end (focus, toggle), so Base UI's own press handler on the chips
 * container must not open the list a second time.
 */
function keepPressWithShell(event: MouseEvent<HTMLElement> & { preventBaseUIHandler?: () => void }): void {
  event.preventBaseUIHandler?.();
}

export interface SelectChipsProps {
  engine: SelectEngineProps;
  /** Renders Base UI's `Combobox` chip parts (search engine) instead of plain elements (basic engine). */
  isSearch?: boolean;
  /** Rendered after the chips; the search input in searchable mode. */
  children?: ReactNode;
}

/**
 * The selected values as removable chips, followed by a "+N" element for the chips beyond `limitChips`.
 * It reuses the Chip stylesheet and class contract but not the `Chip` component: the remove buttons must stay out of
 * the tab order, which `Chip`'s close button does not allow.
 *
 * In the search engine the parts are Base UI's `Combobox.Chips`, `Chip` and `ChipRemove`, so Backspace and the arrow
 * keys move between the chips and the input, and removal reaches `onValueChange` through Base UI. The container holds
 * `children` (the input), so it renders even while nothing is selected.
 */
export function SelectChips({ engine, isSearch = false, children }: SelectChipsProps): ReactElement {
  const {
    value,
    setValue,
    size,
    disabled,
    readOnly,
    limitChips,
    optionsByValue,
    chipRemoveAriaLabel,
    moreChipsLabel,
    slotProps,
  } = engine;
  const values = isMultipleValue(value) ? value : [];
  const limit = limitChips === undefined ? undefined : Math.max(0, limitChips);
  const hiddenCount = limit === undefined ? 0 : values.length - limit;
  const removable = !disabled && !readOnly;

  const handleRemove = (event: MouseEvent<HTMLButtonElement>, index: number): void => {
    const wrapper = event.currentTarget.closest('.ps-Select__wrapper');
    setValue(values.filter((_, position) => position !== index));
    focusField(wrapper);
  };

  const Container = isSearch ? Combobox.Chips : 'div';
  const Chip = isSearch ? Combobox.Chip : 'div';

  return (
    <Container
      {...(isSearch ? { onMouseDown: keepPressWithShell } : {})}
      className={clsx('ps-Select__chips', slotProps?.chips?.className)}
      style={slotProps?.chips?.style}
    >
      {values.map((chipValue, index) => {
        const option = optionsByValue.get(chipValue);
        const label = option?.label ?? String(chipValue);
        return (
          <Chip
            key={optionKey(chipValue)}
            className="ps-Chip ps-Select__chip"
            data-size={chipSize(size)}
            data-color="default"
            data-variant="solid"
            data-overflow={limit !== undefined && index >= limit ? '' : undefined}
          >
            <span className="ps-Chip__label">{option?.content ?? label}</span>
            {removable &&
              (isSearch ? (
                <Combobox.ChipRemove className="ps-Chip__close" aria-label={chipRemoveAriaLabel(label)}>
                  {closeIcon}
                </Combobox.ChipRemove>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  className="ps-Chip__close"
                  aria-label={chipRemoveAriaLabel(label)}
                  onClick={(event) => handleRemove(event, index)}
                >
                  {closeIcon}
                </button>
              ))}
          </Chip>
        );
      })}
      {hiddenCount > 0 && (
        <span className="ps-Select__more">
          <span aria-hidden="true">+{hiddenCount}</span>
          <span className="ps-Select__visually-hidden">{moreChipsLabel(hiddenCount)}</span>
        </span>
      )}
      {children}
    </Container>
  );
}
