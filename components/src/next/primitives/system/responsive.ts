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

import type { CSSProperties } from 'react';

export type Breakpoint = 'default' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ResponsiveObject<T> = Partial<Record<Breakpoint, T>>;

export type Responsive<T> = T | ResponsiveObject<T>;

export function isResponsiveValue<T>(value: Responsive<T> | undefined): value is ResponsiveObject<T> {
  return typeof value === 'object' && value !== null;
}

export function responsiveClassName(property: string, value: unknown): string | undefined {
  return isResponsiveValue(value) ? `ps-responsive-${property}` : undefined;
}

export function responsiveStyle(property: string, value: unknown): CSSProperties | undefined {
  if (!isResponsiveValue(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value).map(([breakpoint, responsiveValue]) => [
      `--ps-box-${property}-${breakpoint}`,
      responsiveValue,
    ]),
  ) as CSSProperties;
}
