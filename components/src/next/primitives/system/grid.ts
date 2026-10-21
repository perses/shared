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

import type { Responsive } from './responsive';
import type { StyleValueTransform } from './styleProps';

/** CSS grid item placement props. */
export interface GridStyleProps {
  /** Number of columns the item spans; written as `grid-column: span n`. */
  gridColumn?: Responsive<number>;
}

export const spanTransform: StyleValueTransform<number> = (span) => `span ${span}`;

export const gridProps: Record<keyof GridStyleProps, StyleValueTransform<number>> = {
  gridColumn: spanTransform,
};
