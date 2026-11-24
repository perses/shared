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

import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { clsx } from 'clsx';
import { forwardRef, useContext } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { ThemeModeContext } from '../../contexts/ThemeModeProvider';
import type { PersesCSSProperties } from '../../types';
import { applyStyleProps, compileStyleProps, sizingProps } from '../system';
import type { SizingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the drawer styles.
import './drawer.css';

// Only sizing: the popup fixes its own padding-free flex column and `overflow: hidden` for the rounded edge.
const DRAWER_STYLE_PROPS = compileStyleProps([sizingProps]);

export type DrawerAnchor = 'left' | 'right';

/** A drawer is a dialog and must have an accessible name: `aria-label` or `aria-labelledby`. */
export type DrawerAccessibleName = { 'aria-label': string } | { 'aria-labelledby': string };

export type DrawerProps = DrawerBaseProps & DrawerAccessibleName;

/**
 * Style props, `className`, `style`, extra props and `ref` apply to the popup (`role="dialog"`).
 * The popup portals to document.body and propagates the nearest ThemeModeProvider mode.
 */
interface DrawerBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-label' | 'aria-labelledby'>, SizingProps {
  style?: PersesCSSProperties;
  children?: ReactNode;
  /** Whether the drawer is shown. The drawer is always controlled. */
  open: boolean;
  /**
   * Called when the user asks to close (Escape, backdrop click, swipe). The drawer stays open until the
   * consumer sets `open` to false, so a form can show a "discard changes?" confirmation first.
   */
  onClose: () => void;
  /** Called once the close transition has finished and the popup has unmounted. */
  onExited?: () => void;
  /** Screen edge the drawer slides in from; a physical edge that does not flip in RTL. Defaults to `right`. */
  anchor?: DrawerAnchor;
}

/**
 * A modal side panel for editing flows. Compose `DrawerHeader` and `DrawerContent` inside it, or supply your
 * own header; the popup is a full-height flex column.
 *
 * @example
 * <Drawer open={open} onClose={() => setConfirming(true)} aria-label="Edit panel">
 *   <DrawerHeader endElement={<Button onClick={save}>Apply</Button>}>Edit panel</DrawerHeader>
 *   <DrawerContent>{form}</DrawerContent>
 * </Drawer>
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  { children, open, onClose, onExited, anchor = 'right', className, style, ...props },
  ref,
) {
  const mode = useContext(ThemeModeContext);
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, DRAWER_STYLE_PROPS, style);

  return (
    <BaseDrawer.Root
      open={open}
      onOpenChange={() => onClose()}
      onOpenChangeComplete={(next) => {
        if (!next) onExited?.();
      }}
      swipeDirection={anchor}
    >
      <BaseDrawer.Portal data-perses-mode={mode}>
        <BaseDrawer.Backdrop className="ps-Drawer__backdrop" />
        <BaseDrawer.Viewport className="ps-Drawer__viewport">
          <BaseDrawer.Popup
            {...rest}
            ref={ref}
            className={clsx('ps-Drawer', styleClassName, className)}
            style={computedStyle}
            data-anchor={anchor}
          >
            {children}
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  );
});
