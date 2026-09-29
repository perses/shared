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
import { cloneElement, forwardRef } from 'react';
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

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'color' | 'onClick'> {
  /** Content displayed in the Chip. `children` is used when `label` is omitted. */
  label?: ReactNode;
  children?: ReactNode;
  color?: ChipColor;
  status?: ChipStatus;
  size?: ChipSize;
  variant?: ChipVariant;
  /** Optional element used for the root, such as a router link. */
  component?: ElementType;
  /** Makes the Chip a native link when no custom component is provided. */
  href?: string;
  target?: string;
  clickable?: boolean;
  disabled?: boolean;
  skipFocusWhenDisabled?: boolean;
  icon?: ReactElement;
  /** Alias for `icon`, provided for MUI Chip migration compatibility. */
  avatar?: ReactElement;
  onClick?: MouseEventHandler<HTMLElement>;
  deleteIcon?: ReactElement;
  /** Alias for `deleteIcon`, matching the PatternFly Label API. */
  closeBtn?: ReactElement<CloseButtonElementProps>;
  deleteAriaLabel?: string;
  /** Alias for `deleteAriaLabel`, matching the PatternFly Label API. */
  closeBtnAriaLabel?: string;
  closeBtnProps?: ChipCloseButtonProps;
  onDelete?: MouseEventHandler<HTMLElement>;
  /** Maximum width for the label before it is visually truncated. */
  textMaxWidth?: CSSProperties['maxWidth'];
}

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
  const content = label ?? children;
  const isInteractive = Boolean(onClick || href);
  const isClickable = clickable || isInteractive;
  const Component = component ?? (href ? 'a' : 'div');
  const usesSeparateAction = isInteractive && Boolean(onDelete);
  const RootComponent = usesSeparateAction ? 'div' : Component;
  const ActionComponent = component ?? (href ? 'a' : 'button');
  const resolvedStyle = textMaxWidth ? ({ ...style, '--chip-label-max-width': textMaxWidth } as CSSProperties) : style;
  const resolvedTabIndex = disabled && skipFocusWhenDisabled ? -1 : (tabIndex ?? (isInteractive ? 0 : undefined));

  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || !onClick || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    event.currentTarget.click();
  };

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

  if (usesSeparateAction) {
    return (
      <RootComponent
        {...rest}
        ref={ref}
        data-color={color}
        data-status={status}
        data-size={size}
        data-variant={variant}
        data-clickable={isClickable || undefined}
        data-disabled={disabled || undefined}
        style={resolvedStyle}
        className={clsx('ps-Chip', className)}
      >
        <ActionComponent
          href={href}
          target={target}
          aria-disabled={disabled || undefined}
          tabIndex={resolvedTabIndex}
          onClick={handleClick}
          onKeyDown={onKeyDown}
          className="ps-Chip__action"
        >
          {chipContent}
        </ActionComponent>
        {deleteControl}
      </RootComponent>
    );
  }

  return (
    <RootComponent
      {...rest}
      ref={ref}
      href={href}
      target={target}
      role={role ?? (onClick && !href ? 'button' : undefined)}
      tabIndex={resolvedTabIndex}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-color={color}
      data-status={status}
      data-size={size}
      data-variant={variant}
      data-clickable={isClickable || undefined}
      data-disabled={disabled || undefined}
      style={resolvedStyle}
      className={clsx('ps-Chip', className)}
    >
      {chipContent}
      {onDelete && deleteControl}
    </RootComponent>
  );
});
