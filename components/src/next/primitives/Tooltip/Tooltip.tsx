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

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { TooltipPositionerProps } from '@base-ui/react/tooltip';
import { clsx } from 'clsx';
import { cloneElement, forwardRef, useId, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { applyStyleProps, compileStyleProps, radiusProps } from '../system';
import type { RadiusProps } from '../system';

import '../system/radius.css';
import './tooltip.css';

/** Mirrors --perses-spacing-sm (8px). */
const SIDE_OFFSET = 8;

// Base UI caches arrow measurements, so hidden arrows must stay mounted and measurable for live toggles.
const HIDDEN_ARROW_STYLE: CSSProperties = { visibility: 'hidden' };
const TOOLTIP_STYLE_PROPS = compileStyleProps([radiusProps]);

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip wraps a trigger and renders a popup. Supports radius props, but not shared spacing, sizing, or display
 * props. Extra props and `ref` apply to the popup.
 * The popup portals to document.body; ancestor-scoped themes and token overrides do not propagate to it.
 */
export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'>, RadiusProps {
  style?: PersesCSSProperties;
  /**
   * Popup content. It supplements, and should not replace, the trigger's accessible name.
   * `''`, `false`, `null`, or `undefined` disables the tooltip and renders only the trigger,
   * so conditional titles like `title={cond && 'text'}` work.
   */
  title: ReactNode;
  /** The trigger. It must be a single element that can receive a ref and focus (e.g. a button or link). */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  placement?: TooltipPlacement;
  /**
   * Distance from the trigger in pixels. Also accepts Base UI's sideOffset function, receiving the side,
   * alignment, and anchor/positioner dimensions. Defaults to 8.
   */
  offset?: TooltipPositionerProps['sideOffset'];
  /** Hide the decorative arrow. Defaults to false. */
  hideArrow?: boolean;
  /** Hover delay in milliseconds before the popup opens. Defaults to 400. */
  delay?: number;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    title,
    children,
    placement = 'top',
    offset = SIDE_OFFSET,
    delay = 400,
    hideArrow = false,
    id,
    className,
    style,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const popupId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, TOOLTIP_STYLE_PROPS, style);

  const disabled = title === '' || title === false || title === null || title === undefined;

  // Base UI does not link the trigger to the popup, so expose the tooltip as the trigger's description while open.
  const existing = children.props['aria-describedby'];
  const describedBy = existing ? `${existing} ${popupId}` : popupId;

  return (
    <BaseTooltip.Root disabled={disabled} onOpenChange={setOpen}>
      <BaseTooltip.Trigger
        delay={delay}
        render={open && !disabled ? cloneElement(children, { 'aria-describedby': describedBy }) : children}
      />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className="ps-Tooltip__positioner" side={placement} sideOffset={offset}>
          <BaseTooltip.Popup
            role="tooltip"
            {...rest}
            id={popupId}
            ref={ref}
            className={clsx('ps-Tooltip', styleClassName, className)}
            style={computedStyle}
          >
            <BaseTooltip.Arrow className="ps-Tooltip__arrow" style={hideArrow ? HIDDEN_ARROW_STYLE : undefined} />
            {title}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
});
