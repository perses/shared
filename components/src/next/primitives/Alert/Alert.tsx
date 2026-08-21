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
import { ComponentType, forwardRef, HTMLAttributes, ReactNode, SVGProps, useContext } from 'react';

import { ComponentsContext } from '../../contexts/ComponentsContext';
import type { PersesIcons } from '../../contexts/ComponentsContext';
import { SuccessIcon, InfoIcon, WarningIcon, ErrorIcon } from '../../icons';
import { Icon } from '../Icon/Icon';

import './alert.css';

export type AlertSeverity = 'error' | 'warning' | 'success' | 'info';

const DEFAULT_SEVERITY_ICONS: Record<AlertSeverity, ComponentType<SVGProps<SVGSVGElement>>> = {
  success: SuccessIcon,
  info: InfoIcon,
  warning: WarningIcon,
  error: ErrorIcon,
};

const SEVERITY_TO_PROVIDER_KEY: Record<AlertSeverity, keyof PersesIcons> = {
  error: 'Error',
  warning: 'Warning',
  success: 'Success',
  info: 'Info',
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  severity?: AlertSeverity;
  icon?: ReactNode;
}

/**
 * DOM structure: `.ps-Alert > .ps-Alert__icon + .ps-Alert__message`
 * Consumers should target `.ps-Alert__message` for content styling.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { severity = 'info', role = 'alert', className, icon, children, ...rest },
  ref,
) {
  const classes = clsx('ps-Alert', className);
  const ctx = useContext(ComponentsContext);

  let resolvedIcon: ReactNode;

  if (icon !== undefined) {
    // Caller provided an explicit icon (or null to suppress it)
    resolvedIcon = icon;
  } else {
    // Check if a ComponentsProvider is supplying a custom icon for this severity
    const providerKey = SEVERITY_TO_PROVIDER_KEY[severity];
    const providerIcon = ctx?.icons[providerKey];

    // Fall back to the built-in default if no provider icon exists
    const IconComponent = providerIcon ?? DEFAULT_SEVERITY_ICONS[severity];
    resolvedIcon = IconComponent ? <IconComponent /> : null;
  }

  return (
    <div role={role} {...rest} ref={ref} className={classes} data-severity={severity}>
      {resolvedIcon !== null && <Icon className="ps-Alert__icon">{resolvedIcon}</Icon>}
      <div className="ps-Alert__message">{children}</div>
    </div>
  );
});
