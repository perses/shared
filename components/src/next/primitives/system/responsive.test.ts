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

import { describe, expect, it } from 'vitest';

const spacingProps = [
  ['p', 'padding'],
  ['px', 'padding-inline'],
  ['py', 'padding-block'],
  ['pt', 'padding-top'],
  ['pr', 'padding-right'],
  ['pb', 'padding-bottom'],
  ['pl', 'padding-left'],
  ['m', 'margin'],
  ['mx', 'margin-inline'],
  ['my', 'margin-block'],
  ['mt', 'margin-top'],
  ['mr', 'margin-right'],
  ['mb', 'margin-bottom'],
  ['ml', 'margin-left'],
  ['gap', 'gap'],
  ['row-gap', 'row-gap'],
  ['column-gap', 'column-gap'],
] as const;
const layoutProps = [
  ['display', 'display'],
  ['flex-direction', 'flex-direction'],
  ['align-items', 'align-items'],
  ['justify-content', 'justify-content'],
  ['flex-wrap', 'flex-wrap'],
  ['flex', 'flex'],
  ['width', 'width'],
  ['height', 'height'],
  ['min-width', 'min-width'],
  ['max-width', 'max-width'],
  ['min-height', 'min-height'],
  ['max-height', 'max-height'],
  ['overflow', 'overflow'],
] as const;
const breakpoints = [
  ['xs', 0],
  ['sm', 600],
  ['md', 900],
  ['lg', 1200],
  ['xl', 1536],
] as const;

// jsdom cannot parse layers or evaluate viewport queries/custom properties. Unwrap
// only the utility layer, then use its real CSSOM rules in source order. This is a
// contract evaluator for equal-specificity utilities, not a browser layout test.
function readRules(filename: string): CSSRuleList {
  const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
  const layer = source.match(/@layer\s+perses\.utilities\s*\{([\s\S]*)\}\s*$/);
  if (!layer?.[1]) {
    throw new Error(`Missing utility layer in ${filename}`);
  }
  const style = document.createElement('style');
  style.textContent = layer[1];
  document.head.append(style);
  const rules = style.sheet?.cssRules;
  style.remove();
  if (!rules) {
    throw new Error(`Unable to parse ${filename}`);
  }
  return rules;
}

const stylesheets = [readRules('./spacing.css'), readRules('./layout.css')];

type Declarations = Record<string, string>;

function resolveVariables(value: string, variables: Declarations): string {
  let resolved = value;
  while (/var\(/.test(resolved)) {
    const next = resolved.replace(/var\((--[\w-]+)\s*,\s*([^()]*)\)/g, (_, name: string, fallback: string) => {
      return variables[name] ?? fallback.trim();
    });
    if (next === resolved) {
      throw new Error(`Unsupported custom property expression: ${resolved}`);
    }
    resolved = next;
  }
  return resolved;
}

function matchingDeclarationsAt(width: number, classes: string[], variables: Declarations): Array<[string, string]> {
  const element = document.createElement('div');
  element.className = classes.join(' ');
  const declarations: Array<[string, string]> = [];
  function visit(rules: CSSRuleList): void {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        const conditions = Array.from(rule.conditionText.matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g));
        if (conditions.length === 0) {
          throw new Error(`Unsupported media query: ${rule.conditionText}`);
        }
        if (
          conditions.every(([, bound, pixels]) => (bound === 'min' ? width >= Number(pixels) : width <= Number(pixels)))
        ) {
          visit(rule.cssRules);
        }
      } else if (rule instanceof CSSStyleRule) {
        if (element.matches(rule.selectorText)) {
          for (let index = 0; index < rule.style.length; index++) {
            const property = rule.style[index];
            if (property) {
              declarations.push([property, resolveVariables(rule.style.getPropertyValue(property), variables)]);
            }
          }
        }
      } else {
        throw new Error(`Unsupported utility rule: ${rule.cssText}`);
      }
    }
  }
  for (const rules of stylesheets) {
    visit(rules);
  }
  return declarations;
}

function declarationsAt(width: number, classes: string[], variables: Declarations): Declarations {
  return Object.fromEntries(matchingDeclarationsAt(width, classes, variables));
}

