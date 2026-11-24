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

// jsdom does not compute stacking or layered styles, so assert the CSS source contracts directly.
const css = readFileSync(resolve(__dirname, './drawer.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

function getRule(selector: string): string {
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, ruleSelector]) => ruleSelector?.trim() === selector,
  )?.[2];
  expect(rule).toBeDefined();
  return rule ?? '';
}

describe('drawer.css', () => {
  it('layers the backdrop and viewport below MUI modals via the drawer z-index token', () => {
    expect(getRule(':where(.ps-Drawer__backdrop)')).toContain('z-index: var(--perses-z-index-drawer)');
    expect(getRule(':where(.ps-Drawer__viewport)')).toContain('z-index: var(--perses-z-index-drawer)');
    expect(css).not.toContain('--perses-z-index-overlay');
  });
});
