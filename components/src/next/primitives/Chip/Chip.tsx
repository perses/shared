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
import { forwardRef, useCallback, useMemo } from 'react';
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactElement,
  ReactNode,
} from 'react';

import { CloseIcon } from '../Icon/icons/CloseIcon';
import type { ColorVariant, Size, Status, Variant } from '../types';

// oxlint-disable-next-line import/no-unassigned-import -- CSS is loaded for this component's visual contract.
import './chip.css';

export type ChipColor = 'default' | ColorVariant;
export type ChipSize = Exclude<Size, 'lg'>;
export type ChipVariant = Exclude<Variant, 'ghost'>;

export interface ChipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  color?: ChipColor;
  status?: Status;
  size?: ChipSize;
  variant?: ChipVariant;
  clickable?: boolean;
  disabled?: boolean;
  startElement?: ReactNode;
  closeIcon?: ReactElement;
  closeAriaLabel?: string;
  onClose?: MouseEventHandler<HTMLButtonElement>;
  maxWidth?: CSSProperties['maxWidth'];
}

const defaultCloseIcon = <CloseIcon aria-hidden="true" />;

function getCloseAriaLabel(children: ReactNode): string {
  return typeof children === 'string' || typeof children === 'number' ? `Remove ${children}` : 'Remove';
}

/**
 * A compact element that represents an input, attribute, or action.
 *
 * Content is provided through `children`. Use `startElement` for a leading
 * icon or avatar, and `onClose` to render a close button. `onClick` and
 * `onClose` can be combined.
 *
 * @example Basic chip
 * ```tsx
 * <Chip color="secondary">environment: production</Chip>
 * ```
 *
 * @example Removable chip with a leading icon
 * ```tsx
 * <Chip startElement={<TagIcon />} onClose={() => removeFilter(id)}>
 *   region: us-east-1
 * </Chip>
 * ```
 */
export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(
  {
    children,
    color = 'default',
    status,
    size = 'sm',
    variant = 'solid',
    startElement,
    closeIcon = defaultCloseIcon,
    closeAriaLabel,
    onClose,
    clickable,
    disabled = false,
    onClick,
    onKeyDown,
    role,
    tabIndex,
    maxWidth,
    style,
    className,
    ...rest
  },
  ref,
): ReactElement {
  const resolvedStyle: (CSSProperties & { '--chip-label-max-width'?: string }) | undefined = useMemo(() => {
    if (maxWidth === undefined) return style;
    return { ...style, '--chip-label-max-width': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth };
  }, [maxWidth, style]);

  const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    },
    [disabled, onClick],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    (event) => {
      onKeyDown?.(event);
      if (
        event.defaultPrevented ||
        event.target !== event.currentTarget ||
        disabled ||
        !onClick ||
        (event.key !== 'Enter' && event.key !== ' ')
      ) {
        return;
      }

      event.preventDefault();
      event.currentTarget.click();
    },
    [disabled, onClick, onKeyDown],
  );

  const handleClose = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (event) => {
      event.stopPropagation();
      if (disabled) return;
      onClose?.(event);
    },
    [disabled, onClose],
  );

  const interactionProps = useMemo(
    () => ({
      role: role ?? (onClick ? 'button' : undefined),
      tabIndex: tabIndex ?? (onClick ? 0 : undefined),
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    }),
    [handleClick, handleKeyDown, onClick, role, tabIndex],
  );

  return (
    <div
      {...rest}
      {...interactionProps}
      ref={ref}
      className={clsx('ps-Chip', className)}
      style={resolvedStyle}
      data-color={color}
      data-status={status}
      data-size={size}
      data-variant={variant}
      data-clickable={clickable || Boolean(onClick) || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      {startElement && <span className="ps-Chip__start">{startElement}</span>}
      <span className="ps-Chip__label">{children}</span>
      {onClose && (
        <button
          type="button"
          className="ps-Chip__close"
          aria-label={closeAriaLabel ?? getCloseAriaLabel(children)}
          disabled={disabled}
          onClick={handleClose}
        >
          {closeIcon}
        </button>
      )}
    </div>
  );
});
