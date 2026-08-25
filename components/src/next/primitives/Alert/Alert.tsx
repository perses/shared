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
import { ComponentType, forwardRef, HTMLAttributes, ReactElement, ReactNode, SVGProps, useContext } from 'react';

import { ComponentsContext } from '../../contexts/ComponentsContext';
import type { PersesIcons } from '../../contexts/ComponentsContext';
import { Icon } from '../Icon/Icon';
import { SuccessIcon, InfoIcon, WarningIcon, ErrorIcon } from '../Icon/icons';

import './alert.css';

export type AlertSeverity = 'error' | 'warning' | 'success' | 'info';

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
  /**
   * No icon by default. Pass a severity key (e.g. `"error"`) to use the matching built-in icon —
   * respecting any `ComponentsProvider` icon overrides — or a custom `ReactElement` to render your own.
   *
   * Deliberately typed as `ReactElement` rather than `ReactNode`: `ReactNode` includes `string`
   * (both directly and structurally, since `string` satisfies `Iterable<ReactNode>`), which would
   * let a misspelled severity key silently render as literal text instead of failing to compile.
   *
   * @example
   * <Alert severity="error" icon="error">Something went wrong</Alert>
   * <Alert severity="error" icon={<MyIcon />}>Something went wrong</Alert>
   */
  icon?: AlertSeverity | ReactElement | number | boolean | null;
}

/**
 * DOM structure: `.ps-Alert > .ps-Alert__icon? + .ps-Alert__message`
 * `.ps-Alert__icon` is only rendered when `icon` resolves to a non-empty value.
 * Consumers should target `.ps-Alert__message` for content styling.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { severity = 'info', role = 'alert', className, icon, children, ...rest },
  ref,
) {
  const classes = clsx('ps-Alert', className);
  const ctx = useContext(ComponentsContext);

  let resolvedIcon: ReactNode;

  if (isAlertSeverity(icon)) {
    const { key, icon: DefaultIcon } = SEVERITY_ICONS[icon];
    const IconComponent = ctx?.icons[key] ?? DefaultIcon;
    resolvedIcon = <IconComponent />;
  } else {
    resolvedIcon = icon;
  }

  return (
    <div role={role} {...rest} ref={ref} className={classes} data-severity={severity}>
      {Boolean(resolvedIcon) && <Icon className="ps-Alert__icon">{resolvedIcon}</Icon>}
      <div className="ps-Alert__message">{children}</div>
    </div>
  );
});
