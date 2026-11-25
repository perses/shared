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

import { readFileSync } from 'node:fs';

import type { CSSProperties } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { applyStyleProps, compileStyleProps, radiusProps, radiusTransform } from './index';
import type { CornerRadiusValue, RadiusProps, RadiusValue, Responsive } from './index';

const radius = compileStyleProps([radiusProps]);
const corners = [
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
] as const;
const utilities = [
  ['rounded', 'rounded', corners],
  ['roundedTop', 'rounded-top', ['border-top-left-radius', 'border-top-right-radius']],
  ['roundedRight', 'rounded-right', ['border-top-right-radius', 'border-bottom-right-radius']],
  ['roundedBottom', 'rounded-bottom', ['border-bottom-left-radius', 'border-bottom-right-radius']],
  ['roundedLeft', 'rounded-left', ['border-top-left-radius', 'border-bottom-left-radius']],
  ['roundedTopLeft', 'rounded-top-left', ['border-top-left-radius']],
  ['roundedTopRight', 'rounded-top-right', ['border-top-right-radius']],
  ['roundedBottomLeft', 'rounded-bottom-left', ['border-bottom-left-radius']],
  ['roundedBottomRight', 'rounded-bottom-right', ['border-bottom-right-radius']],
] as const;
const breakpoints = [
  ['xs', 0],
  ['sm', 600],
  ['md', 900],
  ['lg', 1200],
  ['xl', 1536],
] as const;
const suffixes = ['', '-xs', '-sm', '-md', '-lg', '-xl'];
type Declarations = Record<string, string>;

// Like responsive.test.ts, evaluate the real equal-specificity utility rules in
// source order: jsdom cannot evaluate layers, media queries, or custom properties.
let radiusRules: CSSRuleList | undefined;
function readRules(filename: string): CSSRuleList {
  if (radiusRules) return radiusRules;
  const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
  const layer = source.match(/@layer\s+perses\.utilities\s*\{([\s\S]*)\}\s*$/);
  if (!layer?.[1]) throw new Error('Missing radius utility layer');
  const element = document.createElement('style');
  element.textContent = layer[1];
  document.head.append(element);
  const rules = element.sheet?.cssRules;
  element.remove();
  if (!rules) throw new Error('Unable to parse radius utilities');
  radiusRules = rules;
  return rules;
}

function declarationsAt(width: number, classes: string[], variables: Declarations): Array<[string, string]> {
  const element = document.createElement('div');
  element.className = classes.join(' ');
  const declarations: Array<[string, string]> = [];
  function visit(rules: CSSRuleList): void {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        const condition = rule.conditionText.match(/^\(min-width:\s*([\d.]+)px\)$/);
        if (!condition) throw new Error(`Unsupported media query: ${rule.conditionText}`);
        if (width >= Number(condition[1])) visit(rule.cssRules);
      } else if (rule instanceof CSSStyleRule) {
        if (!element.matches(rule.selectorText)) continue;
        for (let index = 0; index < rule.style.length; index++) {
          const property = rule.style[index];
          if (!property) continue;
          const value = rule.style
            .getPropertyValue(property)
            .replace(
              /var\((--[\w-]+)(?:\s*,\s*([^()]*))?\)/g,
              (_, name: string, fallback: string | undefined) => variables[name] ?? fallback?.trim() ?? '',
            );
          declarations.push([property, value]);
        }
      } else {
        throw new Error(`Unsupported radius rule: ${rule.cssText}`);
      }
    }
  }
  visit(readRules('./radius.css'));
  return declarations;
}

function expandRadiusAxis(axis: string): string[] {
  const [topLeft = '', topRight = topLeft, bottomRight = topLeft, bottomLeft = topRight] = axis.trim().split(/\s+/);
  return [topLeft, topRight, bottomRight, bottomLeft];
}

