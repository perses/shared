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
import type { HTMLAttributes } from 'react';

import { applyStyleProps } from '../system';
import { MENU_ITEM_STYLE_PROPS, MenuItemContent } from './menuItemShared';
import type { MenuItemBaseProps } from './menuItemShared';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the menu styles.
import './menu.css';

export interface MenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'>, MenuItemBaseProps {}

/**
 * An action row inside a `Menu` (`role="menuitem"`). Activating it calls `onClick` and closes the menu
 * unless `closeOnClick={false}`. Keyboard navigation, typeahead, and highlighting come from Base UI
 * (`data-highlighted`, `data-disabled`).
 *
 * @example
 * <MenuItem startElement={<CopyIcon />} onClick={copy}>Copy</MenuItem>
 * <MenuItem selected={unit === 'bytes'} onClick={() => setUnit('bytes')}>Bytes</MenuItem>
 */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { selected, size = 'md', startElement, endElement, className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, MENU_ITEM_STYLE_PROPS, style);

  return (
    <BaseMenu.Item
      {...rest}
      ref={ref}
      className={clsx('ps-MenuItem', styleClassName, className)}
      style={computedStyle}
      data-selected={selected ? '' : undefined}
      data-size={size}
    >
      <MenuItemContent startElement={startElement} endElement={endElement}>
        {children}
      </MenuItemContent>
    </BaseMenu.Item>
  );
});
