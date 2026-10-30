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
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { applyStyleProps, compileStyleProps, radiusProps, sizingProps, spacingProps } from '../system';
import type { RadiusProps, SizingProps, SpacingProps } from '../system';
import type { TabsValue } from './Tabs';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared radius styles.
import '../system/radius.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the tabs styles.
import './tabs.css';

const TAB_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, radiusProps]);

export interface TabStyle extends CSSProperties {
  /** Row height; inherits, so set it once on `Tabs` to size every tab. Defaults to `--perses-control-size-lg`. */
  '--perses-tab-min-height'?: string;
}

export interface TabProps extends Omit<HTMLAttributes<HTMLElement>, 'style'>, SpacingProps, SizingProps, RadiusProps {
  style?: PersesCSSProperties<TabStyle>;
  /** Matches the `TabPanel` this tab controls. */
  value: TabsValue;
  /** Prevents activation and focus; sets `data-disabled`. */
  disabled?: boolean;
  /** Leading content, typically an icon. */
  startElement?: ReactNode;
  /** Trailing content, typically a count or help icon. */
  endElement?: ReactNode;
  /**
   * Render a different element in place of the native `<button>`, e.g. a router `Link`. Base UI keeps
   * `role="tab"` and keyboard activation on it.
   */
  render?: ReactElement;
}

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && typeof node !== 'boolean';
}

/**
 * One selectable tab. Its height does not change when `startElement` or `endElement` is present.
 *
 * @example
 * <Tab value="dashboards" startElement={<DashboardIcon />} endElement={<Chip size="xs">{count}</Chip>}>
 *   Dashboards
 * </Tab>
 */
export const Tab = forwardRef<HTMLElement, TabProps>(function Tab(
  { value, disabled = false, startElement, endElement, render, className, style, children, ...props },
  ref,
) {
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, TAB_STYLE_PROPS, style);

  return (
    <BaseTabs.Tab
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      render={render}
      nativeButton={render === undefined}
      className={clsx('ps-Tab', styleClassName, className)}
      style={computedStyle}
    >
      {hasContent(startElement) && <span className="ps-Tab__start">{startElement}</span>}
      <span className="ps-Tab__content">{children}</span>
      {hasContent(endElement) && <span className="ps-Tab__end">{endElement}</span>}
    </BaseTabs.Tab>
  );
});
