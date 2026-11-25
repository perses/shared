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

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const primitives = resolve(__dirname, '../primitives');
const stylesheets = readdirSync(primitives, { recursive: true, encoding: 'utf8' }).filter((path) =>
  path.endsWith('.css'),
);

function readCss(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

describe('standalone stylesheet initialization', () => {
  it.each(stylesheets)('%s imports only the public order prelude before its layer', (path) => {
    const css = readCss(resolve(primitives, path));
    expect(css).toMatch(/^@import ['"]@perses-dev\/design-tokens\/css\/layers['"];/);
    expect([...css.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((match) => match[1])).toEqual([
      '@perses-dev/design-tokens/css/layers',
    ]);
    const layers = [...css.matchAll(/@layer\s+([\w.]+)\s*\{/g)].map((match) => match[1]);
    expect(layers).toEqual([path.startsWith('system/') ? 'perses.utilities' : 'perses.components']);
  });

  it('the aggregate initializes order without importing the document reset', () => {
    const css = readCss(resolve(__dirname, 'index.css'));
    expect(css).toMatch(/^@import ['"]@perses-dev\/design-tokens\/css\/layers['"];/);
    expect(css).not.toContain('/css/reset');
    expect(css).not.toMatch(/@import ['"]@perses-dev\/design-tokens\/css['"]/);
  });
});
