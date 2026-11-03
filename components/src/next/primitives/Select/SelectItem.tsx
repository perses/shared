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
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { CheckIcon, Icon } from '../Icon';
import type { SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, spacingProps } from '../system';

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
  disabled?: boolean;
  /** Plain-text label used for typeahead and the hidden form input when `children` is not plain text. */
  label?: string;
  /** Content before the item text, typically an icon. Mark purely decorative icons `aria-hidden`. */
  startElement?: ReactNode;
}

/**
 * One option inside a `Select`. Its `children` are also shown in the trigger when selected. Spacing props
 * (`p`, `m`, …) pad or offset the option row; values can be tokens, pixel numbers, CSS lengths or responsive objects.
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
      {startElement && <span className="ps-SelectItem__start">{startElement}</span>}
      <BaseSelect.ItemText className="ps-SelectItem__text">{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="ps-SelectItem__indicator" render={renderIndicator} keepMounted>
        {checkIcon}
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
});
