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

export type SpacingScale = '0' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type SpacingVar = `--perses-spacing-${SpacingScale}`;

export type RadiusVar = `--perses-radius-${'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'}`;

export type FontSizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type FontSizeVar = `--perses-font-size-${FontSizeScale}`;

export type LineHeightScale = 'tight' | 'compact' | 'normal' | 'relaxed';

export type LineHeightVar = `--perses-line-height-${LineHeightScale}`;

export type FontVar =
  | '--perses-font-family'
  | `--perses-font-weight-${'light' | 'regular' | 'medium' | 'bold'}`
  | FontSizeVar
  | LineHeightVar;

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
