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
import type { ReactElement, ReactNode } from 'react';

import './tooltip.css';

/** Mirrors --perses-spacing-sm (8px). */
const SIDE_OFFSET = 8;

export interface TooltipProps {
  title: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({ title, children, placement = 'top', delay = 400, className }: TooltipProps): ReactElement {
  if (title === '' || title === null || title === undefined) {
    return children;
  }

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={placement} sideOffset={SIDE_OFFSET}>
          <BaseTooltip.Popup className={clsx('ps-Tooltip', className)}>
            <BaseTooltip.Arrow className="ps-Tooltip__arrow" />
            {title}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
