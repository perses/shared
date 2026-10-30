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
import {
  applyStyleProps,
  compileStyleProps,
  displayProps,
  radiusProps,
  sizingProps,
  spacingProps,
  useResponsiveValue,
} from '../system';
import type { DisplayProps, RadiusProps, Responsive, SizingProps, SpacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the tabs styles.
import './tabs.css';

const TABS_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps, radiusProps]);

/** Identifier shared by a `Tab` and its `TabPanel`. */
export type TabsValue = string | number;
export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabsProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'style'>,
    SpacingProps,
    SizingProps,
    DisplayProps,
    RadiusProps {
  style?: PersesCSSProperties;
  /** Controlled active tab. */
  value?: TabsValue;
  /** Initial active tab when uncontrolled. Defaults to the first tab. */
  defaultValue?: TabsValue;
  onValueChange?: (value: TabsValue, eventDetails: BaseTabs.Root.ChangeEventDetails) => void;
  /**
   * Layout axis; also selects the arrow keys that move focus. Accepts a responsive object resolved in JS
   * so `data-orientation` and keyboard handling always agree. Defaults to `horizontal`.
   */
  orientation?: Responsive<TabsOrientation>;
}

/**
 * Root of a tab set. Compose a `TabList` of `Tab`s followed by one `TabPanel` per value.
 *
 * @example
 * <Tabs defaultValue="overview" orientation={{ default: 'horizontal', md: 'vertical' }}>
 *   <TabList aria-label="Project">
 *     <Tab value="overview">Overview</Tab>
 *     <Tab value="dashboards" render={<Link to="dashboards" />}>Dashboards</Tab>
 *   </TabList>
 *   <TabPanel value="overview">…</TabPanel>
 *   <TabPanel value="dashboards">…</TabPanel>
 * </Tabs>
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value, defaultValue, onValueChange, orientation = 'horizontal', className, style, children, ...props },
  ref,
) {
  const resolvedOrientation = useResponsiveValue(orientation);
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, TABS_STYLE_PROPS, style);

  return (
    <BaseTabs.Root
      {...rest}
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      orientation={resolvedOrientation}
      className={clsx('ps-Tabs', styleClassName, className)}
      style={computedStyle}
    >
      {children}
    </BaseTabs.Root>
  );
});
