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
    expect(list).toContain('border-bottom: var(--perses-border-width-sm) solid var(--perses-border-default);');
    const verticalList = getRule(":where(.ps-TabList[data-orientation='vertical'])");
    expect(verticalList).toContain('flex-direction: column;');
    expect(verticalList).toContain(
      'border-inline-end: var(--perses-border-width-sm) solid var(--perses-border-default);',
    );
  });

  it('resets the tab button and exposes the min-height override variable', () => {
    const tab = getRule(':where(.ps-Tab)');
    expect(tab).toContain('border: 0;');
    expect(tab).toContain('background: none;');
    expect(tab).toContain('min-height: var(--perses-tab-min-height, var(--perses-control-size-lg));');
    expect(tab).toContain('gap: var(--perses-spacing-sm);');
    expect(tab).toContain('color: var(--perses-text-secondary);');
  });

  it('styles active, focus-visible and disabled states with tokens', () => {
    expect(getRule(':where(.ps-Tab[data-active])')).toContain('color: var(--perses-status-text-primary);');
    const focus = getRule(':where(.ps-Tab:focus-visible)');
    expect(focus).toContain('outline-width: var(--perses-focus-ring-width);');
    expect(focus).toContain('outline-color: var(--perses-focus-ring-color);');
    const disabled = getRule(':where(.ps-Tab[data-disabled])');
    expect(disabled).toContain('opacity: var(--perses-opacity-disabled);');
    expect(disabled).toContain('cursor: not-allowed;');
  });

  it('positions the indicator from Base UI variables per orientation', () => {
    const indicator = getRule(':where(.ps-TabList__indicator)');
    expect(indicator).toContain('position: absolute;');
    expect(indicator).toContain('left: var(--active-tab-left);');
    expect(indicator).toContain('width: var(--active-tab-width);');
    expect(indicator).toContain('height: var(--perses-border-width-md);');
    expect(indicator).toContain('background-color: var(--perses-status-solid-primary);');
    const vertical = getRule(":where(.ps-TabList__indicator[data-orientation='vertical'])");
    expect(vertical).toContain('top: var(--active-tab-top);');
    expect(vertical).toContain('height: var(--active-tab-height);');
    expect(vertical).toContain('width: var(--perses-border-width-md);');
  });

  it('scrolls the list itself for the scrollable variant and stretches tabs for fullWidth', () => {
    const scrollable = getRule(":where(.ps-TabList[data-variant='scrollable'])");
    expect(scrollable).toContain('overflow: auto;');
    expect(scrollable).toContain('scrollbar-width: none;');
    expect(getRule(":where(.ps-TabList[data-variant='scrollable'] .ps-Tab)")).toContain('flex-shrink: 0;');
    expect(getRule(":where(.ps-TabList[data-variant='fullWidth'] .ps-Tab)")).toContain('flex: 1;');
  });

  it('pins scroll buttons to the list edges and rotates them when vertical', () => {
    const button = getRule(':where(.ps-TabList__scrollButton)');
    expect(button).toContain('position: sticky;');
    expect(button).toContain('background-color: var(--perses-bg-surface);');
    expect(getRule(":where(.ps-TabList__scrollButton[data-direction='back'])")).toContain('order: -1;');
    expect(getRule(":where(.ps-TabList[data-orientation='vertical'] .ps-TabList__scrollButton)")).toContain(
      'rotate: 90deg;',
    );
  });

  it('only animates the indicator and smooth scrolling when motion is allowed', () => {
    const reducedMotionBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'));
    expect(reducedMotionBlock).toContain('transition:');
    expect(reducedMotionBlock).toContain('scroll-behavior: smooth;');
    expect(getRule(':where(.ps-TabList__indicator)')).not.toContain('transition');
    expect(getRule(":where(.ps-TabList[data-variant='scrollable'])")).not.toContain('scroll-behavior');
  });
});
