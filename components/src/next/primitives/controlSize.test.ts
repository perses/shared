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

// jsdom does not apply stylesheets, so the size contract is asserted on the CSS source.
const readCss = (relativePath: string): string => readFileSync(resolve(__dirname, relativePath), 'utf-8');

const SIZES = ['xs', 'sm', 'md', 'lg'] as const;

function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`missing rule ${selector}`);
  return css.slice(start, css.indexOf('}', start));
}

describe('control size tokens', () => {
  it.each(SIZES)('IconButton size %s is a square driven by --perses-size-control-%s', (size) => {
    const rule = ruleFor(readCss('./IconButton/iconButton.css'), `.ps-IconButton[data-size='${size}']`);
    expect(rule).toContain(`width: var(--perses-size-control-${size});`);
    expect(rule).toContain(`height: var(--perses-size-control-${size});`);
  });

  it.each(SIZES)('Button size %s has min-height --perses-size-control-%s', (size) => {
    const rule = ruleFor(readCss('./Button/button.css'), `.ps-Button[data-size='${size}']`);
    expect(rule).toContain(`min-height: var(--perses-size-control-${size});`);
  });
});
