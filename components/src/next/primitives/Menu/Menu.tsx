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
import type { MenuPositionerProps, MenuRootProps } from '@base-ui/react/menu';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { applyStyleProps, compileStyleProps, radiusProps, sizingProps, spacingProps } from '../system';
import type { RadiusProps, SizingProps, SpacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the menu styles.
import './menu.css';

const SIDE_OFFSET = 4;
const MENU_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, radiusProps]);

export type MenuPlacement = 'top' | 'bottom' | 'left' | 'right';
export type MenuAlign = 'start' | 'center' | 'end';

export interface MenuSlotProps {
  /** Positioning wrapper around the popup; owns `z-index`. */
  positioner?: SlotStyleProps;
}

/**
 * Style props, `className`, `style`, extra props and `ref` apply to the popup (`role="menu"`).
 * The popup portals to document.body; ancestor-scoped themes and token overrides do not propagate to it.
 */
export interface MenuProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, SpacingProps, SizingProps, RadiusProps {
  style?: PersesCSSProperties;
  /**
   * Element that opens the menu, e.g. an `IconButton`. It must render a native button and accept a ref.
   * Omit it when the menu is controlled and positioned with `anchor`.
   */
  trigger?: ReactElement;
  /** Menu items. Compose `Divider` between groups. */
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: MenuRootProps['onOpenChange'];
  /** Side of the trigger the popup opens on. Defaults to `bottom`. */
  placement?: MenuPlacement;
  /** Alignment of the popup along the trigger. Defaults to `start`. */
  align?: MenuAlign;
  /** Distance from the trigger in pixels, or Base UI's sideOffset function. Defaults to 4. */
  offset?: MenuPositionerProps['sideOffset'];
  /** Positions the popup relative to an element or virtual element instead of the trigger (context menus). */
  anchor?: MenuPositionerProps['anchor'];
  /** Keep the popup in the DOM while closed. Defaults to false. */
  keepMounted?: boolean;
  /** Lock page scroll and outside pointer interaction while open. Defaults to false. */
  modal?: boolean;
  /** Styling-only overrides for internal parts. */
  slotProps?: MenuSlotProps;
}

/**
 * An action menu opened from a trigger. Items are `MenuItem`, `MenuLinkItem`, or `MenuCheckboxItem`;
 * use `Select` instead when the user picks a value for a form field.
 *
 * @example
 * <Menu trigger={<IconButton aria-label="More actions"><MoreIcon /></IconButton>}>
 *   <MenuItem startElement={<EditIcon />} onClick={edit}>Edit</MenuItem>
 *   <MenuLinkItem href="/docs" target="_blank">Documentation</MenuLinkItem>
 *   <Divider />
 *   <MenuItem onClick={remove}>Delete</MenuItem>
 * </Menu>
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  {
    trigger,
    children,
    open,
    defaultOpen,
    onOpenChange,
    placement = 'bottom',
    align = 'start',
    offset = SIDE_OFFSET,
    anchor,
    keepMounted = false,
    modal = false,
    slotProps,
    className,
    style,
    ...props
  },
  ref,
) {
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, MENU_STYLE_PROPS, style);
  /**
   * `aria-labelledby` beats `aria-label` in the accessible-name algorithm and Base UI always sets it to the
   * trigger id, so a consumer `aria-label` only wins if that default is cleared (unless they also pass their own).
   */
  const labelProps = rest['aria-label'] ? { 'aria-labelledby': rest['aria-labelledby'] } : undefined;

  return (
    <BaseMenu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      {trigger && <BaseMenu.Trigger render={trigger} />}
      <BaseMenu.Portal keepMounted={keepMounted}>
        <BaseMenu.Positioner
          className={clsx('ps-Menu__positioner', slotProps?.positioner?.className)}
          style={slotProps?.positioner?.style}
          side={placement}
          align={align}
          sideOffset={offset}
          anchor={anchor}
        >
          <BaseMenu.Popup
            {...rest}
            {...labelProps}
            ref={ref}
            className={clsx('ps-Menu', styleClassName, className)}
            style={computedStyle}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
});
