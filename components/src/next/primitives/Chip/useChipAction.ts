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

import { useCallback, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, KeyboardEventHandler, MouseEvent } from 'react';

interface UseChipActionOptions extends Pick<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown' | 'tabIndex'> {
  actionOnLabel: boolean;
  disabled: boolean;
}

interface ChipAction {
  labelRef: { current: HTMLSpanElement | null };
  actionProps: HTMLAttributes<HTMLElement> | undefined;
  handleKeyDown: KeyboardEventHandler<HTMLElement>;
}

export function useChipAction({
  actionOnLabel,
  disabled,
  onClick,
  onKeyDown,
  tabIndex,
}: UseChipActionOptions): ChipAction {
  const labelRef = useRef<HTMLSpanElement>(null);
  const interactive = Boolean(onClick);

  const handleClick = (event: MouseEvent<HTMLElement>): void => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      const action = actionOnLabel ? labelRef.current : event.currentTarget;
      const onAction = event.target === action;
      // Descendant controls keep their own keyboard behavior when the root is the action.
      if (interactive && !actionOnLabel && !onAction) return;
      onKeyDown?.(event);
      if (!interactive || !action || !onAction || event.defaultPrevented || disabled) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action.click();
      }
    },
    [actionOnLabel, disabled, interactive, onKeyDown],
  );

  const actionProps: HTMLAttributes<HTMLElement> | undefined = interactive
    ? {
        role: 'button',
        tabIndex: tabIndex ?? (disabled ? -1 : 0),
        'aria-disabled': disabled || undefined,
        onClick: handleClick,
      }
    : undefined;

  return { labelRef, actionProps, handleKeyDown };
}
