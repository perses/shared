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

import { CSSProperties, Dispatch, forwardRef, ReactElement, SetStateAction, SVGProps, useRef, useState } from 'react';

import { useComponents } from '../../contexts/ComponentsProvider';
import type { ButtonProps } from '../../primitives/Button/Button';
import { PF_FONT, PfDivider, PfRow, mergeRefs, useDarkMode } from './utils';

export interface PfPalette {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
}

const PF_SOLID: Record<string, PfPalette> = {
  primary: { bg: '#0066CC', text: '#fff', border: 'transparent', hoverBg: '#004D99' },
  secondary: { bg: 'transparent', text: '#0066CC', border: '#0066CC', hoverBg: 'rgba(0,102,204,0.07)' },
  error: { bg: '#B1380B', text: '#fff', border: 'transparent', hoverBg: '#731F00' },
  warning: { bg: '#FFCC17', text: '#151515', border: 'transparent', hoverBg: '#DCA614' },
  success: { bg: '#3D7317', text: '#fff', border: 'transparent', hoverBg: '#204D00' },
  info: { bg: '#0066CC', text: '#fff', border: 'transparent', hoverBg: '#004D99' },
};

const PF_OUTLINE: Record<string, PfPalette> = {
  primary: { bg: 'transparent', text: '#0066CC', border: '#0066CC', hoverBg: 'rgba(0,102,204,0.07)' },
  secondary: { bg: 'transparent', text: '#0066CC', border: '#E0E0E0', hoverBg: 'rgba(0,0,0,0.04)' },
  error: { bg: 'transparent', text: '#B1380B', border: '#B1380B', hoverBg: 'rgba(177,56,11,0.07)' },
  warning: { bg: 'transparent', text: '#DCA614', border: '#DCA614', hoverBg: 'rgba(220,166,20,0.07)' },
  success: { bg: 'transparent', text: '#3D7317', border: '#3D7317', hoverBg: 'rgba(61,115,23,0.07)' },
  info: { bg: 'transparent', text: '#0066CC', border: '#0066CC', hoverBg: 'rgba(0,102,204,0.07)' },
};

const PF_GHOST: Record<string, PfPalette> = {
  primary: { bg: 'transparent', text: '#0066CC', border: 'transparent', hoverBg: 'rgba(0,102,204,0.07)' },
  secondary: { bg: 'transparent', text: '#151515', border: 'transparent', hoverBg: 'rgba(0,0,0,0.04)' },
  error: { bg: 'transparent', text: '#B1380B', border: 'transparent', hoverBg: 'rgba(177,56,11,0.07)' },
  warning: { bg: 'transparent', text: '#DCA614', border: 'transparent', hoverBg: 'rgba(220,166,20,0.07)' },
  success: { bg: 'transparent', text: '#3D7317', border: 'transparent', hoverBg: 'rgba(61,115,23,0.07)' },
  info: { bg: 'transparent', text: '#0066CC', border: 'transparent', hoverBg: 'rgba(0,102,204,0.07)' },
};

const PF_SOLID_DARK: Record<string, PfPalette> = {
  primary: { bg: '#92C5F9', text: '#1F1F1F', border: 'transparent', hoverBg: '#B9DAFC' },
  secondary: { bg: 'transparent', text: '#B9DAFC', border: '#B9DAFC', hoverBg: 'rgba(185,218,252,0.12)' },
  error: { bg: '#F0561D', text: '#1F1F1F', border: 'transparent', hoverBg: '#F4784A' },
  warning: { bg: '#FFCC17', text: '#1F1F1F', border: 'transparent', hoverBg: '#FFE072' },
  success: { bg: '#87BB62', text: '#1F1F1F', border: 'transparent', hoverBg: '#AFDC8F' },
  info: { bg: '#92C5F9', text: '#1F1F1F', border: 'transparent', hoverBg: '#B9DAFC' },
};

const PF_OUTLINE_DARK: Record<string, PfPalette> = {
  primary: { bg: 'transparent', text: '#B9DAFC', border: '#B9DAFC', hoverBg: 'rgba(185,218,252,0.12)' },
  secondary: { bg: 'transparent', text: '#B9DAFC', border: '#707070', hoverBg: 'rgba(255,255,255,0.06)' },
  error: { bg: 'transparent', text: '#F89B78', border: '#F0561D', hoverBg: 'rgba(240,86,29,0.12)' },
  warning: { bg: 'transparent', text: '#FFCC17', border: '#FFCC17', hoverBg: 'rgba(255,204,23,0.12)' },
  success: { bg: 'transparent', text: '#87BB62', border: '#87BB62', hoverBg: 'rgba(135,187,98,0.12)' },
  info: { bg: 'transparent', text: '#B9DAFC', border: '#B9DAFC', hoverBg: 'rgba(185,218,252,0.12)' },
};

