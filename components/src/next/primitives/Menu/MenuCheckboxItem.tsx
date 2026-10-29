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
import { forwardRef, useCallback, useId } from 'react';
import type { HTMLAttributes } from 'react';

import { useComponents } from '../../contexts/ComponentsProvider';
import type { CheckboxChangeEventDetails } from '../Checkbox';
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
    Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'onChange'>,
    Omit<MenuItemBaseProps, 'selected' | 'closeOnClick'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean, details: CheckboxChangeEventDetails) => void;
  /** Close the menu when the item is toggled. Defaults to `false` so several options can be toggled in a row. */
  closeOnClick?: boolean;
}

/**
 * A toggle row inside a `Menu` (`role="menuitemcheckbox"`, `aria-checked`). The row is the only interactive
 * element; the leading box is the `Checkbox` from `useComponents()` rendered as a non-interactive indicator so
 * it matches the standalone control. Requires a `ComponentsProvider`.
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
    size = 'md',
    startElement,
    endElement,
    id: idProp,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const {
    components: { Checkbox },
  } = useComponents();
  const fallbackId = useId();
  const id = idProp === undefined ? fallbackId : idProp;
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
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      closeOnClick={closeOnClick}
      className={clsx(MENU_ITEM_BASE_CLASS, 'ps-MenuCheckboxItem', styleClassName, className)}
      style={computedStyle}
      data-size={size}
    >
      <BaseMenu.CheckboxItemIndicator
        keepMounted
        className="ps-MenuCheckboxItem__indicator"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            <Checkbox
              checked={state.checked}
              disabled={disabled}
              size={size}
              readOnly
              tabIndex={-1}
              aria-hidden
              aria-labelledby={id}
            />
          </span>
        )}
      />
      <MenuItemContent startElement={startElement} endElement={endElement}>
        {children}
      </MenuItemContent>
    </BaseMenu.CheckboxItem>
  );
});
