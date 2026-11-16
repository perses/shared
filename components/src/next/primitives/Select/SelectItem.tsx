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
import { Select as BaseSelect } from '@base-ui/react/select';
import { clsx } from 'clsx';
import { forwardRef, useContext, useEffect } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { hasContent } from '../hasContent';
import { CheckIcon, Icon } from '../Icon';
import type { SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, spacingProps } from '../system';
import { optionKey } from './selectValue';
import { isFilteredOut, SelectVisibleValuesContext } from './SelectVisibleValuesContext';

// oxlint-disable-next-line import/no-unassigned-import -- Registers shared spacing utility styles used by style props.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers this component's styles.
import './select.css';

/** The `value` of a `SelectItem`, and therefore what `Select` reports as selected. Numbers are not turned into strings. */
export type SelectValue = string | number;

const SELECT_ITEM_STYLE_PROPS = compileStyleProps([spacingProps]);
const checkIcon = <CheckIcon />;
const renderIndicator = <Icon />;

export interface SelectItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'>, SpacingProps {
  style?: PersesCSSProperties;
  value: SelectValue;
  /**
   * Prevents selection by pointer, keyboard and typeahead. The item stays in the list and keyboard users can still
   * arrow onto it, so a screen reader announces why it is unavailable instead of the option silently vanishing.
   */
  disabled?: boolean;
  /**
   * Plain text used for typeahead, search matching, chip remove labels, and the field text when `children` is not
   * plain text (for example an icon next to text). Defaults to `children` when they are text, else `String(value)`.
   * It is read from the `SelectItem` elements in `Select`'s `children`; an item returned by a custom component is not
   * seen there and falls back to `String(value)` for chips.
   */
  label?: string;
  /** Content before the item text, typically an icon. Mark purely decorative icons `aria-hidden`. */
  startElement?: ReactNode;
}

/**
 * One option inside a `Select`. Its `children` are also shown in the trigger when selected. Spacing props
 * (`p`, `m`, …) pad or offset the option row; values can be tokens, pixel numbers, CSS lengths or responsive objects.
 *
 * With `searchable`, `Select` finds the options by reading `SelectItem` elements in its `children` (or the `items`
 * prop). An item rendered through a wrapper component (`<MyOption />`) cannot be read: it stays in the list, is not
 * filtered by the typed text, and `Select` warns once. Render `SelectItem` directly or pass `items` instead.
 */
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { value, disabled, label, startElement, className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, SELECT_ITEM_STYLE_PROPS, style);
  // Set only inside the search engine's list.
  const visibility = useContext(SelectVisibleValuesContext);
  const isUnknown = visibility !== null && !visibility.known.has(optionKey(value));
  const reportUnknown = visibility?.reportUnknown;
  useEffect(() => {
    if (isUnknown) reportUnknown?.();
  }, [isUnknown, reportUnknown]);

  if (visibility) {
    // The search engine owns filtering: a value it knows about and the search excluded renders nothing. A value it
    // cannot see (an item behind a wrapper component) is never filtered.
    if (isFilteredOut(visibility, value)) return null;
    return (
      <Combobox.Item
        {...rest}
        ref={ref}
        value={value}
        disabled={disabled}
        className={clsx('ps-SelectItem', styleClassName, className)}
        style={computedStyle}
      >
        {hasContent(startElement) && <span className="ps-SelectItem__start">{startElement}</span>}
        <span className="ps-SelectItem__text">{children}</span>
        <Combobox.ItemIndicator className="ps-SelectItem__indicator" render={renderIndicator} keepMounted>
          {checkIcon}
        </Combobox.ItemIndicator>
      </Combobox.Item>
    );
  }

  return (
    <BaseSelect.Item
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      label={label}
      className={clsx('ps-SelectItem', styleClassName, className)}
      style={computedStyle}
    >
      {hasContent(startElement) && <span className="ps-SelectItem__start">{startElement}</span>}
      <BaseSelect.ItemText className="ps-SelectItem__text">{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="ps-SelectItem__indicator" render={renderIndicator} keepMounted>
        {checkIcon}
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
});
