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

// jsdom does not apply layered styles, so assert selector-scoped CSS contracts.
const css = readFileSync(resolve(__dirname, './card.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

function getRule(selector: string): string {
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, ruleSelector]) => ruleSelector?.trim() === selector,
  )?.[2];
  expect(rule).toBeDefined();
  return rule ?? '';
}

describe('card.css', () => {
  it('scopes every rule to the components layer', () => {
    expect(css).toContain('@layer perses.components {');
  });

  it('wraps root defaults in :where() so style props win', () => {
    const root = getRule(':where(.ps-Card)');
    expect(root).toContain('display: flex;');
    expect(root).toContain('flex-direction: column;');
    expect(root).toContain('background-color: var(--perses-bg-surface);');
    expect(root).toContain('border-radius: var(--perses-radius-lg);');
    expect(root).toContain('overflow: hidden;');
  });

  it('uses the border-width token and leaves box-sizing to the reset', () => {
    expect(getRule(':where(.ps-Card)')).toContain('border: var(--perses-border-width-sm) solid transparent;');
    expect(css).not.toContain('box-sizing');
  });

  it('elevated uses the overlay shadow token and outlined uses the border token', () => {
    expect(getRule(".ps-Card[data-variant='elevated']")).toContain('box-shadow: var(--perses-shadow-overlay);');
    expect(getRule(".ps-Card[data-variant='outlined']")).toContain('border-color: var(--perses-border-default);');
  });

  it('wraps sub-part padding defaults in :where()', () => {
    expect(getRule(':where(.ps-CardHeader)')).toContain('padding: var(--perses-spacing-lg);');
    expect(getRule(':where(.ps-CardContent)')).toContain('padding: var(--perses-spacing-lg);');
  });

  it('lets the header content slot shrink and grow', () => {
    const content = getRule('.ps-CardHeader__content');
    expect(content).toContain('flex: 1;');
    expect(content).toContain('min-width: 0;');
  });

  it('uses no !important and no raw colors', () => {
    expect(css).not.toContain('!important');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });
});
