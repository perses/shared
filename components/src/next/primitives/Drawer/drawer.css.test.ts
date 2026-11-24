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

function getRule(selector: string, media?: string): string {
  const source = media ? (css.match(new RegExp(`@media \\(${media}\\)\\s*\\{([\\s\\S]*?)\\n  \\}`))?.[1] ?? '') : css;
  const rule = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
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

  it('anchors with physical edges so anchor matches translateX and swipeDirection in RTL', () => {
    expect(getRule(":where(.ps-Drawer[data-anchor='right'])")).toContain('right: 0');
    expect(getRule(":where(.ps-Drawer[data-anchor='left'])")).toContain('left: 0');
    expect(css).not.toMatch(/justify-content|border-(start|end)-(start|end)-radius|inset-inline|margin-inline/);
  });

  it('replaces the removed default outline with a token focus ring', () => {
    const popup = getRule(':where(.ps-Drawer)');
    expect(popup).toContain('outline: 0');
    const focus = getRule(':where(.ps-Drawer:focus-visible)');
    expect(focus).toContain('outline: var(--perses-focus-ring-width) solid var(--perses-focus-ring-color)');
    expect(focus).toContain('outline-offset: calc(-1 * var(--perses-focus-ring-width))');
  });

  it('restates the panel edge and focus ring in forced-colors mode', () => {
    const media = 'forced-colors: active';
    expect(getRule(":where(.ps-Drawer[data-anchor='right'])", media)).toContain('border-left:');
    expect(getRule(":where(.ps-Drawer[data-anchor='right'])", media)).toContain('CanvasText');
    expect(getRule(":where(.ps-Drawer[data-anchor='left'])", media)).toContain('border-right:');
    expect(getRule(':where(.ps-Drawer:focus-visible)', media)).toContain('outline-color: Highlight');
  });

  it('disables motion when the user prefers reduced motion', () => {
    expect(
      getRule(':where(.ps-Drawer),\n    :where(.ps-Drawer__backdrop)', 'prefers-reduced-motion: reduce'),
    ).toContain('transition: none');
  });
});