// Preserve declaration order and let CSSStyleDeclaration expand the shorthands.
// Map logical axes to physical sides for the directional-precedence LTR fixtures.
// Expand single-value gap fixtures because jsdom does not expand that shorthand.
function spacingAt(width: number, classes: string[], variables: Declarations): CSSStyleDeclaration {
  const style = document.createElement('div').style;
  const axes: Record<string, string[]> = {
    'padding-inline': ['padding-left', 'padding-right'],
    'padding-block': ['padding-top', 'padding-bottom'],
    'margin-inline': ['margin-left', 'margin-right'],
    'margin-block': ['margin-top', 'margin-bottom'],
    gap: ['row-gap', 'column-gap'],
  };
  for (const [property, value] of matchingDeclarationsAt(width, classes, variables)) {
    for (const target of axes[property] ?? [property]) {
      style.setProperty(target, value);
    }
  }
  return style;
}

describe.each([...spacingProps, ...layoutProps])('%s responsive CSS', (prop, property) => {
  it('carries md forward through lg and xl without a default or filled variables', () => {
    for (const width of [900, 1199.99, 1200, 1536, 2400]) {
      expect(declarationsAt(width, [`ps-${prop}-md`], { [`--ps-${prop}-md`]: '17px' })[property]).toBe('17px');
    }
  });

  it('leaves the property untouched below its first provided breakpoint', () => {
    for (const width of [0, 599.99, 600, 899.99]) {
      expect(declarationsAt(width, [`ps-${prop}-md`], { [`--ps-${prop}-md`]: '17px' })[property]).toBeUndefined();
    }
  });

  it('uses the latest explicit value regardless of class/variable insertion order, including zero', () => {
    const entries = [
      [`--ps-${prop}-xl`, '0'],
      [`--ps-${prop}-md`, '17px'],
      [`--ps-${prop}`, '5px'],
      [`--ps-${prop}-lg`, '23px'],
    ];
    const classes = [`ps-${prop}-xl`, `ps-${prop}-md`, `ps-${prop}`, `ps-${prop}-lg`];
    for (const [width, expected] of [
      [0, '5px'],
      [899.99, '5px'],
      [900, '17px'],
      [1200, '23px'],
      [1536, '0'],
      [2400, '0'],
    ] as const) {
      expect(declarationsAt(width, classes, Object.fromEntries(entries))[property]).toBe(expected);
      expect(declarationsAt(width, classes.toReversed(), Object.fromEntries(entries.toReversed()))[property]).toBe(
        expected,
      );
    }
  });

  it.each(breakpoints)('%s starts at %ipx and remains active above xl', (breakpoint, minWidth) => {
    const classes = [`ps-${prop}`, `ps-${prop}-${breakpoint}`];
    const variables = { [`--ps-${prop}`]: '5px', [`--ps-${prop}-${breakpoint}`]: '17px' };
    if (minWidth > 0) {
      expect(declarationsAt(minWidth - 0.01, classes, variables)[property]).toBe('5px');
    }
    for (const width of [minWidth, 2400]) {
      expect(declarationsAt(width, classes, variables)[property]).toBe('17px');
    }
  });

  it('does not let an unrelated breakpoint variable affect the base class', () => {
    expect(
      declarationsAt(900, [`ps-${prop}`], { [`--ps-${prop}`]: '5px', [`--ps-${prop}-md`]: '17px' })[property],
    ).toBe('5px');
  });

  it.each(['', '-xs', '-sm', '-md', '-lg', '-xl'])(
    '%s reads only its own variable and retains its CSS-wide fallback',
    (suffix) => {
      const variables = Object.fromEntries(
        ['', '-xs', '-sm', '-md', '-lg', '-xl']
          .filter((other) => other !== suffix)
          .map((other) => [`--ps-${prop}${other}`, '99px']),
      );
      expect(declarationsAt(2400, [`ps-${prop}${suffix}`], variables)[property]).toBe(
        spacingProps.some(([spacingProp]) => spacingProp === prop) ? 'initial' : 'revert',
      );
    },
  );
});

