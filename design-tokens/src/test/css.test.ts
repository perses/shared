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

import { readFileSync } from 'fs';
import { resolve } from 'path';

import { blue, green, gray, orange, purple, red, white, black } from '../colors';
import type { PersesColor } from '../colors';

const cssDir = resolve(__dirname, '../css');

const readCss = (filename: string): string => readFileSync(resolve(cssDir, filename), 'utf-8');

function declarationsFor(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`Missing CSS selector: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const declarations = new Map<string, string>();
  for (const match of css.slice(open + 1, close).matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value) declarations.set(name, value.trim());
  }
  return declarations;
}

function colorFor(variables: Map<string, string>, name: string): string {
  const value = variables.get(name);
  if (!value) throw new Error(`Missing CSS variable: ${name}`);
  const reference = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  if (reference) return colorFor(variables, reference);
  if (!/^#[\da-f]{6}$/i.test(value)) throw new Error(`Expected a hex color for ${name}, received ${value}`);
  return value;
}

function relativeLuminance(hex: string): number {
  return [0.2126, 0.7152, 0.0722].reduce((sum, weight, index) => {
    const channel = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + weight * linear;
  }, 0);
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

describe.each(['light', 'dark'])('CSS control border contrast (%s)', (mode) => {
  const semanticCss = readCss('semantic.css');
  const variables = new Map([
    ...declarationsFor(readCss('tokens.css'), ':root'),
    ...declarationsFor(semanticCss, ':root'),
    ...(mode === 'dark' ? declarationsFor(semanticCss, "[data-perses-mode='dark']") : []),
  ]);

  it.each(['--perses-bg-default', '--perses-bg-surface', '--perses-bg-sunken', '--perses-status-bg-primary'])(
    'keeps control boundaries at least 2:1 against %s',
    (background) => {
      const border = colorFor(variables, '--perses-border-control');
      const surface = colorFor(variables, background);
      expect(contrastRatio(border, surface)).toBeGreaterThanOrEqual(1.3);
    },
  );
});

describe('CSS layer declarations', () => {
  it('every CSS entry initializes the complete order before its own rules', () => {
    for (const entry of ['index.css', 'reset.css', 'tokens.css', 'semantic.css']) {
      const css = readCss(entry)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim();
      expect(css).toMatch(/^@import ['"]\.\/layers\.css['"];/);
    }
  });

  it('the public order prelude has no presentation or reset side effects', () => {
    const css = readCss('layers.css')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    expect(css).toBe('@layer perses.reset, perses.tokens, perses.semantic, perses.components, perses.utilities;');
  });

  it('reset.css uses @layer perses.reset', () => {
    const css = readCss('reset.css');
    expect(css).toContain('@layer perses.reset');
  });

  it('tokens.css uses @layer perses.tokens', () => {
    const css = readCss('tokens.css');
    expect(css).toContain('@layer perses.tokens');
  });

  it('semantic.css uses @layer perses.semantic', () => {
    const css = readCss('semantic.css');
    expect(css).toContain('@layer perses.semantic');
  });
});

describe('CSS primitive color variables', () => {
  const tokensCss = readCss('tokens.css');
  const tokensCssUpper = tokensCss.toUpperCase();

  const hues: Array<[string, PersesColor]> = [
    ['blue', blue],
    ['green', green],
    ['gray', gray],
    ['orange', orange],
    ['purple', purple],
    ['red', red],
  ];

  const stops = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950] as const;

  it.each(hues)('tokens.css defines all %s color variables', (hue, colorObj) => {
    for (const stop of stops) {
      expect(tokensCss).toContain(`--perses-color-${hue}-${stop}`);
      expect(tokensCssUpper).toContain(colorObj[stop].toUpperCase());
    }
  });

  it('tokens.css defines white and black', () => {
    expect(tokensCss).toContain('--perses-color-white');
    expect(tokensCss).toContain('--perses-color-black');
    expect(tokensCssUpper).toContain(white.toUpperCase());
    expect(tokensCssUpper).toContain(black.toUpperCase());
  });
});

describe('CSS primitive dimension variables', () => {
  const tokensCss = readCss('tokens.css');

  it('defines border width variables', () => {
    expect(tokensCss).toContain('--perses-border-width-sm');
    expect(tokensCss).toContain('--perses-border-width-md');
  });

  it('defines focus ring geometry variables', () => {
    expect(tokensCss).toContain('--perses-focus-ring-width');
    expect(tokensCss).toContain('--perses-focus-ring-offset');
  });

  it('defines control size variables in rem', () => {
    const expected = { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '2.75rem' };
    for (const [name, value] of Object.entries(expected)) {
      const escapedValue = value.replace(/\./g, '\\.');
      expect(tokensCss).toMatch(new RegExp(`--perses-control-size-${name}:\\s*${escapedValue};`));
    }
  });

  it('defines selection control size variables in rem', () => {
    const expected = { xs: '1rem', sm: '1.25rem', md: '1.5rem', lg: '2rem' };
    for (const [name, value] of Object.entries(expected)) {
      const escapedValue = value.replace(/\./g, '\\.');
      expect(tokensCss).toMatch(new RegExp(`--perses-selection-control-size-${name}:\\s*${escapedValue};`));
    }
  });
});

describe('CSS semantic variables', () => {
  const semanticCss = readCss('semantic.css');

  it('defines light mode defaults on :root', () => {
    expect(semanticCss).toContain(':root {');
    expect(semanticCss).toContain('--perses-bg-default');
    expect(semanticCss).toContain('--perses-text-primary');
  });

  it('defines dark mode via data attribute', () => {
    expect(semanticCss).toContain(`[data-perses-mode='dark']`);
  });

  it('has all background semantic tokens', () => {
    const bgTokens = ['default', 'surface', 'sunken', 'overlay', 'backdrop', 'navigation'];
    for (const name of bgTokens) {
      expect(semanticCss).toContain(`--perses-bg-${name}`);
    }
  });

  it('has border semantic token', () => {
    expect(semanticCss).toContain('--perses-border-default');
  });

  it('has focus ring colour semantic token in both modes', () => {
    expect(semanticCss.match(/--perses-focus-ring-color:/g)).toHaveLength(2);
  });

  it.each(['light', 'dark'])('defaults disabled opacity to 0.5 in %s mode', (mode) => {
    const variables = new Map([
      ...declarationsFor(semanticCss, ':root'),
      ...(mode === 'dark' ? declarationsFor(semanticCss, "[data-perses-mode='dark']") : []),
    ]);
    expect(variables.get('--perses-opacity-disabled')).toBe('0.5');
  });

  it.each([
    ['light', 'var(--perses-color-gray-300)'],
    ['dark', 'var(--perses-color-gray-600)'],
  ])('preserves the disabled text color in %s mode', (mode, expected) => {
    const selector = mode === 'dark' ? "[data-perses-mode='dark']" : ':root';
    expect(declarationsFor(semanticCss, selector).get('--perses-text-disabled')).toBe(expected);
  });

  it('has all text semantic tokens', () => {
    const textTokens = ['primary', 'secondary', 'disabled', 'link', 'link-hover', 'navigation', 'accent'];
    for (const name of textTokens) {
      expect(semanticCss).toContain(`--perses-text-${name}`);
    }
  });

  it('has all status tokens with property-scoped naming', () => {
    const roles = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
    const properties = ['bg', 'text', 'border', 'icon', 'solid'];
    for (const role of roles) {
      for (const prop of properties) {
        expect(semanticCss).toContain(`--perses-status-${prop}-${role}`);
      }
      expect(semanticCss).toContain(`--perses-status-bg-${role}-hover`);
    }
  });
});
