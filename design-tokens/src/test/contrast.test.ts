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

const cssDir = resolve(__dirname, '../css');
const readCss = (filename: string): string => readFileSync(resolve(cssDir, filename), 'utf-8');

const TEXT_AA = 4.5;
const UI_AA = 3;

const palette = new Map<string, string>();
for (const [, name, hex] of readCss('tokens.css').matchAll(/--perses-color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
  palette.set(name as string, hex as string);
}

const semanticCss = readCss('semantic.css');
const darkStart = semanticCss.indexOf("[data-perses-mode='dark']");

function parseBlock(block: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const [, name, color] of block.matchAll(/--perses-([\w-]+):\s*var\(--perses-color-([\w-]+)\)/g)) {
    const hex = palette.get(color as string);
    if (hex) tokens.set(name as string, hex);
  }
  return tokens;
}

const modes: Array<[string, Map<string, string>]> = [
  ['light', parseBlock(semanticCss.slice(0, darkStart))],
  ['dark', parseBlock(semanticCss.slice(darkStart))],
];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const surfaces = ['bg-default', 'bg-surface', 'bg-sunken', 'bg-overlay'];
const roles = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];

describe('semantic token contrast (WCAG 2.x AA)', () => {
  describe.each(modes)('%s mode', (_mode, tokens) => {
    const get = (name: string): string => {
      const value = tokens.get(name);
      if (!value) throw new Error(`Token --perses-${name} not found`);
      return value;
    };

    it.each(['text-primary', 'text-secondary', 'text-accent', 'text-link', 'text-link-hover'])(
      '%s is readable on every surface',
      (text) => {
        const failing = surfaces.filter((surface) => contrast(get(text), get(surface)) < TEXT_AA);
        expect(failing).toEqual([]);
      }
    );

    it.each(roles)('%s status text is readable on its tinted background', (role) => {
      expect(contrast(get(`status-text-${role}`), get(`status-bg-${role}`))).toBeGreaterThanOrEqual(TEXT_AA);
    });

    it.each(roles)('%s status icon and fg text are readable on the default background', (role) => {
      expect(contrast(get(`status-icon-${role}`), get('bg-default'))).toBeGreaterThanOrEqual(TEXT_AA);
      expect(contrast(get(`status-fg-${role}`), get('bg-default'))).toBeGreaterThanOrEqual(TEXT_AA);
    });

    it.each(roles)('%s text-on-solid is readable on the solid and hover fills', (role) => {
      expect(contrast(get('text-on-solid'), get(`status-solid-${role}`))).toBeGreaterThanOrEqual(TEXT_AA);
      expect(contrast(get('text-on-solid'), get(`status-bg-${role}-hover`))).toBeGreaterThanOrEqual(TEXT_AA);
    });

    it.each(roles)('%s solid fill is distinguishable from the default background', (role) => {
      expect(contrast(get(`status-solid-${role}`), get('bg-default'))).toBeGreaterThanOrEqual(UI_AA);
    });
  });
});
