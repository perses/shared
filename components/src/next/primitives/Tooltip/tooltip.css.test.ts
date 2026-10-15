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

// jsdom does not apply stylesheets, so the token contract is asserted on the CSS source.
const css = readFileSync(resolve(__dirname, './tooltip.css'), 'utf-8');

describe('tooltip.css', () => {
  it('consumes the overlay shadow token', () => {
    expect(css).toContain('box-shadow: var(--perses-shadow-overlay);');
  });

  it('consumes the overlay z-index token', () => {
    expect(css).toContain('z-index: var(--perses-z-index-overlay);');
  });
});
