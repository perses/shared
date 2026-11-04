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

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { clsx } from 'clsx';
import { forwardRef, useCallback } from 'react';
import type { HTMLAttributes } from 'react';

import type { CheckboxChangeEventDetails, CheckboxProps } from '../Checkbox';
import { CheckboxMark, CheckboxVisual } from '../Checkbox/CheckboxVisual';
import { applyStyleProps } from '../system';
import { MENU_ITEM_BASE_CLASS, MENU_ITEM_STYLE_PROPS, MenuItemContent } from './menuItemShared';
import type { MenuItemBaseProps } from './menuItemShared';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the menu styles.
import './menu.css';

export interface MenuCheckboxItemProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'onChange' | 'color'>,
    Omit<MenuItemBaseProps, 'selected' | 'closeOnClick'>,
    Pick<CheckboxProps, 'variant'> {
  checked?: boolean;
  defaultChecked?: boolean;
  readonly?: boolean;
  onCheckedChange?: (checked: boolean, details: CheckboxChangeEventDetails) => void;
  /** Close the menu when the item is toggled. Defaults to `false` so several options can be toggled in a row. */
  closeOnClick?: boolean;
}

/**
 * A toggle row inside a `Menu` (`role="menuitemcheckbox"`, `aria-checked`). The row is the only interactive
 * element; the leading box shares the standalone `Checkbox` presentation without rendering another control or
 * registering with an enclosing field. It uses the same checkbox tokens and CSS classes, not the provider's `Checkbox`.
 * `variant` (`subtle`, `solid`, `outline`) styles only the indicator and defaults to `subtle`.
 * `color` matches the standalone Checkbox palette and styles only the indicator;
 * it defaults to `default` independently of other items.
 *
 * @example
 * <MenuCheckboxItem checked={visible.has('id')} onCheckedChange={(on) => toggle('id', on)}>
 *   ID
 * </MenuCheckboxItem>
 */
export const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(function MenuCheckboxItem(
  {
    checked,
    defaultChecked,
    onCheckedChange,
    closeOnClick = false,
    disabled = false,
    readonly = false,
    size = 'sm',
    variant = 'subtle',
    color = 'default',
    startElement,
    endElement,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, MENU_ITEM_STYLE_PROPS, style);

  const handleCheckedChange = useCallback(
    (nextChecked: boolean, eventDetails: BaseMenu.CheckboxItem.ChangeEventDetails): void => {
      onCheckedChange?.(nextChecked, { event: eventDetails.event });
    },
    [onCheckedChange],
  );

  return (
    <BaseMenu.CheckboxItem
      {...rest}
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      closeOnClick={closeOnClick}
      className={clsx(MENU_ITEM_BASE_CLASS, 'ps-MenuCheckboxItem', styleClassName, className)}
      style={computedStyle}
      data-size={size}
      data-color={color}
    >
      <BaseMenu.CheckboxItemIndicator
        keepMounted
        className="ps-MenuCheckboxItem__indicator"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            <CheckboxVisual
              decorative
              aria-hidden
              data-checked={state.checked ? '' : undefined}
              data-unchecked={state.checked ? undefined : ''}
              data-disabled={disabled ? '' : undefined}
              data-readonly={readonly ? '' : undefined}
              data-size={size}
              data-color={color}
              data-variant={variant}
            >
              {state.checked && (
                <span className="ps-Checkbox__indicator">
                  <CheckboxMark />
                </span>
              )}
            </CheckboxVisual>
          </span>
        )}
      />
      <MenuItemContent startElement={startElement} endElement={endElement}>
        {children}
      </MenuItemContent>
    </BaseMenu.CheckboxItem>
  );
});
