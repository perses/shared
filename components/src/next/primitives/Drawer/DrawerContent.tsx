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
import type { HTMLAttributes } from 'react';

import type { PersesCSSProperties } from '../../types';
import { applyStyleProps, compileStyleProps, sizingProps, spacingProps } from '../system';
import type { SizingProps, SpacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';

const DRAWER_CONTENT_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps]);

export interface DrawerContentProps extends HTMLAttributes<HTMLDivElement>, SpacingProps, SizingProps {
  style?: PersesCSSProperties;
}

/**
 * Padded, scrollable body of a `Drawer`. Fills the space below the header; long content scrolls here while
 * the header stays put. Use `p="0"` for edge-to-edge content. Mouse and pen drags inside it select text or
 * interact with content instead of swiping the drawer closed. Must be rendered inside `Drawer`.
 *
 * @example
 * <DrawerContent>{form}</DrawerContent>
 */
export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(
  { className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, DRAWER_CONTENT_STYLE_PROPS, style);

  return (
    <BaseDrawer.Content
      {...rest}
      ref={ref}
      className={clsx('ps-DrawerContent', styleClassName, className)}
      style={computedStyle}
    >
      {children}
    </BaseDrawer.Content>
  );
});
