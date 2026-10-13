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

import type { Responsive } from './responsive';
import { lengthTransform } from './styleProps';
import type { StyleValueTransform } from './styleProps';

/** Width/height props, including min/max. */
export interface SizingProps {
  width?: Responsive<CSSProperties['width']>;
  height?: Responsive<CSSProperties['height']>;
  minWidth?: Responsive<CSSProperties['minWidth']>;
  maxWidth?: Responsive<CSSProperties['maxWidth']>;
  minHeight?: Responsive<CSSProperties['minHeight']>;
  maxHeight?: Responsive<CSSProperties['maxHeight']>;
}

export const sizingProps: Record<keyof SizingProps, StyleValueTransform<string | number>> = {
  width: lengthTransform,
  height: lengthTransform,
  minWidth: lengthTransform,
  maxWidth: lengthTransform,
  minHeight: lengthTransform,
  maxHeight: lengthTransform,
};
