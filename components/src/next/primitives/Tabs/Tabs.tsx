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
import { forwardRef, useCallback, useRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';

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
import type { ColorVariant, Status } from '../types';
import { TabsVariantContext } from './TabsVariantContext';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the tabs styles.
import './tabs.css';

const TABS_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, displayProps, radiusProps]);
// Base UI 1.x falls back to the first enabled tab (reason 'missing') when an explicit `defaultValue`
// matches no tab; its own implicit default is value 0. This unmatched sentinel opts into the fallback.
const IMPLICIT_DEFAULT_VALUE = Symbol('implicit-default-tab');

/** Identifier shared by a `Tab` and its `TabPanel`. */
export type TabsValue = string | number;
export type TabsOrientation = 'horizontal' | 'vertical';
/** Appearance, independent of `TabList` sizing. */
export type TabsVariant = 'line' | 'subtle' | 'enclosed' | 'outline' | 'plain';

/** Tab properties that also inherit from `Tabs` and `TabList`. */
export interface TabStyle extends CSSProperties {
  /** Tab height; defaults to `--perses-control-size-lg`. */
  '--perses-tab-min-height'?: string;
}

export interface TabsProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'defaultValue' | 'style'>,
    SpacingProps,
    SizingProps,
    DisplayProps,
    RadiusProps {
  style?: PersesCSSProperties<TabStyle>;
  /**
   * Appearance only; defaults to `line`. For `plain`, supply a visible active cue through
   * `data-active` CSS or `TabList`'s indicator slot.
   */
  variant?: TabsVariant;
  /** Selected-state palette, overridable by individual tabs. Defaults to `primary`. */
  color?: ColorVariant | Status;
  /** Controlled active tab; `null` means no tab is active. */
  value?: TabsValue | null;
  /** Uncontrolled selection; defaults to the first enabled tab. `null` starts unselected. */
  defaultValue?: TabsValue | null;
  /**
   * Receives `null` when the active tab is removed and no enabled tab can take its place. When `value`
   * and `defaultValue` are omitted, also called after mount with reason `'initial'` for the first
   * enabled tab, since no tab is selected on the first render.
   */
  onValueChange?: (value: TabsValue | null, eventDetails: BaseTabs.Root.ChangeEventDetails) => void;
  /**
   * Layout and navigation axis; accepts responsive values. Defaults to `horizontal`.
   */
  orientation?: Responsive<TabsOrientation>;
  /** Reading and navigation direction; inherits from the DOM when omitted. */
  dir?: HTMLAttributes<HTMLDivElement>['dir'];
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
  {
    value,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    variant = 'line',
    color = 'primary',
    dir,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const resolvedOrientation = useResponsiveValue(orientation, 'horizontal');
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, TABS_STYLE_PROPS, style);
  const initialSelectionPending = useRef(value === undefined && defaultValue === undefined);
  const handleValueChange = useCallback(
    (nextValue: TabsValue | null, eventDetails: BaseTabs.Root.ChangeEventDetails): void => {
      if (initialSelectionPending.current) {
        initialSelectionPending.current = false;
        // Preserve initial-selection semantics despite the sentinel.
        eventDetails.reason = eventDetails.reason === 'missing' ? 'initial' : eventDetails.reason;
      }
      onValueChange?.(nextValue, eventDetails);
    },
    [onValueChange],
  );

  return (
    <BaseTabs.Root
      {...rest}
      ref={ref}
      dir={dir}
      value={value}
      defaultValue={defaultValue === undefined ? IMPLICIT_DEFAULT_VALUE : defaultValue}
      onValueChange={handleValueChange}
      orientation={resolvedOrientation}
      data-variant={variant}
      data-color={color}
      className={clsx('ps-Tabs', styleClassName, className)}
      style={computedStyle}
    >
      <TabsVariantContext.Provider value={variant}>{children}</TabsVariantContext.Provider>
    </BaseTabs.Root>
  );
});
