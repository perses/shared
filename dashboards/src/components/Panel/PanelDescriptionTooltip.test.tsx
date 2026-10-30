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

import { marked } from 'marked';

import { panelDescriptionToHTML } from './PanelDescriptionTooltip';

describe('panelDescriptionToHTML', () => {
  it('keeps plain text descriptions unchanged', () => {
    expect(panelDescriptionToHTML('Simple description')).toBe('<p>Simple description</p>\n');
  });

  it('preserves single line breaks', () => {
    expect(panelDescriptionToHTML('first line\nsecond line')).toBe('<p>first line<br>second line</p>\n');
  });

  it('renders markdown', () => {
    const html = panelDescriptionToHTML('Some **bold** text\n\n- item 1\n- item 2');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<ul>\n<li>item 1</li>\n<li>item 2</li>\n</ul>');
  });

  it('opens links in a new tab', () => {
    expect(panelDescriptionToHTML('[docs](https://example.com)')).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a>',
    );
  });

  it('sanitizes dangerous HTML', () => {
    const html = panelDescriptionToHTML(
      '<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">click</a>',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
  });

  it.each([
    ['style elements', 'foo\n\n<style>body{display:none}</style>', '<style'],
    ['style elements inside svg', '<svg><style>body{display:none}</style></svg>', '<style'],
    ['inline styles', '<div style="position:fixed;inset:0">overlay</div>', 'style='],
    ['forms', '<form action="https://example.com"><input type="password"><button>go</button></form>', '<form'],
    ['inputs', '<input type="password">', '<input'],
    ['buttons', '<button>go</button>', '<button'],
    ['textareas', '<textarea></textarea>', '<textarea'],
    ['selects', '<select><option>a</option></select>', '<select'],
    ['class attributes', '<span class="MuiBackdrop-root">x</span>', 'class='],
    ['id attributes', '<span id="root">x</span>', 'id='],
  ])('removes %s that could affect the page outside the tooltip', (_, description, forbidden) => {
    expect(panelDescriptionToHTML(description)).not.toContain(forbidden);
  });

  it('renders task lists without input elements', () => {
    expect(panelDescriptionToHTML('- [x] done\n- [ ] todo')).toBe('<ul>\n<li>☑ done</li>\n<li>☐ todo</li>\n</ul>\n');
  });

  it('is not affected by the global marked configuration', () => {
    marked.use({ renderer: { strong: (): string => 'overridden' } });
    try {
      expect(panelDescriptionToHTML('**bold**')).toBe('<p><strong>bold</strong></p>\n');
    } finally {
      marked.setOptions(marked.getDefaults());
    }
  });

  it('can be imported and falls back to escaped plain text when no DOM is available', async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    try {
      const module = await import('./PanelDescriptionTooltip');
      expect(module.panelDescriptionToHTML('**bold** <img src=x onerror="alert(1)">')).toBe(
        '**bold** &lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
