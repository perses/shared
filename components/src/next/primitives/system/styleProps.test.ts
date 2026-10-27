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
    const { className, style } = applyStyleProps({ width: { default: '100%', md: 400 } }, sizing);
    expect(className).toBe('ps-width ps-width-md');
    expect(style).toEqual({ '--ps-width': '100%', '--ps-width-md': '400px' });
  });

  it.each(['p', 'px', 'py', 'm', 'mx', 'my', 'gap'] as const)(
    'mixes tokens, pixels and CSS strings across responsive %s values',
    (prop) => {
      const { className, style } = applyStyleProps(
        { [prop]: { default: 'sm', xs: 0, sm: 12.5, md: '50%', lg: 'calc(1rem + 4px)', xl: undefined } },
        spacing,
      );
      expect(className).toBe(`ps-${prop} ps-${prop}-xs ps-${prop}-sm ps-${prop}-md ps-${prop}-lg`);
      expect(style).toEqual({
        [`--ps-${prop}`]: 'var(--perses-spacing-sm)',
        [`--ps-${prop}-xs`]: '0px',
        [`--ps-${prop}-sm`]: '12.5px',
        [`--ps-${prop}-md`]: '50%',
        [`--ps-${prop}-lg`]: 'calc(1rem + 4px)',
      });
    },
  );

  it.each([
    ['0', 'var(--perses-spacing-0)'],
    ['xs', 'var(--perses-spacing-xs)'],
    ['sm', 'var(--perses-spacing-sm)'],
    ['md', 'var(--perses-spacing-md)'],
    ['lg', 'var(--perses-spacing-lg)'],
    ['xl', 'var(--perses-spacing-xl)'],
    ['2xl', 'var(--perses-spacing-2xl)'],
    ['3xl', 'var(--perses-spacing-3xl)'],
    ['4xl', 'var(--perses-spacing-4xl)'],
    [0, '0px'],
    [100, '100px'],
    [-8, '-8px'],
    ['50%', '50%'],
    ['1rem', '1rem'],
    ['4px 8px', '4px 8px'],
    ['var(--custom-spacing)', 'var(--custom-spacing)'],
    ['auto', 'auto'],
    ['calc(1rem + 4px)', 'calc(1rem + 4px)'],
  ])('serializes scalar spacing %s as %s', (value, expected) => {
    const { style } = applyStyleProps({ m: value }, spacing);
    expect(style).toEqual({ '--ps-m': expected });
  });

  it('emits only the provided breakpoint class without a base or filled larger values', () => {
    const { className, style } = applyStyleProps({ p: { md: 100 } }, spacing);
    expect(className).toBe('ps-p-md');
    expect(style).toEqual({ '--ps-p-md': '100px' });
  });

  it('keeps an explicit zero override when responsive keys arrive in reverse order', () => {
    const { className, style } = applyStyleProps({ minWidth: { xl: 0, md: 100, default: 50 } }, sizing);
    expect(className.split(' ').toSorted()).toEqual(['ps-min-width', 'ps-min-width-md', 'ps-min-width-xl']);
    expect(style).toEqual({ '--ps-min-width': '50px', '--ps-min-width-md': '100px', '--ps-min-width-xl': '0px' });
  });

  it('does not emit classes or variables for empty or undefined-only responsive values', () => {
    const { className, style, rest } = applyStyleProps(
      { p: {}, width: { default: undefined, md: undefined } },
      spacingAndSizing,
    );
    expect(className).toBe('');
    expect(style).toEqual({});
    expect(rest).toEqual({});
  });

  it('returns unregistered props in rest and omits consumed ones', () => {
    const { rest } = applyStyleProps({ p: 'md', id: 'x', role: 'group' }, spacing);
    expect(rest).toEqual({ id: 'x', role: 'group' });
  });

  it('merges the caller style last so it wins over computed custom properties', () => {
    const { style } = applyStyleProps({ p: 'md' }, spacing, { padding: '99px' });
    expect(style).toEqual({ '--ps-p': 'var(--perses-spacing-md)', padding: '99px' });
  });

  it('preserves mixed custom properties and lets caller variables override computed ones', () => {
    const { style } = applyStyleProps({ p: 'md', width: { md: 400 } }, spacingAndSizing, {
      color: 'red',
      '--perses-bg-surface': 'white',
      '--perses-selection-control-size-md': '1.5rem',
      '--perses-checkbox-size-md': '24px',
      '--app-accent': 'blue',
      '--app-scale': 2,
      '--ps-p': '2rem',
      '--ps-width-md': '500px',
    });
    expect(style).toEqual({
      color: 'red',
      '--perses-bg-surface': 'white',
      '--perses-selection-control-size-md': '1.5rem',
      '--perses-checkbox-size-md': '24px',
      '--app-accent': 'blue',
      '--app-scale': 2,
      '--ps-p': '2rem',
      '--ps-width-md': '500px',
    });
  });

  it('ignores undefined prop values', () => {
    const { className, style } = applyStyleProps({ p: undefined, width: 10 }, spacingAndSizing);
    expect(className).toBe('ps-width');
    expect(style).toEqual({ '--ps-width': '10px' });
  });
});