describe.each([
  ['row-gap', 'column-gap'],
  ['column-gap', 'row-gap'],
])('%s precedence over gap', (axis, otherAxis) => {
  it.each(['', '-xs', '-sm', '-md', '-lg', '-xl'])(
    'keeps the %s axis override above even later general spacing breakpoints',
    (suffix) => {
      const classes = [`ps-${axis}${suffix}`, 'ps-gap-xl', 'ps-gap'];
      const variables = { '--ps-gap': '8px', '--ps-gap-xl': '32px', [`--ps-${axis}${suffix}`]: '0' };
      for (const width of [1536, 2400]) {
        for (const orderedClasses of [classes, classes.toReversed()]) {
          const style = spacingAt(width, orderedClasses, variables);
          expect(style.getPropertyValue(axis)).toBe('0');
          expect(style.getPropertyValue(otherAxis)).toBe('32px');
        }
      }
    },
  );

  it('uses general spacing below the first axis breakpoint, then carries the override forward', () => {
    const classes = ['ps-gap', `ps-${axis}-md`, 'ps-gap-lg'];
    const variables = { '--ps-gap': '8px', '--ps-gap-lg': '32px', [`--ps-${axis}-md`]: '12px' };
    for (const [width, expectedAxis, expectedOtherAxis] of [
      [0, '8px', '8px'],
      [899.99, '8px', '8px'],
      [900, '12px', '8px'],
      [1200, '12px', '32px'],
      [2400, '12px', '32px'],
    ] as const) {
      const style = spacingAt(width, classes, variables);
      expect(style.getPropertyValue(axis)).toBe(expectedAxis);
      expect(style.getPropertyValue(otherAxis)).toBe(expectedOtherAxis);
    }
  });

  it('applies later axis overrides without changing the other axis', () => {
    const classes = [`ps-${axis}-xl`, 'ps-gap', `ps-${axis}-md`];
    const variables = { '--ps-gap': '8px', [`--ps-${axis}-md`]: '12px', [`--ps-${axis}-xl`]: '24px' };
    const before = spacingAt(1200, classes, variables);
    expect(before.getPropertyValue(axis)).toBe('12px');
    expect(before.getPropertyValue(otherAxis)).toBe('8px');
    const after = spacingAt(1536, classes, variables);
    expect(after.getPropertyValue(axis)).toBe('24px');
    expect(after.getPropertyValue(otherAxis)).toBe('8px');
  });
});

describe.each([
  ['pt', 'padding-top', 'p', 'padding'],
  ['pr', 'padding-right', 'p', 'padding'],
  ['pb', 'padding-bottom', 'p', 'padding'],
  ['pl', 'padding-left', 'p', 'padding'],
  ['mt', 'margin-top', 'm', 'margin'],
  ['mr', 'margin-right', 'm', 'margin'],
  ['mb', 'margin-bottom', 'm', 'margin'],
  ['ml', 'margin-left', 'm', 'margin'],
])('%s physical-side precedence', (prop, property, broad, cssProperty) => {
  it.each(['', '-xs', '-sm', '-md', '-lg', '-xl'])(
    'keeps %s side values above all-sides and axis breakpoints',
    (suffix) => {
      const classes = [`ps-${prop}${suffix}`, `ps-${broad}y-xl`, `ps-${broad}x-xl`, `ps-${broad}-xl`, `ps-${broad}`];
      const variables = {
        [`--ps-${broad}`]: '4px',
        [`--ps-${broad}-xl`]: '80px',
        [`--ps-${broad}x-xl`]: '40px',
        [`--ps-${broad}y-xl`]: '20px',
        [`--ps-${prop}${suffix}`]: '0',
      };
      for (const width of [1536, 2400]) {
        for (const orderedClasses of [classes, classes.toReversed()]) {
          const style = spacingAt(width, orderedClasses, variables);
          expect(style.getPropertyValue(property)).toBe('0px');
          for (const [otherSide, expected] of [
            [`${cssProperty}-top`, '20px'],
            [`${cssProperty}-right`, '40px'],
            [`${cssProperty}-bottom`, '20px'],
            [`${cssProperty}-left`, '40px'],
          ] as const) {
            if (otherSide !== property) {
              expect(style.getPropertyValue(otherSide)).toBe(expected);
            }
          }
        }
      }
    },
  );

  it('preserves broader spacing below the first side breakpoint and carries the side override forward', () => {
    const classes = [`ps-${prop}-md`, `ps-${broad}`];
    const variables = { [`--ps-${broad}`]: '24px', [`--ps-${prop}-md`]: '0' };
    expect(spacingAt(899.99, classes, variables).getPropertyValue(property)).toBe('24px');
    for (const width of [900, 1200, 1536, 2400]) {
      expect(spacingAt(width, classes, variables).getPropertyValue(property)).toBe('0px');
    }
  });

  it('lets a later side value override its earlier value without changing other sides', () => {
    const classes = [`ps-${prop}-xl`, `ps-${broad}`, `ps-${prop}-md`];
    const variables = { [`--ps-${broad}`]: '24px', [`--ps-${prop}-md`]: '12px', [`--ps-${prop}-xl`]: '0' };
    expect(spacingAt(1200, classes, variables).getPropertyValue(property)).toBe('12px');
    const after = spacingAt(1536, classes, variables);
    expect(after.getPropertyValue(property)).toBe('0px');
    for (const side of [`${cssProperty}-top`, `${cssProperty}-right`, `${cssProperty}-bottom`, `${cssProperty}-left`]) {
      if (side !== property) {
        expect(after.getPropertyValue(side)).toBe('24px');
      }
    }
  });
});