const PF_GHOST_DARK: Record<string, PfPalette> = {
  primary: { bg: 'transparent', text: '#B9DAFC', border: 'transparent', hoverBg: 'rgba(185,218,252,0.12)' },
  secondary: { bg: 'transparent', text: '#fff', border: 'transparent', hoverBg: 'rgba(255,255,255,0.06)' },
  error: { bg: 'transparent', text: '#F89B78', border: 'transparent', hoverBg: 'rgba(248,155,120,0.12)' },
  warning: { bg: 'transparent', text: '#FFCC17', border: 'transparent', hoverBg: 'rgba(255,204,23,0.12)' },
  success: { bg: 'transparent', text: '#87BB62', border: 'transparent', hoverBg: 'rgba(135,187,98,0.12)' },
  info: { bg: 'transparent', text: '#B9DAFC', border: 'transparent', hoverBg: 'rgba(185,218,252,0.12)' },
};

const PF_PALETTES: Record<string, Record<string, PfPalette>> = {
  solid: PF_SOLID,
  outline: PF_OUTLINE,
  ghost: PF_GHOST,
};

const PF_PALETTES_DARK: Record<string, Record<string, PfPalette>> = {
  solid: PF_SOLID_DARK,
  outline: PF_OUTLINE_DARK,
  ghost: PF_GHOST_DARK,
};

const PF_SIZE: Record<string, CSSProperties> = {
  sm: { padding: '4px 0.75rem', fontSize: '0.75rem' },
  md: { padding: '6px 1rem', fontSize: '0.875rem' },
  lg: { padding: '10px 1.5rem', fontSize: '1rem' },
};

export const PatternFlyButton = forwardRef<HTMLButtonElement, ButtonProps>(function PatternFlyButton(
  {
    children,
    variant = 'solid',
    color = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    onMouseEnter,
    onMouseLeave,
    style,
    ...rest
  },
  ref,
) {
  const innerRef = useRef<HTMLButtonElement>(null);
  const isDark = useDarkMode(innerRef);
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;
  const fallback: PfPalette = { bg: '#0066CC', text: '#fff', border: 'transparent', hoverBg: '#004D99' };
  const palettes = isDark ? PF_PALETTES_DARK : PF_PALETTES;
  const palette: PfPalette = palettes[variant]?.[color] ?? fallback;
  const isGhost = variant === 'ghost';
  const isOutline = variant === 'outline';

  const disabledBg = isDark ? '#A3A3A3' : '#C7C7C7';
  const disabledText = isDark ? '#383838' : '#707070';
  const disabledBorder = isDark ? '#707070' : '#A3A3A3';

  let bg: string;
  let textColor: string;
  let borderColor: string;

  if (disabled && !loading) {
    if (isOutline) {
      bg = 'transparent';
      textColor = disabledText;
      borderColor = disabledBorder;
    } else {
      bg = disabledBg;
      textColor = disabledText;
      borderColor = 'transparent';
    }
  } else {
    bg = hovered && !isDisabled ? palette.hoverBg : palette.bg;
    textColor = palette.text;
    borderColor = palette.border;
  }

  let cursor: string;
  if (loading) {
    cursor = 'wait';
  } else if (disabled) {
    cursor = 'not-allowed';
  } else {
    cursor = 'pointer';
  }

  return (
    <button
      ref={mergeRefs(innerRef, ref)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={className}
      {...rest}
      onMouseEnter={(event): void => {
        setHovered(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event): void => {
        setHovered(false);
        onMouseLeave?.(event);
      }}
      style={{
        fontFamily: PF_FONT,
        fontWeight: 400,
        lineHeight: 1.5,
        borderRadius: isGhost ? '6px' : '999px',
        border: `1px solid ${borderColor}`,
        background: bg,
        color: textColor,
        cursor,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        textDecoration: isGhost && hovered && !isDisabled ? 'underline' : 'none',
        ...PF_SIZE[size],
        ...style,
      }}
    >
      {loading && <PfSpinner color={textColor} />}
      {children}
    </button>
  );
});

const PF_SPINNER_KEYFRAMES = `@keyframes pf-spin { to { transform: rotate(360deg); } }`;

function PfSpinner({ color = 'currentColor', size = 14 }: { color?: string; size?: number }): ReactElement {
  return (
    <>
      <style>{PF_SPINNER_KEYFRAMES}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        style={{ animation: 'pf-spin 0.75s linear infinite', flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </>
  );
}

export function PfCloseIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

export function PfExternalLinkIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...props}>
      <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM5 5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h-2v7H5V7h7V5H5z" />
    </svg>
  );
}

export function PfUploadIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
    </svg>
  );
}

