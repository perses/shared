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
import { keywordTransform } from './styleProps';
import type { StyleValueTransform } from './styleProps';

/** Flexbox alignment and flow props. */
export interface FlexboxProps {
  flexDirection?: Responsive<CSSProperties['flexDirection']>;
  alignItems?: Responsive<CSSProperties['alignItems']>;
  justifyContent?: Responsive<CSSProperties['justifyContent']>;
  flexWrap?: Responsive<CSSProperties['flexWrap']>;
  flex?: Responsive<CSSProperties['flex']>;
}

export const flexboxProps: Record<keyof FlexboxProps, StyleValueTransform<string | number>> = {
  flexDirection: keywordTransform,
  alignItems: keywordTransform,
  justifyContent: keywordTransform,
  flexWrap: keywordTransform,
  flex: keywordTransform,
};
