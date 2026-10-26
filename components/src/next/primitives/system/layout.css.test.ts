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

import { displayProps } from './display';
import { flexboxProps } from './flexbox';
import { sizingProps } from './sizing';

// jsdom does not apply these layered styles, so assert selector-scoped CSS contracts.
const css = readFileSync(resolve(__dirname, './layout.css'), 'utf-8');

const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

// Derived from the registries so a new prop without matching CSS fails here.
const props = Object.keys({ ...displayProps, ...flexboxProps, ...sizingProps }).map((prop) =>
  prop.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`),
);

function getRule(source: string, selector: string): string {
  const rule = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, ruleSelector]) => ruleSelector?.trim() === selector,
  )?.[2];
  expect(rule).toBeDefined();
  return rule ?? '';
}

describe('layout.css', () => {
  it('starts with the layer prelude and declares only perses.utilities', () => {
    expect(css).toMatch(/^[\s\S]*?@import '@perses-dev\/design-tokens\/css\/layers';/);
    expect([...css.matchAll(/@layer\s+([\w.]+)\s*\{/g)].map((match) => match[1])).toEqual(['perses.utilities']);
  });

  it('covers every registry prop', () => {
    expect(props.length).toBeGreaterThan(0);
  });

  describe.each(props)('.ps-%s', (prop) => {
    const rule = (): string => getRule(css, `.ps-${prop}`);

    it('resets its own variables so an element never inherits an ancestor value', () => {
      expect(rule()).toContain(`--ps-${prop}: initial;`);
      for (const bp of BREAKPOINTS) {
        expect(rule()).toContain(`--ps-${prop}-${bp}: initial;`);
      }
    });

    it('reads the base variable with a revert fallback as its final declaration', () => {
      expect(rule().trim().endsWith(`${prop}: var(--ps-${prop}, revert);`)).toBe(true);
    });

    it.each(BREAKPOINTS)('falls back from --ps-%s-%s to the base', (bp) => {
      expect(css).toContain(`${prop}: var(--ps-${prop}-${bp}, var(--ps-${prop}, revert));`);
    });
  });

  it('keeps the variable resets out of the @media blocks', () => {
    const mediaBlocks = css.slice(css.indexOf('@media'));
    expect(mediaBlocks).not.toMatch(/--ps-[\w-]+:\s*initial;/);
  });
});
