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
import { forwardRef, useContext } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { hasContent } from '../hasContent';
import { applyStyleProps, compileStyleProps, radiusProps, sizingProps, spacingProps } from '../system';
import type { RadiusProps, SizingProps, SpacingProps } from '../system';
import type { ColorVariant, Status } from '../types';
import type { TabStyle, TabsValue } from './Tabs';
import { TabsVariantContext } from './TabsVariantContext';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the tabs styles.
import './tabs.css';

const TAB_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, radiusProps]);

export interface TabProps
  extends Omit<HTMLAttributes<HTMLElement>, 'color' | 'style'>, SpacingProps, SizingProps, RadiusProps {
  style?: PersesCSSProperties<TabStyle>;
  /** Selected-state palette. Inherits from `Tabs` when omitted; `default` selects neutral. */
  color?: ColorVariant | Status;
  /** Matches the `TabPanel` this tab controls. */
  value: TabsValue;
  /** Prevents activation but remains arrow-key focusable; sets `data-disabled`. */
  disabled?: boolean;
  /** Leading content, typically an icon. */
  startElement?: ReactNode;
  /** Trailing content, typically a count or help icon. */
  endElement?: ReactNode;
  /**
   * Custom element (e.g. router `Link`) retaining tab semantics and keyboard activation.
   * Forward props and the ref so the indicator can measure the tab.
   */
  render?: ReactElement;
  /**
   * Defaults to `true` for omitted `render` or intrinsic `<button>`, otherwise `false`.
   * Enable for custom buttons to retain `type="button"` and native keyboard behavior; leave off for links.
   */
  nativeButton?: boolean;
}

/**
 * One selectable tab. Its height does not change when `startElement` or `endElement` is present.
 * Its `data-variant` mirrors the enclosing `Tabs` appearance; `TabList`'s `data-variant` is its sizing.
 *
 * @example
 * <Tab value="dashboards" startElement={<DashboardIcon />} endElement={<Chip size="xs">{count}</Chip>}>
 *   Dashboards
 * </Tab>
 */
export const Tab = forwardRef<HTMLElement, TabProps>(function Tab(
  {
    value,
    color,
    disabled = false,
    startElement,
    endElement,
    render,
    nativeButton,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const variant = useContext(TabsVariantContext);
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, TAB_STYLE_PROPS, style);

  return (
    <BaseTabs.Tab
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      render={render}
      nativeButton={nativeButton ?? (render === undefined || render.type === 'button')}
      className={clsx('ps-Tab', styleClassName, className)}
      style={computedStyle}
      data-color={color}
      data-variant={variant}
    >
      {hasContent(startElement) && <span className="ps-Tab__start">{startElement}</span>}
      {hasContent(children) && <span className="ps-Tab__content">{children}</span>}
      {hasContent(endElement) && <span className="ps-Tab__end">{endElement}</span>}
    </BaseTabs.Tab>
  );
});
