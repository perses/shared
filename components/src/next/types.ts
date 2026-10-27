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

import type { CSSProperties, SVGProps } from 'react';

/**
 * React inline styles with support for CSS custom properties.
 * Custom-property numbers are written verbatim, without implicit units; use strings for lengths such as `'24px'`.
 * The React-only branch preserves compatibility with existing `CSSProperties` interfaces without an index signature.
 */
export type PersesCSSProperties<Style extends CSSProperties = CSSProperties> =
  | Style
  | (Style & {
      [customProperty: `--${string}`]: string | number | undefined;
    });

/**
 * Styling overrides for a documented internal part. Does not expose element replacement, content, event handlers,
 * refs, state, or accessibility attributes. Components read these fields explicitly rather than spreading this object.
 * Pass the component's `Style` interface when the slot element is the one that reads its documented custom
 * properties, so those values are type-checked the same way as the top-level `style`.
 */
export interface SlotStyleProps<Style extends CSSProperties = CSSProperties> {
  /** Additional classes; required component classes are preserved. */
  className?: string;
  /** Inline visual overrides, including CSS custom properties. */
  style?: PersesCSSProperties<Style>;
}

export interface StyledSVGProps extends SVGProps<SVGSVGElement> {
  style?: PersesCSSProperties;
}
