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

import { CSSProperties, FC, forwardRef, ReactElement, ReactNode, SVGProps, useRef } from 'react';

import { useComponents } from '../../contexts/ComponentsProvider';
import type { AlertProps } from '../../primitives/Alert/Alert';
import { PF_FONT, mergeRefs, useDarkMode } from './utils';

function Pf6CustomIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M28.75 22v3.5c0 .689-.561 1.25-1.25 1.25h-7.521c.005.084.021.166.021.25 0 2.206-1.794 4-4 4s-4-1.794-4-4c0-.084.016-.166.021-.25H4.5c-.689 0-1.25-.561-1.25-1.25V22a.75.75 0 0 1 .75-.75c1.24 0 2.25-1.009 2.25-2.25v-4c0-4.826 3.528-8.833 8.138-9.605A2.482 2.482 0 0 1 13.5 3.5C13.5 2.122 14.621 1 16 1s2.5 1.122 2.5 2.5c0 .761-.349 1.436-.888 1.895 4.61.772 8.138 4.779 8.138 9.605v4c0 1.241 1.01 2.25 2.25 2.25a.75.75 0 0 1 .75.75Z" />
    </svg>
  );
}

function Pf6InfoIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16 1C7.729 1 1 7.729 1 16s6.729 15 15 15 15-6.729 15-15S24.271 1 16 1Zm1.5 22a1.5 1.5 0 1 1-3 0v-5.157l-.188.04a1.5 1.5 0 0 1-.625-2.934l1.956-.416c.112-.024.223-.032.333-.03l.024-.002a1.5 1.5 0 0 1 1.5 1.5v7Zm-.08-12.58c-.38.37-.89.58-1.42.58a1.998 1.998 0 0 1-1.851-2.76c.051-.13.11-.24.19-.35.07-.11.15-.21.25-.3.74-.75 2.08-.75 2.83 0 .09.09.17.19.24.3.08.11.14.22.189.35.05.12.09.24.11.37.03.13.04.26.04.39 0 .53-.21 1.04-.58 1.42Z" />
    </svg>
  );
}

function Pf6SuccessIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16 1C7.729 1 1 7.729 1 16s6.729 15 15 15 15-6.729 15-15S24.271 1 16 1Zm7.795 11.795-8.646 8.646c-.317.317-.733.475-1.149.475s-.832-.158-1.149-.475l-4.646-4.646a1.126 1.126 0 0 1 1.591-1.591l4.205 4.205 8.205-8.205a1.126 1.126 0 0 1 1.591 1.591Z" />
    </svg>
  );
}

function Pf6WarningIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m31.874 28.514-15.011-27a1.001 1.001 0 0 0-1.748 0l-15.011 27A1 1 0 0 0 .978 30H31a1 1 0 0 0 .874-1.486ZM14.5 12a1.5 1.5 0 0 1 3 0v5a1.5 1.5 0 0 1-3 0v-5ZM16 26.001a2 2 0 1 1-.001-3.999A2 2 0 0 1 16 26.001Z" />
    </svg>
  );
}

function Pf6DangerIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16 1C7.729 1 1 7.729 1 16s6.729 15 15 15 15-6.729 15-15S24.271 1 16 1Zm-1.5 8a1.5 1.5 0 1 1 3 0v7a1.5 1.5 0 1 1-3 0V9ZM16 25.001a2 2 0 1 1-.001-3.999A2 2 0 0 1 16 25.001Z" />
    </svg>
  );
}

const PF6_ALERT_COLORS: Record<string, { light: string; dark: string }> = {
  custom: { light: '#147878', dark: '#63bdbd' },
  info: { light: '#5e40be', dark: '#b6a6e9' },
  success: { light: '#3d7317', dark: '#87bb62' },
  warning: { light: '#dca614', dark: '#ffcc17' },
  error: { light: '#b1380b', dark: '#f0561d' },
};

const PF6_ALERT_ICONS: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  custom: Pf6CustomIcon,
  info: Pf6InfoIcon,
  success: Pf6SuccessIcon,
  warning: Pf6WarningIcon,
  error: Pf6DangerIcon,
};

function pf6AlertStyle(statusColor: string, isDark: boolean): CSSProperties {
  return {
    fontFamily: PF_FONT,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    border: `2px solid ${statusColor}`,
    borderRadius: '16px',
    background: isDark ? '#292929' : '#fff',
    color: isDark ? '#fff' : '#151515',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  };
}

function Pf6AlertContent({
  variant,
  isDark,
  icon,
  children,
}: {
  variant: string;
  isDark: boolean;
  icon?: ReactNode;
  children: ReactNode;
}): ReactElement {
  const colors = PF6_ALERT_COLORS[variant] ?? PF6_ALERT_COLORS['custom'];
  const statusColor = isDark ? colors!.dark : colors!.light;
  const IconComponent = PF6_ALERT_ICONS[variant] ?? Pf6CustomIcon;

  const resolvedIcon =
    icon !== undefined ? (
      icon
    ) : (
      <span style={{ fontSize: '1.375rem', display: 'flex', flexShrink: 0 }}>
        <IconComponent fill={statusColor} />
      </span>
    );

  return (
    <>
      {resolvedIcon}
      <p style={{ margin: 0, fontWeight: 700 }}>{children}</p>
    </>
  );
}

function Pf6AlertBox({
  variant,
  isDark,
  children,
}: {
  variant: string;
  isDark: boolean;
  children: ReactNode;
}): ReactElement {
  const colors = PF6_ALERT_COLORS[variant] ?? PF6_ALERT_COLORS['custom'];
  const statusColor = isDark ? colors!.dark : colors!.light;

  return (
    <div role="alert" style={pf6AlertStyle(statusColor, isDark)}>
      <Pf6AlertContent variant={variant} isDark={isDark}>
        {children}
      </Pf6AlertContent>
    </div>
  );
}

export const PatternFlyV6Alert = forwardRef<HTMLDivElement, AlertProps>(function PatternFlyV6Alert(
  { severity = 'info', icon, children, className, style, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode(innerRef);
  const colors = PF6_ALERT_COLORS[severity] ?? PF6_ALERT_COLORS['info'];
  const statusColor = isDark ? colors!.dark : colors!.light;

  return (
    <div
      ref={mergeRefs(innerRef, ref)}
      role="alert"
      className={className}
      {...rest}
      style={{ ...pf6AlertStyle(statusColor, isDark), ...style }}
    >
      <Pf6AlertContent variant={severity} isDark={isDark} icon={icon}>
        {children}
      </Pf6AlertContent>
    </div>
  );
});

export function Pf6AlertDemo(): ReactElement {
  const { components } = useComponents();
  const Alert = components.Alert;

  const innerRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode(innerRef);

  return (
    <div ref={innerRef} style={{ fontFamily: PF_FONT, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>PatternFly v6 Alert Variations (via ComponentsProvider)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Pf6AlertBox variant="custom" isDark={isDark}>
          Custom alert title
        </Pf6AlertBox>
        <Alert severity="info">Info alert title</Alert>
        <Alert severity="success">Success alert title</Alert>
        <Alert severity="warning">Warning alert title</Alert>
        <Alert severity="error">Danger alert title</Alert>
      </div>
    </div>
  );
}