export function PfAddCircleIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  );
}

export function ProgressButtonsDemo(): ReactElement {
  const { components } = useComponents();
  const Button = components.Button;
  const innerRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode(innerRef);
  const [isPrimaryLoading, setIsPrimaryLoading] = useState(false);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInlineLoading, setIsInlineLoading] = useState(true);

  const linkColor = isDark ? '#B9DAFC' : '#0066CC';
  const plainColor = isDark ? '#fff' : '#151515';

  const startLoading = (setter: Dispatch<SetStateAction<boolean>>): void => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div ref={innerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.25rem' }}>Progress indicators</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6A6E73' }}>
          Progress indicators can be added to buttons to identify that an action is in progress after a click.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button
          variant="solid"
          color="primary"
          loading={isPrimaryLoading}
          onClick={(): void => startLoading(setIsPrimaryLoading)}
        >
          {isPrimaryLoading ? 'Saving…' : 'Click to save'}
        </Button>
        <Button
          variant="outline"
          color="primary"
          loading={isSecondaryLoading}
          onClick={(): void => startLoading(setIsSecondaryLoading)}
        >
          {isSecondaryLoading ? 'Submitting…' : 'Click to submit'}
        </Button>
      </div>

      <div>
        <button
          aria-label={isUploading ? 'Uploading' : 'Upload'}
          onClick={(): void => setIsUploading(!isUploading)}
          style={{
            fontFamily: PF_FONT,
            padding: '6px 0.75rem',
            borderRadius: '6px',
            border: '1px solid transparent',
            background: 'transparent',
            color: plainColor,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {isUploading ? <PfSpinner color={linkColor} size={16} /> : <PfUploadIcon />}
        </button>
      </div>

      <div>
        <button
          onClick={(): void => setIsInlineLoading(!isInlineLoading)}
          style={{
            fontFamily: PF_FONT,
            fontSize: '0.875rem',
            fontWeight: 400,
            padding: 0,
            border: 'none',
            borderBottom: `1px dashed ${linkColor}`,
            background: 'transparent',
            color: linkColor,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {isInlineLoading && <PfSpinner color={linkColor} />}
          {isInlineLoading ? 'Pause loading logs' : 'Resume loading logs'}
        </button>
      </div>
    </div>
  );
}

export function Pf6ButtonDemo(): ReactElement {
  const { components } = useComponents();
  const Button = components.Button;

  return (
    <div
      style={{
        fontFamily: PF_FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        color: '#151515',
      }}
    >
      <h3 style={{ margin: 0 }}>PatternFly 6 Button Variations (via ComponentsProvider)</h3>

      <PfRow label="Filled / Outline">
        <Button variant="solid" color="primary">
          Primary
        </Button>
        <Button variant="outline" color="primary">
          Secondary
        </Button>
        <Button variant="outline" color="error">
          Danger Secondary
        </Button>
        <Button variant="outline" color="secondary">
          Tertiary
        </Button>
        <Button variant="solid" color="error">
          Danger
        </Button>
        <Button variant="solid" color="warning">
          Warning
        </Button>
      </PfRow>

      <PfRow label="Link">
        <Button variant="ghost" color="primary">
          <PfAddCircleIcon /> Link
        </Button>
        <Button variant="ghost" color="primary">
          Link <PfExternalLinkIcon />
        </Button>
        <span
          style={{
            color: '#0066CC',
            cursor: 'pointer',
            fontSize: '0.875rem',
            textDecoration: 'underline',
            textDecorationStyle: 'dashed',
            textUnderlineOffset: '4px',
            fontFamily: PF_FONT,
          }}
        >
          Inline link
        </span>
        <Button variant="ghost" color="error">
          Danger link
        </Button>
        <Button variant="ghost" color="secondary">
          <PfCloseIcon />
        </Button>
      </PfRow>

      <PfDivider />

      <h3 style={{ margin: 0 }}>Disabled</h3>
      <PfRow>
        <Button variant="solid" color="primary" disabled>
          Primary
        </Button>
        <Button variant="solid" color="primary" disabled>
          Secondary
        </Button>
        <Button variant="solid" color="error" disabled>
          Danger Secondary
        </Button>
        <Button variant="solid" color="secondary" disabled>
          Tertiary
        </Button>
        <Button variant="solid" color="error" disabled>
          Danger
        </Button>
        <Button variant="solid" color="warning" disabled>
          Warning
        </Button>
      </PfRow>
      <PfRow>
        <Button variant="ghost" color="primary" disabled>
          <PfAddCircleIcon /> Link
        </Button>
        <Button variant="ghost" color="error" disabled>
          Danger link
        </Button>
      </PfRow>

      <PfDivider />

      <ProgressButtonsDemo />
    </div>
  );
}
