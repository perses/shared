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
import type { SpacingScale } from '@perses-dev/design-tokens';
import type { CSSProperties } from 'react';

import type { Responsive } from './responsive';
import { lengthTransform } from './styleProps';
import type { StyleValueTransform } from './styleProps';

export type SpacingValue = SpacingScale | Exclude<CSSProperties['padding'], undefined>;

function isSpacingToken(value: SpacingValue): value is SpacingScale {
  return typeof value === 'string' && Object.hasOwn(tokens.spacing, value);
}

export const spacingTransform: StyleValueTransform<SpacingValue> = (value) =>
  isSpacingToken(value) ? tokens.spacing[value] : lengthTransform(value);

export interface SpacingProps {
  p?: Responsive<SpacingValue>;
  px?: Responsive<SpacingValue>;
  py?: Responsive<SpacingValue>;
  /** Physical top padding; overrides p and axis padding. */
  pt?: Responsive<SpacingValue>;
  /** Physical right padding, including in RTL; overrides p and axis padding. */
  pr?: Responsive<SpacingValue>;
  /** Physical bottom padding; overrides p and axis padding. */
  pb?: Responsive<SpacingValue>;
  /** Physical left padding, including in RTL; overrides p and axis padding. */
  pl?: Responsive<SpacingValue>;
  m?: Responsive<SpacingValue>;
  mx?: Responsive<SpacingValue>;
  my?: Responsive<SpacingValue>;
  /** Physical top margin; overrides m and axis margins. */
  mt?: Responsive<SpacingValue>;
  /** Physical right margin, including in RTL; overrides m and axis margins. */
  mr?: Responsive<SpacingValue>;
  /** Physical bottom margin; overrides m and axis margins. */
  mb?: Responsive<SpacingValue>;
  /** Physical left margin, including in RTL; overrides m and axis margins. */
  ml?: Responsive<SpacingValue>;
  gap?: Responsive<SpacingValue>;
}

export const spacingProps: Record<keyof SpacingProps, StyleValueTransform<SpacingValue>> = {
  p: spacingTransform,
  px: spacingTransform,
  py: spacingTransform,
  pt: spacingTransform,
  pr: spacingTransform,
  pb: spacingTransform,
  pl: spacingTransform,
  m: spacingTransform,
  mx: spacingTransform,
  my: spacingTransform,
  mt: spacingTransform,
  mr: spacingTransform,
  mb: spacingTransform,
  ml: spacingTransform,
  gap: spacingTransform,
};
