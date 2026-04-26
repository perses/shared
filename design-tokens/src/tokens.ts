import type { ColorHue } from './types';

const colorScale = (hue: ColorHue) =>
  ({
    50: `var(--perses-color-${hue}-50)`,
    100: `var(--perses-color-${hue}-100)`,
    150: `var(--perses-color-${hue}-150)`,
    200: `var(--perses-color-${hue}-200)`,
    300: `var(--perses-color-${hue}-300)`,
    400: `var(--perses-color-${hue}-400)`,
    500: `var(--perses-color-${hue}-500)`,
    600: `var(--perses-color-${hue}-600)`,
    700: `var(--perses-color-${hue}-700)`,
    800: `var(--perses-color-${hue}-800)`,
    850: `var(--perses-color-${hue}-850)`,
    900: `var(--perses-color-${hue}-900)`,
    950: `var(--perses-color-${hue}-950)`,
  }) as const;

export const tokens = {
  color: {
    blue: colorScale('blue'),
    green: colorScale('green'),
    gray: colorScale('gray'),
    orange: colorScale('orange'),
    purple: colorScale('purple'),
    red: colorScale('red'),
    white: 'var(--perses-color-white)',
    black: 'var(--perses-color-black)',
  },

  bg: {
    default: 'var(--perses-bg-default)',
    surface: 'var(--perses-bg-surface)',
    sunken: 'var(--perses-bg-sunken)',
    overlay: 'var(--perses-bg-overlay)',
    backdrop: 'var(--perses-bg-backdrop)',
    navigation: 'var(--perses-bg-navigation)',
  },

  border: {
    default: 'var(--perses-border-default)',
  },

  text: {
    primary: 'var(--perses-text-primary)',
    secondary: 'var(--perses-text-secondary)',
    disabled: 'var(--perses-text-disabled)',
    link: 'var(--perses-text-link)',
    linkHover: 'var(--perses-text-link-hover)',
    navigation: 'var(--perses-text-navigation)',
    accent: 'var(--perses-text-accent)',
  },

  status: {
    primary: {
      bg: 'var(--perses-status-bg-primary)',
      bgHover: 'var(--perses-status-bg-primary-hover)',
      text: 'var(--perses-status-text-primary)',
      border: 'var(--perses-status-border-primary)',
      icon: 'var(--perses-status-icon-primary)',
    },
    secondary: {
      bg: 'var(--perses-status-bg-secondary)',
      bgHover: 'var(--perses-status-bg-secondary-hover)',
      text: 'var(--perses-status-text-secondary)',
      border: 'var(--perses-status-border-secondary)',
      icon: 'var(--perses-status-icon-secondary)',
    },
    error: {
      bg: 'var(--perses-status-bg-error)',
      bgHover: 'var(--perses-status-bg-error-hover)',
      text: 'var(--perses-status-text-error)',
      border: 'var(--perses-status-border-error)',
      icon: 'var(--perses-status-icon-error)',
    },
    warning: {
      bg: 'var(--perses-status-bg-warning)',
      bgHover: 'var(--perses-status-bg-warning-hover)',
      text: 'var(--perses-status-text-warning)',
      border: 'var(--perses-status-border-warning)',
      icon: 'var(--perses-status-icon-warning)',
    },
    success: {
      bg: 'var(--perses-status-bg-success)',
      bgHover: 'var(--perses-status-bg-success-hover)',
      text: 'var(--perses-status-text-success)',
      border: 'var(--perses-status-border-success)',
      icon: 'var(--perses-status-icon-success)',
    },
    info: {
      bg: 'var(--perses-status-bg-info)',
      bgHover: 'var(--perses-status-bg-info-hover)',
      text: 'var(--perses-status-text-info)',
      border: 'var(--perses-status-border-info)',
      icon: 'var(--perses-status-icon-info)',
    },
  },

  spacing: {
    0: 'var(--perses-spacing-0)',
    0.5: 'var(--perses-spacing-0_5)',
    1: 'var(--perses-spacing-1)',
    1.5: 'var(--perses-spacing-1_5)',
    2: 'var(--perses-spacing-2)',
    2.5: 'var(--perses-spacing-2_5)',
    3: 'var(--perses-spacing-3)',
    4: 'var(--perses-spacing-4)',
    5: 'var(--perses-spacing-5)',
    6: 'var(--perses-spacing-6)',
    8: 'var(--perses-spacing-8)',
    10: 'var(--perses-spacing-10)',
    12: 'var(--perses-spacing-12)',
  },

  radius: {
    none: 'var(--perses-radius-none)',
    sm: 'var(--perses-radius-sm)',
    md: 'var(--perses-radius-md)',
    lg: 'var(--perses-radius-lg)',
    xl: 'var(--perses-radius-xl)',
    full: 'var(--perses-radius-full)',
  },

  font: {
    family: 'var(--perses-font-family)',
    weight: {
      light: 'var(--perses-font-weight-light)',
      regular: 'var(--perses-font-weight-regular)',
      medium: 'var(--perses-font-weight-medium)',
      bold: 'var(--perses-font-weight-bold)',
    },
    size: {
      h1: 'var(--perses-font-size-h1)',
      h2: 'var(--perses-font-size-h2)',
      h3: 'var(--perses-font-size-h3)',
      h4: 'var(--perses-font-size-h4)',
      body1: 'var(--perses-font-size-body1)',
      body2: 'var(--perses-font-size-body2)',
      subtitle1: 'var(--perses-font-size-subtitle1)',
      subtitle2: 'var(--perses-font-size-subtitle2)',
      button: 'var(--perses-font-size-button)',
      caption: 'var(--perses-font-size-caption)',
    },
    lineHeight: {
      h1: 'var(--perses-line-height-h1)',
      h2: 'var(--perses-line-height-h2)',
      h3: 'var(--perses-line-height-h3)',
      h4: 'var(--perses-line-height-h4)',
      body1: 'var(--perses-line-height-body1)',
      body2: 'var(--perses-line-height-body2)',
      subtitle1: 'var(--perses-line-height-subtitle1)',
      subtitle2: 'var(--perses-line-height-subtitle2)',
      button: 'var(--perses-line-height-button)',
      caption: 'var(--perses-line-height-caption)',
    },
  },
} as const;