// CSSStyleDeclaration does not expand border-radius in jsdom. Expand the simple
// length/percentage shorthand fixtures here, including elliptical slash syntax.
function applyDeclaration(target: Declarations, property: string, value: string): void {
  if (property !== 'border-radius') {
    target[property] = value;
    return;
  }
  const [horizontal = '', vertical = horizontal] = value.split('/');
  const horizontalValues = expandRadiusAxis(horizontal);
  const verticalValues = expandRadiusAxis(vertical);
  corners.forEach((corner, index) => {
    const x = horizontalValues[index];
    const y = verticalValues[index];
    target[corner] = x === y ? `${x}` : `${x} ${y}`;
  });
}

function radiusAt(
  width: number,
  classes: string[],
  variables: Declarations,
  defaults: Declarations = {},
  inline: Declarations = {},
): Declarations {
  const result: Declarations = {};
  for (const [property, value] of [
    ...Object.entries(defaults),
    ...declarationsAt(width, classes, variables),
    ...Object.entries(inline),
  ]) {
    applyDeclaration(result, property, value);
  }
  return result;
}

describe('radius style props', () => {
  it('accepts the corresponding React CSS types and existing responsive breakpoints', () => {
    expectTypeOf<Exclude<CSSProperties['borderRadius'], undefined>>().toExtend<RadiusValue>();
    expectTypeOf<Exclude<CSSProperties['borderTopLeftRadius'], undefined>>().toExtend<CornerRadiusValue>();
    expectTypeOf<RadiusProps['rounded']>().toEqualTypeOf<Responsive<RadiusValue> | undefined>();
    expectTypeOf<RadiusProps['roundedTop']>().toEqualTypeOf<Responsive<CornerRadiusValue> | undefined>();
    expectTypeOf<RadiusProps['roundedBottomRight']>().toEqualTypeOf<Responsive<CornerRadiusValue> | undefined>();
  });

  it.each([
    ['none', 'var(--perses-radius-none)'],
    ['sm', 'var(--perses-radius-sm)'],
    ['md', 'var(--perses-radius-md)'],
    ['lg', 'var(--perses-radius-lg)'],
    ['xl', 'var(--perses-radius-xl)'],
    ['full', 'var(--perses-radius-full)'],
    [0, '0px'],
    [12.5, '12.5px'],
    ['50%', '50%'],
    ['1rem', '1rem'],
    ['4px 8px / 12px 16px', '4px 8px / 12px 16px'],
    ['4px 8px', '4px 8px'],
    ['var(--custom-radius)', 'var(--custom-radius)'],
    ['calc(1rem + 4px)', 'calc(1rem + 4px)'],
    ['inherit', 'inherit'],
    ['toString', 'toString'],
  ] as const)('serializes %s as %s', (value, expected) => {
    expect(radiusTransform(value)).toBe(expected);
  });

  it.each(utilities)('registers %s with token, pixel, and CSS values at every breakpoint', (prop, name) => {
    const { className, style, rest } = applyStyleProps(
      { [prop]: { default: 'sm', xs: 0, sm: 12.5, md: '50%', lg: 'calc(1rem + 4px)', xl: 'full' }, id: 'radius' },
      radius,
    );
    expect(className).toBe(`ps-${name} ps-${name}-xs ps-${name}-sm ps-${name}-md ps-${name}-lg ps-${name}-xl`);
    expect(style).toEqual({
      [`--ps-${name}`]: 'var(--perses-radius-sm)',
      [`--ps-${name}-xs`]: '0px',
      [`--ps-${name}-sm`]: '12.5px',
      [`--ps-${name}-md`]: '50%',
      [`--ps-${name}-lg`]: 'calc(1rem + 4px)',
      [`--ps-${name}-xl`]: 'var(--perses-radius-full)',
    });
    expect(rest).toEqual({ id: 'radius' });
  });

  it('emits only provided values and consumes empty, undefined, and sparse radius props', () => {
    const { className, style, rest } = applyStyleProps(
      { rounded: undefined, roundedTop: {}, roundedRight: { default: undefined }, roundedTopLeft: { md: 0 } },
      radius,
    );
    expect(className).toBe('ps-rounded-top-left-md');
    expect(style).toEqual({ '--ps-rounded-top-left-md': '0px' });
    expect(rest).toEqual({});
  });

  it('preserves caller radius styles and lets caller custom properties override computed values', () => {
    const { style } = applyStyleProps({ rounded: 'md', roundedLeft: { md: 'full' } }, radius, {
      borderRadius: '2px',
      borderTopLeftRadius: '8px 12px',
      '--ps-rounded': '6px',
      '--ps-rounded-left-md': '0px',
    });
    expect(style).toEqual({
      '--ps-rounded': '6px',
      '--ps-rounded-left-md': '0px',
      borderRadius: '2px',
      borderTopLeftRadius: '8px 12px',
    });
  });
});

