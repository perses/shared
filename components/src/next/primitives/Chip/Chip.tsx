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
import { cloneElement, forwardRef, useCallback } from 'react';
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ElementType,
  HTMLAttributes,
  KeyboardEventHandler,
  MouseEvent as ReactMouseEvent,
  MouseEventHandler,
  ReactElement,
  ReactNode,
} from 'react';

import type { ColorVariant, Size, Status } from '../types';

// oxlint-disable-next-line import/no-unassigned-import -- CSS is loaded for this component's visual contract.
import './chip.css';

export type ChipColor = 'default' | ColorVariant;
export type ChipStatus = Status;
export type ChipSize = Exclude<Size, 'lg'>;
export type ChipVariant = 'filled' | 'outlined';
export type ChipCloseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  [key: `data-${string}`]: string | undefined;
};
type CloseButtonElementProps = {
  'aria-label'?: string;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
};

interface ChipBaseProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'color' | 'onClick'> {
  label?: ReactNode;
  children?: ReactNode;
  color?: ChipColor;
  status?: ChipStatus;
  size?: ChipSize;
  variant?: ChipVariant;
  component?: ElementType;
  href?: string;
  target?: string;
  clickable?: boolean;
  disabled?: boolean;
  skipFocusWhenDisabled?: boolean;
  icon?: ReactElement;
  avatar?: ReactElement;
  deleteIcon?: ReactElement;
  closeBtn?: ReactElement<CloseButtonElementProps>;
  deleteAriaLabel?: string;
  closeBtnAriaLabel?: string;
  closeBtnProps?: ChipCloseButtonProps;
  textMaxWidth?: CSSProperties['maxWidth'];
}

export type ChipProps = ChipBaseProps &
  (
    | { onClick?: MouseEventHandler<HTMLElement>; onDelete?: never }
    | { onClick?: never; onDelete?: MouseEventHandler<HTMLElement> }
  );

const defaultDeleteIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function getLabelText(label: ReactNode): string {
  return typeof label === 'string' || typeof label === 'number' ? String(label) : 'label';
}

export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(
  {
    label,
    children,
    color = 'default',
    status,
    size = 'sm',
    variant = 'filled',
    icon,
    avatar,
    deleteIcon = defaultDeleteIcon,
    closeBtn,
    deleteAriaLabel,
    closeBtnAriaLabel,
    closeBtnProps,
    onDelete,
    component,
    href,
    target,
    clickable,
    disabled = false,
    skipFocusWhenDisabled = false,
    onClick,
    onKeyDown,
    role,
    tabIndex,
    textMaxWidth,
    style,
    className,
    ...rest
  },
  ref,
): ReactElement {
  if (onClick && onDelete) {
    throw new Error('Chip accepts either onClick or onDelete, but not both.');
  }

  const content = label ?? children;
  const isInteractive = Boolean(onClick || href);
  const isClickable = clickable || isInteractive;
  const Component = component ?? (href ? 'a' : 'div');
  const usesSeparateAction = Boolean(href && onDelete);
  const labelMaxWidth = typeof textMaxWidth === 'number' ? `${textMaxWidth}px` : textMaxWidth;
  const resolvedStyle: (CSSProperties & { '--chip-label-max-width'?: string }) | undefined =
    textMaxWidth !== undefined ? { ...style, '--chip-label-max-width': labelMaxWidth } : style;
  const resolvedTabIndex = disabled && skipFocusWhenDisabled ? -1 : (tabIndex ?? (isInteractive ? 0 : undefined));
  const visualProps = {
    'data-color': color,
    'data-status': status,
    'data-size': size,
    'data-variant': variant,
    'data-clickable': isClickable || undefined,
    'data-disabled': disabled || undefined,
    style: resolvedStyle,
    className: clsx('ps-Chip', className),
  };

  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLElement>>(
    (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || !onClick || (event.key !== 'Enter' && event.key !== ' ')) return;

      event.preventDefault();
      event.currentTarget.click();
    },
    [disabled, onClick, onKeyDown],
  );

  const { className: closeButtonClassName, onClick: closeButtonOnClick, ...restCloseButtonProps } = closeBtnProps ?? {};

  const handleDelete: MouseEventHandler<HTMLElement> = (event) => {
    event.stopPropagation();
    if (disabled) return;

    closeButtonOnClick?.(event as ReactMouseEvent<HTMLButtonElement>);
    closeBtn?.props.onClick?.(event);
    if (!event.defaultPrevented) onDelete?.(event);
  };

  const closeButtonAriaLabel = closeBtnAriaLabel ?? deleteAriaLabel ?? `Remove ${getLabelText(content)}`;
  const deleteControl = closeBtn ? (
    cloneElement(closeBtn, {
      ...restCloseButtonProps,
      className: clsx('ps-Chip__delete', closeBtn.props.className, closeButtonClassName),
      'aria-label': closeButtonAriaLabel,
      disabled,
      onClick: handleDelete,
    })
  ) : (
    <button
      {...restCloseButtonProps}
      type="button"
      className={clsx('ps-Chip__delete', closeButtonClassName)}
      aria-label={closeButtonAriaLabel}
      disabled={disabled}
      onClick={handleDelete}
    >
      {deleteIcon}
    </button>
  );

  const chipContent = (
    <>
      {(avatar ?? icon) && <span className="ps-Chip__icon">{avatar ?? icon}</span>}
      <span className="ps-Chip__label">{content}</span>
    </>
  );

  const mainElement = (
    <Component
      {...rest}
      {...(usesSeparateAction ? undefined : visualProps)}
      ref={ref}
      href={href}
      target={target}
      role={role ?? (onClick && !href ? 'button' : undefined)}
      tabIndex={resolvedTabIndex}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={usesSeparateAction ? 'ps-Chip__action' : visualProps.className}
    >
      {chipContent}
      {!usesSeparateAction && onDelete && deleteControl}
    </Component>
  );

  return usesSeparateAction ? (
    <div {...visualProps}>
      {mainElement}
      {deleteControl}
    </div>
  ) : (
    mainElement
  );
});