describe.each([
  ['mt', 'margin-top'],
  ['mr', 'margin-right'],
  ['mb', 'margin-bottom'],
  ['ml', 'margin-left'],
])('%s margin values', (prop, property) => {
  it.each(['auto', '-8px', '0px'])('applies %s without changing the other margins', (value) => {
    const style = spacingAt(900, ['ps-m', `ps-${prop}-md`], { '--ps-m': '24px', [`--ps-${prop}-md`]: value });
    expect(style.getPropertyValue(property)).toBe(value);
    for (const side of ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']) {
      if (side !== property) {
        expect(style.getPropertyValue(side)).toBe('24px');
      }
    }
  });
});

describe.each([
  ['p', 'px', 'py', 'padding'],
  ['m', 'mx', 'my', 'margin'],
])('%s directional precedence', (broad, inline, block, property) => {
  it.each(['', '-xs', '-sm', '-md'])('keeps %s directional values above a later broad breakpoint', (suffix) => {
    const classes = [
      `ps-${broad}-xl`,
      `ps-${inline}${suffix}`,
      `ps-${block}${suffix}`,
      `ps-${broad}-lg`,
      `ps-${broad}`,
    ];
    const variables = {
      [`--ps-${broad}`]: '4px',
      [`--ps-${broad}-lg`]: '40px',
      [`--ps-${broad}-xl`]: '80px',
      [`--ps-${inline}${suffix}`]: '12px',
      [`--ps-${block}${suffix}`]: '0',
    };
    for (const width of [1200, 1536, 2400]) {
      for (const orderedClasses of [classes, classes.toReversed()]) {
        const style = spacingAt(width, orderedClasses, variables);
        expect(style.getPropertyValue(`${property}-left`)).toBe('12px');
        expect(style.getPropertyValue(`${property}-right`)).toBe('12px');
        expect(style.getPropertyValue(`${property}-top`)).toBe('0px');
        expect(style.getPropertyValue(`${property}-bottom`)).toBe('0px');
      }
    }
  });

  it('lets a later directional value override its earlier value without changing the other axis', () => {
    const classes = [`ps-${inline}-xl`, `ps-${broad}-lg`, `ps-${inline}-md`];
    const variables = {
      [`--ps-${broad}-lg`]: '40px',
      [`--ps-${inline}-md`]: '12px',
      [`--ps-${inline}-xl`]: '0',
    };
    const before = spacingAt(1200, classes, variables);
    expect(before.getPropertyValue(`${property}-left`)).toBe('12px');
    expect(before.getPropertyValue(`${property}-top`)).toBe('40px');
    const after = spacingAt(1536, classes, variables);
    expect(after.getPropertyValue(`${property}-left`)).toBe('0px');
    expect(after.getPropertyValue(`${property}-right`)).toBe('0px');
    expect(after.getPropertyValue(`${property}-top`)).toBe('40px');
    expect(after.getPropertyValue(`${property}-bottom`)).toBe('40px');
  });
});