describe.each(utilities)('%s CSS', (_prop, name, targets) => {
  it.each(breakpoints)('%s starts at %ipx and persists beyond xl', (breakpoint, minWidth) => {
    const classes = [`ps-${name}-${breakpoint}`];
    const variables = { [`--ps-${name}-${breakpoint}`]: '17px' };
    if (minWidth > 0) expect(radiusAt(minWidth - 0.01, classes, variables)).toEqual({});
    for (const width of [minWidth, 2400]) {
      expect(radiusAt(width, classes, variables)).toEqual(
        Object.fromEntries(targets.map((target) => [target, '17px'])),
      );
    }
  });

  it('uses the latest explicit breakpoint regardless of class and variable order, including zero', () => {
    const classes = [`ps-${name}-xl`, `ps-${name}-md`, `ps-${name}`, `ps-${name}-lg`];
    const variables = {
      [`--ps-${name}-xl`]: '0px',
      [`--ps-${name}-md`]: '17px',
      [`--ps-${name}`]: '5px',
      [`--ps-${name}-lg`]: '23px',
    };
    for (const [width, expected] of [
      [0, '5px'],
      [899.99, '5px'],
      [900, '17px'],
      [1200, '23px'],
      [1536, '0px'],
      [2400, '0px'],
    ] as const) {
      for (const order of [classes, classes.toReversed()]) {
        expect(radiusAt(width, order, variables)).toEqual(
          Object.fromEntries(targets.map((target) => [target, expected])),
        );
      }
    }
  });

  it.each(suffixes)('%s reads only its matching variable', (suffix) => {
    const variables = Object.fromEntries(
      suffixes.map((other) => [`--ps-${name}${other}`, other === suffix ? '7px' : '99px']),
    );
    expect(radiusAt(2400, [`ps-${name}${suffix}`], variables)).toEqual(
      Object.fromEntries(targets.map((target) => [target, '7px'])),
    );
  });
});

