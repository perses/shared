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

import type { ColorHue, StatusRole } from './types';

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

const statusRole = (role: StatusRole) =>
  ({
    bg: `var(--perses-status-bg-${role})`,
    bgHover: `var(--perses-status-bg-${role}-hover)`,
    text: `var(--perses-status-text-${role})`,
    border: `var(--perses-status-border-${role})`,
    icon: `var(--perses-status-icon-${role})`,
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
    primary: statusRole('primary'),
    secondary: statusRole('secondary'),
    error: statusRole('error'),
    warning: statusRole('warning'),
    success: statusRole('success'),
    info: statusRole('info'),
  },

  spacing: {
    '0': 'var(--perses-spacing-0)',
    xs: 'var(--perses-spacing-xs)',
    sm: 'var(--perses-spacing-sm)',
    md: 'var(--perses-spacing-md)',
    lg: 'var(--perses-spacing-lg)',
    xl: 'var(--perses-spacing-xl)',
    '2xl': 'var(--perses-spacing-2xl)',
    '3xl': 'var(--perses-spacing-3xl)',
    '4xl': 'var(--perses-spacing-4xl)',
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
      xs: 'var(--perses-font-size-xs)',
      sm: 'var(--perses-font-size-sm)',
      md: 'var(--perses-font-size-md)',
      lg: 'var(--perses-font-size-lg)',
      xl: 'var(--perses-font-size-xl)',
      '2xl': 'var(--perses-font-size-2xl)',
      '3xl': 'var(--perses-font-size-3xl)',
      '4xl': 'var(--perses-font-size-4xl)',
    },
    lineHeight: {
      tight: 'var(--perses-line-height-tight)',
      compact: 'var(--perses-line-height-compact)',
      normal: 'var(--perses-line-height-normal)',
      relaxed: 'var(--perses-line-height-relaxed)',
    },
  },
} as const;
