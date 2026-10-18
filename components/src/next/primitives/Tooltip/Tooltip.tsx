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
import clsx from 'clsx';
import { cloneElement, forwardRef, useId, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import './tooltip.css';

/** Mirrors --perses-spacing-sm (8px). */
const SIDE_OFFSET = 8;

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip wraps a trigger and renders a popup, so it deliberately does not accept the shared style props
 * (spacing, sizing, display); style the trigger directly. Extra props and `ref` are applied to the popup.
 */
export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /**
   * Popup content. It supplements, and should not replace, the trigger's accessible name.
   * `''`, `false`, `null`, or `undefined` disables the tooltip and renders only the trigger,
   * so conditional titles like `title={cond && 'text'}` work.
   */
  title: ReactNode;
  /** The trigger. It must be a single element that can receive a ref and focus (e.g. a button or link). */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  placement?: TooltipPlacement;
  /** Hover delay in milliseconds before the popup opens. Defaults to 400. */
  delay?: number;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { title, children, placement = 'top', delay = 400, className, ...rest },
  ref,
) {
  const popupId = useId();
  const [open, setOpen] = useState(false);

  if (title === '' || title === false || title === null || title === undefined) {
    return children;
  }

  // Base UI does not link the trigger to the popup, so expose the tooltip as the trigger's description while open.
  const existing = children.props['aria-describedby'];
  const describedBy = existing ? `${existing} ${popupId}` : popupId;

  return (
    <BaseTooltip.Root onOpenChange={setOpen}>
      <BaseTooltip.Trigger
        delay={delay}
        render={open ? cloneElement(children, { 'aria-describedby': describedBy }) : children}
      />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={placement} sideOffset={SIDE_OFFSET}>
          <BaseTooltip.Popup
            role="tooltip"
            {...rest}
            id={rest.id ?? popupId}
            ref={ref}
            className={clsx('ps-Tooltip', className)}
          >
            <BaseTooltip.Arrow className="ps-Tooltip__arrow" />
            {title}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
});
