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

import { useCallback } from 'react';
import type { MouseEvent, MouseEventHandler, ReactElement, ReactNode } from 'react';

import { CloseIcon } from '../Icon/icons';

interface ChipCloseButtonProps {
  children: ReactNode;
  closeIcon?: ReactElement;
  closeAriaLabel?: string;
  disabled: boolean;
  onClose: MouseEventHandler<HTMLButtonElement>;
}

const defaultCloseIcon = <CloseIcon aria-hidden="true" />;

function getCloseAriaLabel(children: ReactNode): string {
  return typeof children === 'string' || typeof children === 'number' ? `Remove ${children}` : 'Remove';
}

export function ChipCloseButton({
  children,
  closeIcon = defaultCloseIcon,
  closeAriaLabel,
  disabled,
  onClose,
}: ChipCloseButtonProps): ReactElement {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (disabled) return;
      onClose(event);
    },
    [disabled, onClose],
  );

  return (
    <button
      type="button"
      className="ps-Chip__close"
      aria-label={closeAriaLabel ?? getCloseAriaLabel(children)}
      disabled={disabled}
      onClick={handleClick}
    >
      {closeIcon}
    </button>
  );
}
