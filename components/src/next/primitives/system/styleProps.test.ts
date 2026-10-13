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

import { sizingProps } from './sizing';
import { spacingProps } from './spacing';
import { applyStyleProps, compileStyleProps } from './styleProps';

const spacing = compileStyleProps([spacingProps]);
const sizing = compileStyleProps([sizingProps]);
const spacingAndSizing = compileStyleProps([spacingProps, sizingProps]);

describe('applyStyleProps', () => {
  it('builds the className and custom-property style from registered props across categories', () => {
    const { className, style } = applyStyleProps({ p: 'md', width: 130 }, spacingAndSizing);
    expect(className).toBe('ps-p ps-width');
    expect(style).toEqual({ '--ps-p': 'var(--perses-spacing-md)', '--ps-width': '130px' });
  });

  it('kebab-cases multi-word prop names for the class and custom property', () => {
    const { className, style } = applyStyleProps({ minWidth: 200 }, sizing);
    expect(className).toBe('ps-min-width');
    expect(style).toEqual({ '--ps-min-width': '200px' });
  });

  it('writes the base value to the unsuffixed property and each breakpoint to its suffix', () => {
    const { style } = applyStyleProps({ width: { default: '100%', md: 400 } }, sizing);
    expect(style).toEqual({ '--ps-width': '100%', '--ps-width-md': '400px' });
  });

  it('returns unregistered props in rest and omits consumed ones', () => {
    const { rest } = applyStyleProps({ p: 'md', id: 'x', role: 'group' }, spacing);
    expect(rest).toEqual({ id: 'x', role: 'group' });
  });

  it('merges the caller style last so it wins over computed custom properties', () => {
    const { style } = applyStyleProps({ p: 'md' }, spacing, { padding: '99px' });
    expect(style).toEqual({ '--ps-p': 'var(--perses-spacing-md)', padding: '99px' });
  });

  it('ignores undefined prop values', () => {
    const { className, style } = applyStyleProps({ p: undefined, width: 10 }, spacingAndSizing);
    expect(className).toBe('ps-width');
    expect(style).toEqual({ '--ps-width': '10px' });
  });
});
