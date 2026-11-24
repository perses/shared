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
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { hasContent } from '../hasContent';
import { applyStyleProps, compileStyleProps, spacingProps } from '../system';
import type { SpacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';

const DRAWER_HEADER_STYLE_PROPS = compileStyleProps([spacingProps]);

export interface DrawerHeaderSlotProps {
  /** The `<h2>` title; grows to fill the row. */
  title?: SlotStyleProps;
  /** Wrapper around `endElement`; rendered only when `endElement` resolves to visible content. */
  end?: SlotStyleProps;
}

export interface DrawerHeaderProps extends HTMLAttributes<HTMLDivElement>, SpacingProps {
  /** Trailing slot, typically actions such as Apply / Cancel; rendered after the title. */
  endElement?: ReactNode;
  style?: PersesCSSProperties;
  /** Styling-only overrides for internal parts; does not replace content, behavior, or accessibility attributes. */
  slotProps?: DrawerHeaderSlotProps;
}

/**
 * Title row of a `Drawer`. `children` renders inside an `<h2>` that also labels the dialog for assistive
 * technology, so the visible title and the accessible name cannot drift apart. Must be rendered inside `Drawer`.
 *
 * @example
 * <DrawerHeader endElement={<Button variant="outline" onClick={cancel}>Cancel</Button>}>Edit variables</DrawerHeader>
 */
export const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(function DrawerHeader(
  { endElement, className, style, slotProps, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, DRAWER_HEADER_STYLE_PROPS, style);

  return (
    <div {...rest} ref={ref} className={clsx('ps-DrawerHeader', styleClassName, className)} style={computedStyle}>
      <BaseDrawer.Title
        className={clsx('ps-DrawerHeader__title', slotProps?.title?.className)}
        style={slotProps?.title?.style}
      >
        {children}
      </BaseDrawer.Title>
      {hasContent(endElement) && (
        <div className={clsx('ps-DrawerHeader__end', slotProps?.end?.className)} style={slotProps?.end?.style}>
          {endElement}
        </div>
      )}
    </div>
  );
});
