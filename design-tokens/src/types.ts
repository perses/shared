export type { HexColor, PersesColor } from './colors';

export type ColorStop = 50 | 100 | 150 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 850 | 900 | 950;

export type ColorHue = 'blue' | 'green' | 'gray' | 'orange' | 'purple' | 'red';

export type PrimitiveColorVar = `--perses-color-${ColorHue}-${ColorStop}`;

export type CommonColorVar = '--perses-color-white' | '--perses-color-black';

export type SemanticBgVar =
  | '--perses-bg-default'
  | '--perses-bg-surface'
  | '--perses-bg-sunken'
  | '--perses-bg-overlay'
  | '--perses-bg-backdrop'
  | '--perses-bg-navigation';

export type SemanticBorderVar = '--perses-border-default';

export type SemanticTextVar =
  | '--perses-text-primary'
  | '--perses-text-secondary'
  | '--perses-text-disabled'
  | '--perses-text-link'
  | '--perses-text-link-hover'
  | '--perses-text-navigation'
  | '--perses-text-accent';

export type StatusRole = 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';

export type StatusBgVar = `--perses-status-bg-${StatusRole}` | `--perses-status-bg-${StatusRole}-hover`;

export type StatusTextVar = `--perses-status-text-${StatusRole}`;

export type StatusBorderVar = `--perses-status-border-${StatusRole}`;

export type StatusIconVar = `--perses-status-icon-${StatusRole}`;

export type SpacingVar =
  `--perses-spacing-${'0' | '0_5' | '1' | '1_5' | '2' | '2_5' | '3' | '4' | '5' | '6' | '8' | '10' | '12'}`;

export type RadiusVar = `--perses-radius-${'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'}`;

export type FontVar =
  | '--perses-font-family'
  | `--perses-font-weight-${'light' | 'regular' | 'medium' | 'bold'}`
  | `--perses-font-size-${'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'subtitle1' | 'subtitle2' | 'button' | 'caption'}`
  | `--perses-line-height-${'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'subtitle1' | 'subtitle2' | 'button' | 'caption'}`;

export type PersesTokenVar =
  | PrimitiveColorVar
  | CommonColorVar
  | SemanticBgVar
  | SemanticBorderVar
  | SemanticTextVar
  | StatusBgVar
  | StatusTextVar
  | StatusBorderVar
  | StatusIconVar
  | SpacingVar
  | RadiusVar
  | FontVar;

export type PersesMode = 'light' | 'dark';
