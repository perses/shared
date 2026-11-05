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
const css = readFileSync(resolve(__dirname, './tabs.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

function getRule(selector: string): string {
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, ruleSelector]) => ruleSelector?.trim() === selector,
  )?.[2];
  expect(rule).toBeDefined();
  return rule ?? '';
}

describe('tabs.css', () => {
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

  it('lays the root and list out along the orientation axis', () => {
    expect(getRule(':where(.ps-Tabs)')).toContain('flex-direction: column;');
    expect(getRule(":where(.ps-Tabs[data-orientation='vertical'])")).toContain('flex-direction: row;');
    const list = getRule(':where(.ps-TabList)');
    expect(list).toContain('position: relative;');
    expect(list).toContain('border-bottom: var(--ps-tabs-baseline-width) solid var(--perses-border-default);');
    const verticalList = getRule(":where(.ps-TabList[data-orientation='vertical'])");
    expect(verticalList).toContain('flex-direction: column;');
    expect(verticalList).toContain(
      'border-inline-end: var(--ps-tabs-baseline-width) solid var(--perses-border-default);',
    );
  });

  it('resets the tab button and exposes the min-height override variable', () => {
    const tab = getRule(':where(.ps-Tab)');
    expect(tab).toContain('box-sizing: border-box;');
    expect(tab).toContain('border: 0;');
    expect(tab).toContain('background: none;');
    expect(tab).toContain('min-height: var(--perses-tab-min-height, var(--perses-control-size-lg));');
    expect(tab).toContain('gap: var(--perses-spacing-sm);');
    expect(tab).toContain('color: var(--perses-text-secondary);');
  });

  it('styles active, focus-visible and disabled states with tokens', () => {
    expect(getRule(':where(.ps-Tab[data-active])')).toContain('color: var(--ps-tabs-color-text);');
    const focus = getRule(':where(.ps-Tab:focus-visible)');
    expect(focus).toContain('outline-width: var(--perses-focus-ring-width);');
    expect(focus).toContain('outline-color: var(--perses-focus-ring-color);');
    const disabled = getRule(':where(.ps-Tab[data-disabled])');
    expect(disabled).toContain('opacity: var(--perses-opacity-disabled, 0.5);');
    expect(disabled).toContain('cursor: not-allowed;');
  });

  it('hovers with the subtle default background so text stays readable, and skips disabled tabs', () => {
    const hover = getRule(':where(.ps-Tab:hover:not([data-disabled]))');
    expect(hover).toContain('color: var(--perses-text-primary);');
    expect(hover).toContain('background-color: var(--perses-status-bg-default);');
    expect(css).not.toContain('--perses-status-bg-default-hover');
  });

  it('positions the indicator from Base UI variables per orientation', () => {
    const indicator = getRule(':where(.ps-TabList__indicator)');
    expect(indicator).toContain('position: absolute;');
    expect(indicator).toContain('left: var(--active-tab-left);');
    expect(indicator).toContain('width: var(--active-tab-width);');
    expect(indicator).toContain('height: var(--perses-border-width-md);');
    expect(indicator).toContain('background-color: var(--ps-tabs-color-solid);');
    const vertical = getRule(":where(.ps-TabList__indicator[data-orientation='vertical'])");
    expect(vertical).toContain('top: var(--active-tab-top);');
    expect(vertical).toContain('height: var(--active-tab-height);');
    expect(vertical).toContain('width: var(--perses-border-width-md);');
  });

  it('scrolls every list on overflow, keeps standard tabs at natural width and stretches fullWidth tabs', () => {
    const list = getRule(':where(.ps-TabList)');
    expect(list).toContain('overflow: auto;');
    expect(list).toContain('scrollbar-width: none;');
    expect(getRule(':where(.ps-TabList)::-webkit-scrollbar')).toContain('display: none;');
    expect(getRule(":where(.ps-TabList[data-variant='standard'] .ps-Tab)")).toContain('flex-shrink: 0;');
    expect(getRule(":where(.ps-TabList[data-variant='fullWidth'] .ps-Tab)")).toContain('flex: 1;');
  });

  it('pins the overlay to the viewport without intercepting tab interactions', () => {
    const overlay = getRule(':where(.ps-TabList__scrollButtons)');
    expect(overlay).toContain('position: sticky;');
    expect(overlay).toContain('inset: 0;');
    expect(overlay).toContain('pointer-events: none;');
    expect(overlay).toContain('flex-direction: inherit;');
    expect(overlay).toContain('justify-content: space-between;');
    const button = getRule(':where(.ps-TabList__scrollButton)');
    expect(button).toContain('background-color: var(--perses-bg-surface);');
    expect(button).toContain('pointer-events: auto;');
    expect(getRule(':where(.ps-TabList__scrollButton:disabled)')).toContain('visibility: hidden;');
  });

  it('overlays affordances in one grid cell and inherits gaps only into the tab strip', () => {
    const list = getRule(':where(.ps-TabList)');
    expect(list).toContain('display: grid;');
    expect(list).toContain('grid-template: minmax(0, 1fr) / minmax(0, 1fr);');
    const tabs = getRule(':where(.ps-TabList__tabs)');
    expect(tabs).toContain('grid-area: 1 / 1;');
    expect(tabs).toContain('gap: inherit;');
    expect(tabs).toContain('flex-direction: inherit;');
    expect(getRule(':where(.ps-TabList__scrollButtons)')).toContain('grid-area: 1 / 1;');
  });

  it('marks selection with a CanvasText shape and focus with a Highlight ring in forced-colors mode', () => {
    const start = css.indexOf('@media (forced-colors: active)');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf('@media (prefers-reduced-motion'));
    expect(block).toMatch(/:where\(\.ps-Tab\[data-active\]\) \{\s*color: CanvasText;\s*\}/);
    expect(block).toMatch(/:where\(\.ps-Tab\[data-active\]\)::after \{[^}]*background-color: CanvasText;/);
    expect(block).toMatch(/:where\(\.ps-Tab:focus-visible\) \{[^}]*outline-color: Highlight;/);
    expect(block).toMatch(/:where\(\.ps-TabList__indicator\) \{\s*background-color: CanvasText;/);
    expect(block).not.toMatch(/\[data-active\][^{]*\{[^}]*outline/);
  });

  it('keeps neutral selection distinct from idle text and hover fills', () => {
    const neutral = getRule(
      ":where(.ps-Tabs[data-color='default']),\n  :where(.ps-Tab[data-color='default']),\n  :where(.ps-TabList:has(> .ps-TabList__tabs .ps-Tab[data-active][data-color='default']) > .ps-TabList__indicator)",
    );
    expect(neutral).toContain('--ps-tabs-color-text: var(--perses-text-primary);');
    expect(neutral).toContain('--ps-tabs-color-ring: var(--perses-border-control);');
    expect(getRule(':where(.ps-Tabs[data-color]),\n  :where(.ps-Tab[data-color])')).toContain(
      '--ps-tabs-color-ring: transparent;',
    );
    expect(getRule(":where(.ps-Tab[data-variant='subtle'][data-active])")).toContain(
      'box-shadow: inset 0 0 0 var(--perses-border-width-sm) var(--ps-tabs-color-ring);',
    );
  });

  it('only animates the indicator and smooth scrolling when motion is allowed', () => {
    const reducedMotionBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'));
    expect(reducedMotionBlock).toContain('transition:');
    expect(reducedMotionBlock).toContain('scroll-behavior: smooth;');
    expect(getRule(':where(.ps-TabList__indicator)')).not.toContain('transition');
    expect(getRule(':where(.ps-TabList)')).not.toContain('scroll-behavior');
  });
});
