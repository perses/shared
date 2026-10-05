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

import { responsiveVariantClassNames } from './responsive';

describe('responsiveVariantClassNames', () => {
  it('returns undefined for scalar values', () => {
    expect(responsiveVariantClassNames('ps-Button--size', 'md')).toBeUndefined();
    expect(responsiveVariantClassNames('ps-Button--size', undefined)).toBeUndefined();
  });

  it('builds one class per defined breakpoint', () => {
    expect(responsiveVariantClassNames('ps-Button--size', { default: 'md', lg: 'sm' })).toBe(
      'ps-Button--size-default-md ps-Button--size-lg-sm',
    );
  });

  it('skips breakpoints with undefined values', () => {
    expect(responsiveVariantClassNames('ps-Button--size', { default: 'md', xl: undefined })).toBe(
      'ps-Button--size-default-md',
    );
  });
});
