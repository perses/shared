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

import { tokens } from '@perses-dev/design-tokens';
import type { RadiusScale } from '@perses-dev/design-tokens';
import type { CSSProperties } from 'react';

import type { Responsive } from './responsive';
import { lengthTransform } from './styleProps';
import type { StyleValueTransform } from './styleProps';

/**
 * A radius token, non-negative pixels, or a CSS border-radius shorthand.
 * Use inline styles for CSS-wide keywords.
 */
export type RadiusValue = RadiusScale | Exclude<CSSProperties['borderRadius'], undefined>;

/** A radius token, non-negative pixels, or a one-/two-axis corner radius. */
export type CornerRadiusValue = RadiusScale | Exclude<CSSProperties['borderTopLeftRadius'], undefined>;

function isRadiusToken(value: RadiusValue): value is RadiusScale {
  return typeof value === 'string' && Object.hasOwn(tokens.radius, value);
}

/** Resolves existing radius tokens; numbers are pixels and CSS strings pass through unchanged. */
export const radiusTransform: StyleValueTransform<RadiusValue> = (value) =>
  isRadiusToken(value) ? tokens.radius[value] : lengthTransform(value);

/**
 * Responsive physical radii: rounded < top/bottom < left/right < corners < inline styles.
 * Narrower overrides persist across later breakpoints.
 */
export interface RadiusProps {
  rounded?: Responsive<RadiusValue>;
  roundedTop?: Responsive<CornerRadiusValue>;
  roundedRight?: Responsive<CornerRadiusValue>;
  roundedBottom?: Responsive<CornerRadiusValue>;
  roundedLeft?: Responsive<CornerRadiusValue>;
  roundedTopLeft?: Responsive<CornerRadiusValue>;
  roundedTopRight?: Responsive<CornerRadiusValue>;
  roundedBottomLeft?: Responsive<CornerRadiusValue>;
  roundedBottomRight?: Responsive<CornerRadiusValue>;
}

export const radiusProps: Record<keyof RadiusProps, StyleValueTransform<RadiusValue>> = {
  rounded: radiusTransform,
  roundedTop: radiusTransform,
  roundedRight: radiusTransform,
  roundedBottom: radiusTransform,
  roundedLeft: radiusTransform,
  roundedTopLeft: radiusTransform,
  roundedTopRight: radiusTransform,
  roundedBottomLeft: radiusTransform,
  roundedBottomRight: radiusTransform,
};
