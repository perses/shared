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

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { clsx } from 'clsx';
import { forwardRef, useCallback, useState } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { applyStyleProps, compileStyleProps, radiusProps, spacingProps } from '../system';
import type { RadiusProps, SpacingProps } from '../system';
import { TabListScrollButtons } from './TabListScrollButtons';
import type { TabStyle } from './Tabs';
import { useTabsDirection } from './useTabsDirection';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the tabs styles.
import './tabs.css';

const TAB_LIST_STYLE_PROPS = compileStyleProps([spacingProps, radiusProps]);

export type TabListVariant = 'standard' | 'fullWidth';

export interface TabListSlotProps {
  /**
   * Active underline or side bar. Hidden outside `line`; set `style.display` to `block` to opt in.
   */
  indicator?: SlotStyleProps;
  /** Both scroll buttons rendered by `scrollButtons`. */
  scrollButton?: SlotStyleProps;
}

/** A tab list must have an accessible name: `aria-label` or `aria-labelledby`. */
export type TabListAccessibleName = { 'aria-label': string } | { 'aria-labelledby': string };

export type TabListProps = TabListBaseProps & TabListAccessibleName;

interface TabListBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'aria-label' | 'aria-labelledby'>, SpacingProps, RadiusProps {
  style?: PersesCSSProperties<TabStyle>;
  /**
   * Sizing: `standard` (default) uses natural widths; `fullWidth` shares space evenly.
   * All lists scroll on overflow.
   */
  variant?: TabListVariant;
  /**
   * Show provider-resolved `IconButton`s at overflowing edges. Defaults to `false`.
   */
  scrollButtons?: boolean;
  /** Icon for backward scrolling. Defaults to a start-facing chevron, or an up chevron when vertical. */
  scrollBackIcon?: ReactElement;
  /** Icon for forward scrolling. Defaults to an end-facing chevron, or a down chevron when vertical. */
  scrollForwardIcon?: ReactElement;
  /** Activate on focus instead of Enter/Space. Defaults to `false`. */
  activateOnFocus?: boolean;
  /** Styling-only overrides for internal parts. */
  slotProps?: TabListSlotProps;
}

/** Tab strip and indicator. Requires `aria-label` or `aria-labelledby`. */
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

  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const direction = useTabsDirection(listElement, props.dir);
  const setListRef = useCallback(
    (node: HTMLDivElement | null) => {
      setListElement(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <DirectionProvider direction={direction}>
      <BaseTabs.List
        {...rest}
        ref={setListRef}
        activateOnFocus={activateOnFocus}
        className={clsx('ps-TabList', styleClassName, className)}
        style={computedStyle}
        data-variant={variant}
      >
        <div className="ps-TabList__tabs">{children}</div>
        {scrollButtons && (
          <TabListScrollButtons
            list={listElement}
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
    </DirectionProvider>
  );
});
