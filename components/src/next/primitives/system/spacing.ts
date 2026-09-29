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

import type { SpacingScale } from '@perses-dev/design-tokens';
import type { CSSProperties } from 'react';

import { isResponsiveValue } from './responsive';
import type { Responsive } from './responsive';

export type SpacingToken = SpacingScale;

export type SpacingProperty = 'p' | 'px' | 'py' | 'm' | 'mx' | 'my' | 'gap';

export function spacingClassName(property: SpacingProperty, value?: Responsive<SpacingToken>): string | undefined {
  if (value === undefined) return undefined;
  return isResponsiveValue(value) ? `ps-spacing-${property}` : `ps-spacing-${property} ps-spacing-${property}-${value}`;
}

export function responsiveSpacingStyle(
  property: SpacingProperty,
  value?: Responsive<SpacingToken>,
): CSSProperties | undefined {
  if (!isResponsiveValue(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value).map(([breakpoint, token]) => [
      `--ps-spacing-${property}-${breakpoint}`,
      `var(--perses-spacing-${token})`,
    ]),
  ) as CSSProperties;
}
