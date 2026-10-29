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

import type { ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { compileStyleProps, displayProps, radiusProps, spacingProps } from '../system';
import type { DisplayProps, RadiusProps, SpacingProps } from '../system';
import type { Size } from '../types';

export type MenuItemSize = Extract<Size, 'sm' | 'md'>;

/** Class shared by every menu item kind so `menu.css` styles them once. */
export const MENU_ITEM_BASE_CLASS = 'ps-MenuItemBase';

/** Props shared by every menu item kind (`MenuItem`, `MenuLinkItem`, `MenuCheckboxItem`). */
export interface MenuItemBaseProps extends SpacingProps, DisplayProps, RadiusProps {
  style?: PersesCSSProperties;
  /** Prevents activation and highlighting; sets `data-disabled`. */
  disabled?: boolean;
  /** Marks the current choice visually (`data-selected`). Has no ARIA meaning. */
  selected?: boolean;
  /** Row height and padding. Defaults to `md`. */
  size?: MenuItemSize;
  /** Close the menu when the item is activated. Defaults to `true`. */
  closeOnClick?: boolean;
  /** Text used for typeahead when `children` is not plain text. */
  label?: string;
  /** Leading content, typically an icon. */
  startElement?: ReactNode;
  /** Trailing content, typically a shortcut hint or secondary action. */
  endElement?: ReactNode;
}

export const MENU_ITEM_STYLE_PROPS = compileStyleProps([spacingProps, displayProps, radiusProps]);

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && typeof node !== 'boolean';
}

/** Renders the shared start / content / end layout of a menu item. */
export function MenuItemContent({
  startElement,
  endElement,
  children,
}: Pick<MenuItemBaseProps, 'startElement' | 'endElement'> & { children?: ReactNode }): ReactElement {
  return (
    <>
      {hasContent(startElement) && <span className="ps-MenuItemBase__start">{startElement}</span>}
      <span className="ps-MenuItemBase__content">{children}</span>
      {hasContent(endElement) && <span className="ps-MenuItemBase__end">{endElement}</span>}
    </>
  );
}
