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
import { forwardRef, useCallback } from 'react';
import type { ComponentType, HTMLAttributes, MouseEvent, ReactElement, ReactNode, SVGProps } from 'react';

import type { PersesIcons } from '../../contexts/ComponentsContext';
import { useComponents } from '../../contexts/ComponentsProvider';
import { Icon } from '../Icon/Icon';
import { CloseIcon, SuccessIcon, InfoIcon, WarningIcon, ErrorIcon } from '../Icon/icons';
import { isResponsiveValue, responsiveVariantClassNames } from '../system/responsive';
import type { Responsive } from '../system/responsive';
import type { Size, Status } from '../types';

import './alert.css';

export type { Breakpoint, Responsive, ResponsiveObject } from '../system/responsive';

export type AlertSeverity = Status;
export type AlertVariant = 'soft' | 'outline' | 'plain';
export type AlertSize = Extract<Size, 'sm' | 'md'>;

const DEFAULT_SIZE: AlertSize = 'md';

const DEFAULT_CLOSE_ICON = <CloseIcon />;

const SEVERITY_ICONS: Record<AlertSeverity, { key: keyof PersesIcons; icon: ComponentType<SVGProps<SVGSVGElement>> }> =
  {
    success: { key: 'Success', icon: SuccessIcon },
    info: { key: 'Info', icon: InfoIcon },
    warning: { key: 'Warning', icon: WarningIcon },
    error: { key: 'Error', icon: ErrorIcon },
  };

function isAlertSeverity(icon: unknown): icon is AlertSeverity {
  return typeof icon === 'string' && icon in SEVERITY_ICONS;
}

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  severity?: AlertSeverity;
  icon?: AlertSeverity | ReactElement | number | boolean | null;
  variant?: AlertVariant;
  size?: Responsive<AlertSize>;
  action?: ReactNode;
  onClose?: (event: MouseEvent<HTMLButtonElement>) => void;
  closeLabel?: string;
  closeIcon?: ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    severity = 'info',
    variant = 'soft',
    size = DEFAULT_SIZE,
    role = 'alert',
    className,
    icon,
    action,
    onClose,
    closeLabel = 'Close',
    closeIcon = DEFAULT_CLOSE_ICON,
    children,
    ...rest
  },
  ref,
) {
  const isResponsiveSize = isResponsiveValue(size);
  const classes = clsx(
    'ps-Alert',
    isResponsiveSize && responsiveVariantClassNames('ps-Alert--size', { default: DEFAULT_SIZE, ...size }),
    className,
  );
  const {
    components: { Button },
    icons,
  } = useComponents();
  const hasAction = Boolean(action) || Boolean(onClose);

  const handleClose = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onClose?.(event);
    },
    [onClose],
  );

  let resolvedIcon: ReactNode;

  if (isAlertSeverity(icon)) {
    const { key, icon: DefaultIcon } = SEVERITY_ICONS[icon];
    const IconComponent = icons[key] ?? DefaultIcon;
    resolvedIcon = <IconComponent />;
  } else {
    resolvedIcon = icon;
  }

  return (
    <div
      role={role}
      {...rest}
      ref={ref}
      className={classes}
      data-severity={severity}
      data-variant={variant}
      data-size={isResponsiveSize ? undefined : size}
    >
      {Boolean(resolvedIcon) && <Icon className="ps-Alert__icon">{resolvedIcon}</Icon>}
      <div className="ps-Alert__message">{children}</div>
      {hasAction && (
        <div className="ps-Alert__action">
          {action}
          {onClose && (
            <Button
              className="ps-Alert__close"
              variant="ghost"
              color={severity}
              size="sm"
              aria-label={closeLabel}
              onClick={handleClose}
            >
              <Icon>{closeIcon}</Icon>
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
