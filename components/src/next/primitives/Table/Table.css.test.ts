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

const tableCss = readFileSync(resolve(__dirname, './table.css'), 'utf-8');

function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`missing rule ${selector}`);
  const open = css.indexOf('{', start);
  if (open < 0) throw new Error(`missing rule body for ${selector}`);
  let depth = 0;
  for (let index = open; index < css.length; index++) {
    if (css[index] === '{') depth++;
    else if (css[index] === '}' && --depth === 0) return css.slice(open + 1, index);
  }
  throw new Error(`unterminated rule for ${selector}`);
}

describe('Table CSS contracts', () => {
  it('gives fixed-layout tables an explicit, overridable width', () => {
    const rule = ruleFor(tableCss, ".ps-Table[data-table-layout='fixed']");
    expect(rule).toContain('min-width: 0;');
    expect(rule).toContain('width: 100%;');
    expect(rule).toContain('table-layout: fixed;');
  });
});
