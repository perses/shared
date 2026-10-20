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
// Browser validation of stacking and arrow placement remains an integration check.
const css = readFileSync(resolve(__dirname, './tooltip.css'), 'utf-8');

function getRule(selector: string): string {
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, ruleSelector]) => ruleSelector?.trim() === selector,
  )?.[2];
  expect(rule).toBeDefined();
  return rule ?? '';
}

describe('tooltip.css', () => {
  it('consumes the overlay shadow token on the popup', () => {
    expect(getRule('.ps-Tooltip')).toContain('box-shadow: var(--perses-shadow-overlay);');
  });

  it('consumes the overlay z-index token on the transformed positioner', () => {
    expect(getRule('.ps-Tooltip__positioner')).toContain('z-index: var(--perses-z-index-overlay);');
  });

  it('does not confine the overlay z-index to the popup stacking context', () => {
    expect(getRule('.ps-Tooltip')).not.toMatch(/\bz-index\s*:/);
  });

  it('paints the empty arrow div as a token-filled rotated square', () => {
    const arrow = getRule('.ps-Tooltip__arrow');
    expect(arrow).toContain('background-color: var(--perses-tooltip-bg);');
    expect(arrow).toContain('width: var(--perses-spacing-sm);');
    expect(arrow).toContain('height: var(--perses-spacing-sm);');
    expect(arrow).toContain('transform: rotate(45deg);');
  });

  it.each([
    ['top', 'bottom'],
    ['bottom', 'top'],
    ['left', 'right'],
    ['right', 'left'],
  ])('attaches the %s arrow halfway outside the %s popup edge', (side, edge) => {
    expect(getRule(`.ps-Tooltip__arrow[data-side='${side}']`)).toContain(
      `${edge}: calc(var(--perses-spacing-sm) / -2);`,
    );
  });
});
