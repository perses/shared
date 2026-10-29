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
const css = readFileSync(resolve(__dirname, './menu.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

function getRule(selector: string): string {
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, ruleSelector]) => ruleSelector?.trim() === selector,
  )?.[2];
  expect(rule).toBeDefined();
  return rule ?? '';
}

describe('menu.css', () => {
  it('scopes every rule to the components layer', () => {
    expect(css).toContain('@layer perses.components {');
  });

  it('wraps every selector in :where() so style props win', () => {
    const selectors = [...css.matchAll(/([^{};]+)\{/g)]
      .map(([, selector]) => selector?.trim() ?? '')
      .filter((selector) => !selector.startsWith('@'));
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      for (const part of selector.split(',')) expect(part.trim()).toMatch(/^:where\(/);
    }
  });

  it('layers the positioner with the overlay z-index token', () => {
    expect(getRule(':where(.ps-Menu__positioner)')).toContain('z-index: var(--perses-z-index-overlay);');
  });

  it('styles the popup with surface, border, radius, and shadow tokens', () => {
    const popup = getRule(':where(.ps-Menu)');
    expect(popup).toContain('display: flex;');
    expect(popup).toContain('flex-direction: column;');
    expect(popup).toContain('background-color: var(--perses-bg-overlay);');
    expect(popup).toContain('color: var(--perses-text-primary);');
    expect(popup).toContain('border: var(--perses-border-width-sm) solid var(--perses-border-default);');
    expect(popup).toContain('border-radius: var(--perses-radius-md);');
    expect(popup).toContain('box-shadow: var(--perses-shadow-overlay);');
    expect(popup).toContain('max-height: var(--available-height);');
    expect(popup).toContain('overflow-y: auto;');
    expect(popup).toContain('transform-origin: var(--transform-origin);');
  });

  it('animates open and close through Base UI transition attributes', () => {
    expect(getRule(':where(.ps-Menu)')).toMatch(/transition:\s*opacity 0\.15s ease,\s*transform 0\.15s ease;/);
    const hidden = getRule(':where(.ps-Menu[data-starting-style]),\n  :where(.ps-Menu[data-ending-style])');
    expect(hidden).toContain('opacity: 0;');
    expect(hidden).toContain('transform: scale(0.95);');
  });

  it('disables the transition under prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*:where\(\.ps-Menu\) \{\s*transition: none;/);
  });

  it('spaces a Divider child with the xs token', () => {
    expect(getRule(':where(.ps-Menu > .ps-Divider)')).toContain('margin: var(--perses-spacing-xs) 0;');
  });

  it.each(['.ps-Menu', '.ps-MenuItemBase'])(
    'keeps %s sizing independent of the optional document reset',
    (selector) => {
      expect(getRule(`:where(${selector})`)).toContain('box-sizing: border-box;');
    },
  );

  it('sizes items with control-size and spacing tokens', () => {
    const item = getRule(':where(.ps-MenuItemBase)');
    expect(item).toContain('min-height: var(--perses-control-size-md);');
    expect(item).toContain('padding: var(--perses-spacing-xs) var(--perses-spacing-md);');
    expect(item).toContain('gap: var(--perses-spacing-sm);');
    expect(item).toContain('text-decoration: none;');
    expect(item).toContain('user-select: none;');

    const small = getRule(":where(.ps-MenuItemBase[data-size='sm'])");
    expect(small).toContain('min-height: var(--perses-control-size-sm);');
    expect(small).toContain('font-size: var(--perses-font-size-sm);');
  });

  it('styles item states through data attributes', () => {
    expect(getRule(':where(.ps-MenuItemBase[data-highlighted])')).toContain(
      'background-color: var(--perses-bg-sunken);',
    );
    expect(getRule(':where(.ps-MenuItemBase[data-selected])')).toContain(
      'background-color: var(--perses-status-bg-primary);',
    );
    const disabled = getRule(':where(.ps-MenuItemBase[data-disabled])');
    expect(disabled).toContain('opacity: var(--perses-opacity-disabled);');
    expect(disabled).toContain('cursor: not-allowed;');
  });

  it('keeps the keyboard highlight visible on a selected item', () => {
    const selectedHighlighted = ':where(.ps-MenuItemBase[data-selected][data-highlighted])';
    expect(getRule(selectedHighlighted)).toContain('background-color: var(--perses-status-bg-primary-hover);');
    expect(css.indexOf(selectedHighlighted)).toBeGreaterThan(css.indexOf(':where(.ps-MenuItemBase[data-selected])'));
    expect(css.indexOf(selectedHighlighted)).toBeGreaterThan(css.indexOf(':where(.ps-MenuItemBase[data-highlighted])'));
  });

  it('lets content grow and truncate while start and end stay fixed', () => {
    const content = getRule(':where(.ps-MenuItemBase__content)');
    expect(content).toContain('flex: 1 1 auto;');
    expect(content).toContain('min-width: 0;');
    expect(getRule(':where(.ps-MenuItemBase__start),\n  :where(.ps-MenuItemBase__end)')).toContain('flex-shrink: 0;');
  });

  it('makes the checkbox indicator decorative so the row owns pointer events', () => {
    const indicator = getRule(':where(.ps-MenuCheckboxItem__indicator)');
    expect(indicator).toContain('pointer-events: none;');
    expect(indicator).toContain('flex-shrink: 0;');
  });

  it('uses design tokens for every color, spacing, and radius value', () => {
    const literals = css.match(/#[0-9a-f]{3,8}\b|\b\d+px\b/gi) ?? [];
    expect(literals).toEqual([]);
  });
});
