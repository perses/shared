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

// jsdom does not apply stylesheets, so the token contracts are asserted on the CSS source.
const readCss = (relativePath: string): string => readFileSync(resolve(__dirname, relativePath), 'utf-8');

const SIZES = ['xs', 'sm', 'md', 'lg'] as const;

function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`missing rule ${selector}`);
  const open = css.indexOf('{', start);
  if (open < 0) throw new Error(`missing rule body for ${selector}`);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`unterminated rule for ${selector}`);
}

describe('Chip border tokens', () => {
  it('uses the chip border width override with the shared width as fallback', () => {
    const rule = ruleFor(readCss('./Chip/chip.css'), ':where(.ps-Chip)');
    expect(rule).toContain('border-width: var(--perses-chip-border-width, var(--perses-border-width-sm));');
  });

  it('uses the chip border style override with solid as fallback', () => {
    const rule = ruleFor(readCss('./Chip/chip.css'), ':where(.ps-Chip)');
    expect(rule).toContain('border-style: var(--perses-chip-border-style, solid);');
  });
});

describe('control size tokens', () => {
  it.each(SIZES)('IconButton size %s is a square driven by --perses-control-size-%s', (size) => {
    const rule = ruleFor(readCss('./IconButton/iconButton.css'), `.ps-IconButton[data-size='${size}']`);
    expect(rule).toContain(`width: var(--perses-control-size-${size});`);
    expect(rule).toContain(`height: var(--perses-control-size-${size});`);
  });

  it.each(SIZES)('Button size %s has min-height --perses-control-size-%s', (size) => {
    const rule = ruleFor(readCss('./Button/button.css'), `.ps-Button[data-size='${size}']`);
    expect(rule).toContain(`min-height: var(--perses-control-size-${size});`);
  });

  it('Chip min-height is driven by --ps-chip-size', () => {
    const rule = ruleFor(readCss('./Chip/chip.css'), ':where(.ps-Chip)');
    expect(rule).toContain('min-height: var(--ps-chip-size);');
  });

  it.each(['xs', 'sm', 'md'] as const)(
    'Chip size %s sets --ps-chip-size from --perses-chip-size-%s, else --perses-control-size-%s',
    (size) => {
      const rule = ruleFor(readCss('./Chip/chip.css'), `.ps-Chip[data-size='${size}']`);
      expect(rule).toContain(`--ps-chip-size: var(--perses-chip-size-${size}, var(--perses-selection-control-size-${size}));`);
    },
  );
});
