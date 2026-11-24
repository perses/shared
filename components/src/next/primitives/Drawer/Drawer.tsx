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
import { applyStyleProps, compileStyleProps, displayProps, sizingProps, spacingProps } from '../system';
import type { DisplayProps, SizingProps, SpacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the drawer styles.
import './drawer.css';

// Only `overflow` from the display category: `display` stays fixed to flex by the stylesheet.
const DRAWER_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, { overflow: displayProps.overflow }]);

export type DrawerAnchor = 'left' | 'right';

/** A drawer is a dialog and must have an accessible name: `aria-label` or `aria-labelledby`. */
export type DrawerAccessibleName = { 'aria-label': string } | { 'aria-labelledby': string };

export type DrawerProps = DrawerBaseProps & DrawerAccessibleName;

/**
 * Style props, `className`, `style`, extra props and `ref` apply to the popup (`role="dialog"`).
 * The popup portals to document.body and propagates the nearest ThemeModeProvider mode.
 */
interface DrawerBaseProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-label' | 'aria-labelledby'>,
    SpacingProps,
    SizingProps,
    Pick<DisplayProps, 'overflow'> {
  style?: PersesCSSProperties;
  children?: ReactNode;
  /** Whether the drawer is shown. The drawer is always controlled. */
  open: boolean;
  /**
   * Called when the user asks to close (Escape, backdrop click, swipe). The drawer stays open until the
   * consumer sets `open` to false, so a form can show a "discard changes?" confirmation first.
   */
  onOpenChange: (open: boolean) => void;
  /** Called once the close transition has finished and the popup has unmounted. */
  onExited?: () => void;
  /** Screen edge the drawer slides in from. Defaults to `right`. */
  anchor?: DrawerAnchor;
}

/**
 * A modal side panel for editing flows. Content owns its own header and close controls; the popup is a
 * full-height flex column so children can use `flex: 1; overflow-y: auto` for scrollable bodies.
 *
 * @example
 * <Drawer open={open} onOpenChange={() => formRef.current?.requestClose()} aria-labelledby="panel-editor-title">
 *   <PanelEditorForm ref={formRef} titleId="panel-editor-title" onClose={() => setOpen(false)} />
 * </Drawer>
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  { children, open, onOpenChange, onExited, anchor = 'right', className, style, ...props },
  ref,
) {
  const mode = useContext(ThemeModeContext);
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, DRAWER_STYLE_PROPS, style);

  return (
    <BaseDrawer.Root
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      onOpenChangeComplete={(next) => {
        if (!next) onExited?.();
      }}
      swipeDirection={anchor}
    >
      <BaseDrawer.Portal className="ps-Drawer__portal" data-perses-mode={mode}>
        <BaseDrawer.Backdrop className="ps-Drawer__backdrop" />
        <BaseDrawer.Viewport className="ps-Drawer__viewport" data-anchor={anchor}>
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