describe('radius cascade', () => {
  it('does not set defaults without utility classes', () => {
    expect(radiusAt(2400, [], { '--ps-rounded': '99px' })).toEqual({});
    expect(radiusAt(2400, [], {}, { 'border-top-left-radius': '3px' })).toEqual({ 'border-top-left-radius': '3px' });
  });

  it('preserves component defaults below the first breakpoint and supports shorthand slash syntax', () => {
    const classes = ['ps-rounded-md'];
    const variables = { '--ps-rounded-md': '4px 8px / 12px 16px' };
    const defaults = { 'border-radius': '2px' };
    expect(radiusAt(899.99, classes, variables, defaults)).toEqual({
      'border-top-left-radius': '2px',
      'border-top-right-radius': '2px',
      'border-bottom-left-radius': '2px',
      'border-bottom-right-radius': '2px',
    });
    expect(radiusAt(900, classes, variables, defaults)).toEqual({
      'border-top-left-radius': '4px 12px',
      'border-top-right-radius': '8px 16px',
      'border-bottom-left-radius': '8px 16px',
      'border-bottom-right-radius': '4px 12px',
    });
  });

  it.each(utilities.slice(1))(
    '%s persists over later all-corner breakpoints without resetting unrelated corners',
    (_prop, name, targets) => {
      for (const suffix of suffixes) {
        const classes = [`ps-${name}${suffix}`, 'ps-rounded-xl', 'ps-rounded'];
        const variables = { [`--ps-${name}${suffix}`]: '0px', '--ps-rounded-xl': '80px', '--ps-rounded': '4px' };
        for (const order of [classes, classes.toReversed()]) {
          const result = radiusAt(2400, order, variables);
          for (const corner of corners)
            expect(result[corner]).toBe(targets.some((target) => target === corner) ? '0px' : '80px');
        }
      }
    },
  );

  it.each(utilities.slice(1, 5))('%s declares only its two physical corner longhands', (_prop, name, targets) => {
    for (const suffix of suffixes) {
      expect(declarationsAt(2400, [`ps-${name}${suffix}`], { [`--ps-${name}${suffix}`]: '8px 12px' })).toEqual(
        targets.map((target) => [target, '8px 12px']),
      );
    }
  });

  it.each(suffixes)('lets right/left %s win intersections with later top/bottom breakpoints', (suffix) => {
    const classes = [
      `ps-rounded-left${suffix}`,
      `ps-rounded-right${suffix}`,
      'ps-rounded-top-xl',
      'ps-rounded-bottom-xl',
      'ps-rounded-xl',
    ];
    const variables = {
      [`--ps-rounded-left${suffix}`]: '8px',
      [`--ps-rounded-right${suffix}`]: '12px',
      '--ps-rounded-top-xl': '40px',
      '--ps-rounded-bottom-xl': '60px',
      '--ps-rounded-xl': '80px',
    };
    for (const order of [classes, classes.toReversed()]) {
      expect(radiusAt(2400, order, variables)).toEqual({
        'border-top-left-radius': '8px',
        'border-bottom-left-radius': '8px',
        'border-top-right-radius': '12px',
        'border-bottom-right-radius': '12px',
      });
    }
  });

  it.each(utilities.slice(5))('%s persists over every later side breakpoint', (_prop, name, targets) => {
    for (const suffix of suffixes) {
      const classes = [
        `ps-${name}${suffix}`,
        'ps-rounded-top-xl',
        'ps-rounded-bottom-xl',
        'ps-rounded-right-xl',
        'ps-rounded-left-xl',
        'ps-rounded-xl',
      ];
      const variables = {
        [`--ps-${name}${suffix}`]: '0px',
        '--ps-rounded-top-xl': '20px',
        '--ps-rounded-bottom-xl': '30px',
        '--ps-rounded-right-xl': '40px',
        '--ps-rounded-left-xl': '50px',
        '--ps-rounded-xl': '80px',
      };
      for (const order of [classes, classes.toReversed()]) {
        const result = radiusAt(2400, order, variables);
        expect(result[targets[0]]).toBe('0px');
        for (const corner of corners) {
          if (corner !== targets[0]) expect(result[corner]).toBe(corner.includes('left') ? '50px' : '40px');
        }
      }
    }
  });

  it('lets inline styles override all utilities, with inline corner overrides remaining local', () => {
    const classes = ['ps-rounded', 'ps-rounded-top', 'ps-rounded-top-left'];
    const variables = { '--ps-rounded': '4px', '--ps-rounded-top': '8px', '--ps-rounded-top-left': '12px' };
    expect(radiusAt(2400, classes, variables, {}, { 'border-top-left-radius': '1px 2px' })).toEqual({
      'border-top-left-radius': '1px 2px',
      'border-top-right-radius': '8px',
      'border-bottom-left-radius': '4px',
      'border-bottom-right-radius': '4px',
    });
    expect(radiusAt(2400, classes, variables, {}, { 'border-radius': '3px' })).toEqual({
      'border-top-left-radius': '3px',
      'border-top-right-radius': '3px',
      'border-bottom-left-radius': '3px',
      'border-bottom-right-radius': '3px',
    });
  });
});
