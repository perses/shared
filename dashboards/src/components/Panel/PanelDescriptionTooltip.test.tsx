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
});
