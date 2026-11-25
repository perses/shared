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

// jsdom does not apply these layered styles, so assert selector-scoped CSS contracts.
const css = readFileSync(resolve(__dirname, './grid.css'), 'utf-8');
const layoutCss = readFileSync(resolve(__dirname, '../system/layout.css'), 'utf-8');

function getRule(source: string, selector: string): string {
  const rule = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, ruleSelector]) => ruleSelector?.trim() === selector,
  )?.[2];
  expect(rule).toBeDefined();
  return rule ?? '';
}

describe('grid.css', () => {
  it('scopes every rule to the perses.components layer', () => {
    expect(css).toMatch(/@layer perses\.components \{/);
  });

  it('declares the grid container with a 12-column default behind :where()', () => {
    const rule = getRule(css, ':where(.ps-Grid)');
    expect(rule).toContain('display: grid;');
    expect(rule).toContain('grid-template-columns: repeat(var(--ps-grid-columns, 12), minmax(0, 1fr));');
  });

  it('keeps long content from blowing out a track', () => {
    expect(getRule(css, ':where(.ps-GridItem)')).toContain('min-width: 0;');
  });

  it.each([':where(.ps-Grid)', ':where(.ps-GridItem)'])(
    'uses border-box on %s so padding stays inside the declared width, matching Box and Stack',
    (selector) => {
      expect(getRule(css, selector)).toContain('box-sizing: border-box;');
    },
  );

  it('resets the column count on every grid so nested grids do not inherit it', () => {
    expect(getRule(css, ':where(.ps-Grid)')).toContain('--ps-grid-columns: initial;');
  });

  it('does not reset item span variables; per-breakpoint classes already prevent inheritance', () => {
    expect(getRule(css, ':where(.ps-GridItem)')).not.toContain('--ps-grid-column');
  });

  it('uses no raw pixel or colour values', () => {
    expect(css).not.toMatch(/\d+px/);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('layout.css grid-column', () => {
  it('reads --ps-grid-column at the base', () => {
    expect(getRule(layoutCss, '.ps-grid-column')).toContain('grid-column: var(--ps-grid-column, revert);');
  });

  it.each(['xs', 'sm', 'md', 'lg', 'xl'])('reads only --ps-grid-column-%s on its breakpoint class', (bp) => {
    expect(getRule(layoutCss, `.ps-grid-column-${bp}`)).toContain(`grid-column: var(--ps-grid-column-${bp}, revert);`);
    expect(layoutCss).not.toContain(`var(--ps-grid-column-${bp}, var(--ps-grid-column`);
  });
});
