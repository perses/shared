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

// jsdom cannot resolve these token values; inspect declarations from rules matching actual elements.
// Browser validation of stacking and arrow placement remains an integration check.
const css = readFileSync(resolve(__dirname, './tooltip.css'), 'utf-8')
  .replace(/@import\s+[^;]+;/g, '')
  .replace('@layer perses.components {', '')
  .replace(/}\s*$/, '');
const style = document.createElement('style');

function propertyFor(className: string, property: string, side?: string): string {
  const element = document.createElement('div');
  element.className = className;
  if (side !== undefined) element.setAttribute('data-side', side);
  const rules = Array.from(style.sheet?.cssRules ?? []).filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && element.matches(rule.selectorText),
  );
  expect(rules.length).toBeGreaterThan(0);
  return rules.reduce((value, rule) => rule.style.getPropertyValue(property) || value, '');
}

describe('tooltip.css', () => {
  beforeAll(() => {
    style.textContent = css;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
  });

  it('consumes the overlay shadow token on the popup', () => {
    expect(propertyFor('ps-Tooltip', 'box-shadow')).toBe('var(--perses-shadow-overlay)');
  });

  it('consumes the overlay z-index token on the transformed positioner', () => {
    expect(propertyFor('ps-Tooltip__positioner', 'z-index')).toBe('var(--perses-z-index-overlay)');
  });

  it('does not confine the overlay z-index to the popup stacking context', () => {
    expect(propertyFor('ps-Tooltip', 'z-index')).toBe('');
  });

  it('paints the empty arrow div as a token-filled rotated square', () => {
    expect(propertyFor('ps-Tooltip__arrow', 'background-color')).toBe('var(--perses-tooltip-bg)');
    expect(propertyFor('ps-Tooltip__arrow', 'width')).toBe('var(--perses-spacing-sm)');
    expect(propertyFor('ps-Tooltip__arrow', 'height')).toBe('var(--perses-spacing-sm)');
    expect(propertyFor('ps-Tooltip__arrow', 'transform')).toBe('rotate(45deg)');
  });

  it.each([
    ['top', 'bottom'],
    ['bottom', 'top'],
    ['left', 'right'],
    ['right', 'left'],
  ])('attaches the %s arrow halfway outside the %s popup edge', (side, edge) => {
    expect(propertyFor('ps-Tooltip__arrow', edge, side)).toBe('calc(var(--perses-spacing-sm) / -2)');
    for (const otherEdge of ['top', 'bottom', 'left', 'right'].filter((candidate) => candidate !== edge)) {
      expect(propertyFor('ps-Tooltip__arrow', otherEdge, side)).toBe('');
    }
  });

  it.each([undefined, '', 'true', 'false'])('does not attach an arrow with non-directional data-side=%s', (side) => {
    for (const edge of ['top', 'bottom', 'left', 'right']) {
      expect(propertyFor('ps-Tooltip__arrow', edge, side)).toBe('');
    }
  });
});
