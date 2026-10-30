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
import type { HTMLAttributes, ReactElement } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { applyStyleProps, compileStyleProps, displayProps, radiusProps, spacingProps } from '../system';
import type { DisplayProps, RadiusProps, SpacingProps } from '../system';
import { TabListScrollButtons } from './TabListScrollButtons';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the tabs styles.
import './tabs.css';

const TAB_LIST_STYLE_PROPS = compileStyleProps([spacingProps, displayProps, radiusProps]);

export type TabListVariant = 'standard' | 'scrollable' | 'fullWidth';

export interface TabListSlotProps {
  /** The bar that slides under (or beside) the active tab. */
  indicator?: SlotStyleProps;
  /** Both scroll buttons rendered by `scrollButtons`. */
  scrollButton?: SlotStyleProps;
}

export interface TabListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'style'>, SpacingProps, DisplayProps, RadiusProps {
  style?: PersesCSSProperties;
  /** Overflow behaviour: `scrollable` scrolls along the axis, `fullWidth` stretches tabs evenly. Defaults to `standard`. */
  variant?: TabListVariant;
  /**
   * Show scroll buttons at the list edges while a `scrollable` list overflows. Uses `IconButton` from
   * `ComponentsProvider`. Defaults to `false`.
   */
  scrollButtons?: boolean;
  /** Icon for the backward scroll button. Defaults to a left chevron, rotated when vertical. */
  scrollBackIcon?: ReactElement;
  /** Icon for the forward scroll button. Defaults to a right chevron, rotated when vertical. */
  scrollForwardIcon?: ReactElement;
  /** Activate a tab as soon as it receives focus instead of on Enter/Space. Defaults to `false`. */
  activateOnFocus?: boolean;
  /** Styling-only overrides for internal parts. */
  slotProps?: TabListSlotProps;
}

/**
 * The `role="tablist"` strip holding `Tab`s plus the active indicator. Give it an `aria-label` describing the set.
 */
export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(
  {
    variant = 'standard',
    scrollButtons = false,
    scrollBackIcon,
    scrollForwardIcon,
    activateOnFocus = false,
    slotProps,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, TAB_LIST_STYLE_PROPS, style);
  const listRef = useRef<HTMLDivElement | null>(null);
  const setListRef = useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <BaseTabs.List
      {...rest}
      ref={setListRef}
      activateOnFocus={activateOnFocus}
      className={clsx('ps-TabList', styleClassName, className)}
      style={computedStyle}
      data-variant={variant}
    >
      {children}
      {scrollButtons && variant === 'scrollable' && (
        <TabListScrollButtons
          listRef={listRef}
          slotProps={slotProps?.scrollButton}
          backIcon={scrollBackIcon}
          forwardIcon={scrollForwardIcon}
        />
      )}
      <BaseTabs.Indicator
        className={clsx('ps-TabList__indicator', slotProps?.indicator?.className)}
        style={slotProps?.indicator?.style}
      />
    </BaseTabs.List>
  );
});
