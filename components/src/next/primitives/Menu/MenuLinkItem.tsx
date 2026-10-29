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
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactElement } from 'react';

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

export interface MenuLinkItemProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'style'>, Omit<MenuItemBaseProps, 'disabled'> {
  /**
   * Element to render instead of the default `<a>`, for router links.
   * Base UI merges the menu item props (role, keyboard handling, highlight) onto it.
   */
  render?: ReactElement;
}

/**
 * A navigation row inside a `Menu` (`<a role="menuitem">`). Use it instead of `MenuItem` whenever activation
 * changes the URL, so the browser gets a real link (middle-click, copy address, new tab). Anchors cannot be
 * disabled, so there is no `disabled` prop — omit the item instead.
 *
 * @example
 * <MenuLinkItem href="/docs" target="_blank" rel="noopener">Documentation</MenuLinkItem>
 * <MenuLinkItem render={<Link to="/profile" />} startElement={<UserIcon />}>Profile</MenuLinkItem>
 */
export const MenuLinkItem = forwardRef<HTMLAnchorElement, MenuLinkItemProps>(function MenuLinkItem(
  { selected, size = 'md', closeOnClick = true, startElement, endElement, className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, MENU_ITEM_STYLE_PROPS, style);

  return (
    <BaseMenu.LinkItem
      {...rest}
      ref={ref}
      closeOnClick={closeOnClick}
      className={clsx(MENU_ITEM_BASE_CLASS, 'ps-MenuLinkItem', styleClassName, className)}
      style={computedStyle}
      data-selected={selected ? '' : undefined}
      data-size={size}
    >
      <MenuItemContent startElement={startElement} endElement={endElement}>
        {children}
      </MenuItemContent>
    </BaseMenu.LinkItem>
  );
});
