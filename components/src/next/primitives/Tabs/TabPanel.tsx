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

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

import type { PersesCSSProperties } from '../../types';
import { applyStyleProps, compileStyleProps, displayProps, radiusProps, sizingProps, spacingProps } from '../system';
import type { DisplayProps, RadiusProps, SizingProps, SpacingProps } from '../system';
import type { TabsValue } from './Tabs';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the tabs styles.
import './tabs.css';

const TAB_PANEL_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps, radiusProps]);

export interface TabPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'style'>, SpacingProps, SizingProps, DisplayProps, RadiusProps {
  style?: PersesCSSProperties;
  /** Matches the `Tab` that shows this panel. */
  value: TabsValue;
  /** Keep the panel in the DOM (as `hidden`) while another tab is active. Defaults to `false`. */
  keepMounted?: boolean;
}

/** Content for one tab; unmounted while inactive unless `keepMounted`. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, keepMounted = false, className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, TAB_PANEL_STYLE_PROPS, style);

  return (
    <BaseTabs.Panel
      {...rest}
      ref={ref}
      value={value}
      keepMounted={keepMounted}
      className={clsx('ps-TabPanel', styleClassName, className)}
      style={computedStyle}
    >
      {children}
    </BaseTabs.Panel>
  );
});
