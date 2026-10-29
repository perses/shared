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

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { BREAKPOINT_MIN_WIDTH, BREAKPOINT_ORDER } from './breakpoints';

function mediaQueryWidths(filename: string): number[] {
  const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
  const widths = [...source.matchAll(/@media \(min-width: (\d+)px\)/g)].map((match) => Number(match[1]));
  return [...new Set(widths)].toSorted((a, b) => a - b);
}

describe('breakpoints', () => {
  const positiveWidths = Object.values(BREAKPOINT_MIN_WIDTH)
    .filter((width) => width > 0)
    .toSorted((a, b) => a - b);

  it.each(['./spacing.css', './layout.css', './radius.css'])('matches every media query in %s', (filename) => {
    expect(mediaQueryWidths(filename)).toEqual(positiveWidths);
  });

  it('starts at zero so the smallest breakpoint always matches', () => {
    expect(BREAKPOINT_MIN_WIDTH[BREAKPOINT_ORDER[0]!]).toBe(0);
  });

  it('orders breakpoints by ascending min-width', () => {
    const widths = BREAKPOINT_ORDER.map((name) => BREAKPOINT_MIN_WIDTH[name]);
    expect(widths).toEqual(widths.toSorted((a, b) => a - b));
    expect(BREAKPOINT_ORDER).toHaveLength(Object.keys(BREAKPOINT_MIN_WIDTH).length);
  });
});
