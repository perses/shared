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

import clsx from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';

// oxlint-disable-next-line import/no-unassigned-import -- CSS is loaded for this component's visual contract.
import './chip.css';

export type ChipColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type ChipSize = 'small' | 'medium';
export type ChipVariant = 'filled' | 'outlined';

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  color?: ChipColor;
  size?: ChipSize;
  variant?: ChipVariant;
  onDelete?: () => void;
}

export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(
  { label, color = 'default', size = 'small', variant = 'filled', onDelete, className, ...rest },
  ref,
): ReactElement {
  return (
    <div
      {...rest}
      ref={ref}
      data-color={color}
      data-size={size}
      data-variant={variant}
      className={clsx('ps-Chip', className)}
    >
      <span className="ps-Chip__label">{label}</span>
      {onDelete && (
        <button type="button" className="ps-Chip__delete" aria-label={`Remove ${label}`} onClick={onDelete}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
});
