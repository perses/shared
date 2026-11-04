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

import { render, screen } from '@testing-library/react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import type { CheckboxProps } from '../Checkbox';
import { defaultComponents, defaultIcons } from '../defaults';
import { Menu } from './Menu';
import { MenuCheckboxItem } from './MenuCheckboxItem';

// jsdom does not apply cascade layers; preserve the selectors while unwrapping each component layer.
const css = ['../Checkbox/checkbox.css', './menu.css']
  .map((file) =>
    readFileSync(resolve(__dirname, file), 'utf-8')
      .replace(/@import\s+[^;]+;/g, '')
      .replace('@layer perses.components {', '')
      .replace(/}\s*$/, ''),
  )
  .join('\n');

function getOpacity(style: HTMLStyleElement, element: Element): string {
  // jsdom cannot resolve var() in opacity, so inspect declarations matching the rendered element.
  const rules = Array.from(style.sheet?.cssRules ?? []).filter(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && Boolean(rule.style.opacity) && element.matches(rule.selectorText),
  );
  return rules.at(-1)?.style.opacity ?? '1';
}

const colors: Array<NonNullable<CheckboxProps['color']>> = [
  'default',
  'primary',
  'secondary',
  'error',
  'warning',
  'success',
  'info',
];

describe('MenuCheckboxItem styling', () => {
  const style = document.createElement('style');

  beforeAll(() => {
    style.textContent = css;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
  });

  describe.each([
    ['subtle', 'var(--ps-checkbox-bg-subtle)', 'var(--ps-checkbox-text)'],
    ['solid', 'var(--perses-checkbox-color)', 'var(--perses-text-on-solid)'],
    ['outline', 'rgba(0, 0, 0, 0)', 'var(--ps-checkbox-text)'],
  ] as const)('variant=%s', (variant, background, text) => {
    it.each(colors)('preserves checkbox color=%s when checked and disabled', (color) => {
      render(
        <Menu defaultOpen>
          <MenuCheckboxItem checked disabled variant={variant} color={color}>
            Show ID
          </MenuCheckboxItem>
        </Menu>,
      );
      const item = screen.getByRole('menuitemcheckbox', { name: 'Show ID' });
      const box = item.querySelector('.ps-Checkbox');
      if (!box) throw new Error('Missing decorative checkbox');
      const computed = getComputedStyle(box);
      expect(computed.backgroundColor).toBe(background);
      expect(computed.color).toBe(text);
      expect(computed.getPropertyValue('--perses-checkbox-color')).toBe(`var(--perses-status-solid-${color})`);
      expect(computed.getPropertyValue('--ps-checkbox-bg-subtle')).toBe(`var(--perses-status-bg-${color})`);
      expect(getOpacity(style, box)).toBe('1');
      expect(getOpacity(style, item)).toBe('var(--perses-opacity-disabled, 0.5)');
    });
  });

  it.each([false, true])('dims a disabled row only once (checked=%s)', (checked) => {
    render(
      <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
        <Menu defaultOpen>
          <MenuCheckboxItem disabled checked={checked}>
            Show ID
          </MenuCheckboxItem>
        </Menu>
      </ComponentsProvider>,
    );
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show ID' });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(getOpacity(style, item)).toBe('var(--perses-opacity-disabled, 0.5)');
    for (const element of item.querySelectorAll('*')) {
      expect(getOpacity(style, element)).toBe('1');
    }
  });
});
