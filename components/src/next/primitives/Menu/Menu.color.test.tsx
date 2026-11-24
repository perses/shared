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
import { resolve } from 'node:path';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectTypeOf } from 'vitest';

import { ThemeModeProvider } from '../../contexts/ThemeModeProvider';
import type { CheckboxProps } from '../Checkbox';
import { Menu } from './Menu';
import type { MenuProps } from './Menu';
import { MenuCheckboxItem } from './MenuCheckboxItem';
import { MenuItem } from './MenuItem';
import { MenuLinkItem } from './MenuLinkItem';

const colors: Array<NonNullable<CheckboxProps['color']>> = [
  'default',
  'primary',
  'secondary',
  'error',
  'warning',
  'success',
  'info',
];
const style = document.createElement('style');
const tokenStyle = document.createElement('style');

// jsdom does not support cascade layers or inherited var() resolution. Inspect matching
// declarations in source order, resolving aliases where declared, as CSS inheritance does.
function propertyFor(element: Element | null, property: string, resolveTokens = false, forcedColors = false): string {
  if (!element) return '';
  const rules = [
    ...(resolveTokens ? Array.from(tokenStyle.sheet?.cssRules ?? []) : []),
    ...Array.from(style.sheet?.cssRules ?? []),
  ]
    .flatMap((rule) => {
      if (!(rule instanceof CSSMediaRule)) return [rule];
      const condition = forcedColors ? /\(forced-colors:\s*active\)/ : /\(forced-colors:\s*none\)/;
      return condition.test(rule.conditionText) ? Array.from(rule.cssRules) : [];
    })
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && element.matches(rule.selectorText));
  const value =
    (element instanceof HTMLElement && element.style.getPropertyValue(property)) ||
    rules.reduce((previous, rule) => rule.style.getPropertyValue(property) || previous, '');
  if (!value || value === 'inherit') return propertyFor(element.parentElement, property, resolveTokens, forcedColors);
  return value.replace(
    /var\((--[\w-]+)\)/g,
    (reference: string, variable: string) => propertyFor(element, variable, resolveTokens, forcedColors) || reference,
  );
}

function luminance(hex: string): number {
  expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  const channels = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722;
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function items(): HTMLElement[] {
  return [
    screen.getByRole('menuitem', { name: 'Action' }),
    screen.getByRole('menuitem', { name: 'Link' }),
    screen.getByRole('menuitemcheckbox', { name: 'Toggle' }),
  ];
}

function indicator(): Element {
  const box = screen.getByRole('menuitemcheckbox', { name: 'Toggle' }).querySelector('.ps-Checkbox');
  if (!box) throw new Error('Missing decorative checkbox');
  return box;
}

async function expectNextItemFocusContrast(item: HTMLElement): Promise<void> {
  await userEvent.keyboard('{ArrowDown}');
  await waitFor(() => expect(item).toHaveFocus());
  const outlineColor = propertyFor(item, 'outline', true).split(' ').at(-1) ?? '';
  expect(contrastRatio(outlineColor, propertyFor(item, 'background-color', true))).toBeGreaterThanOrEqual(3);
}

function expectNeutralRows(): void {
  for (const item of items()) {
    expect(propertyFor(item, 'background-color')).toBe('var(--perses-bg-overlay)');
    expect(propertyFor(item, 'color')).toBe('var(--perses-text-primary)');
    expect(item).not.toHaveAttribute('color');
  }
}

describe('Menu item colors', () => {
  beforeAll(() => {
    style.textContent = ['../Checkbox/checkbox.css', './menu.css']
      .map((file) =>
        readFileSync(resolve(__dirname, file), 'utf-8')
          .replace(/@import\s+[^;]+;/g, '')
          .replace('@layer perses.components {', '')
          .replace(/}\s*$/, ''),
      )
      .join('\n');
    tokenStyle.textContent = [
      '../../../../../design-tokens/src/css/tokens.css',
      '../../../../../design-tokens/src/css/semantic.css',
    ]
      .map((file) =>
        readFileSync(resolve(__dirname, file), 'utf-8')
          .replace(/@import\s+[^;]+;/g, '')
          .replace(/@layer perses\.(tokens|semantic)\s*\{/, '')
          .replace(/}\s*$/, ''),
      )
      .join('\n');
    document.head.append(tokenStyle, style);
  });

  afterAll(() => {
    style.remove();
    tokenStyle.remove();
  });

  it('uses a neutral default without coloring the popup surface', () => {
    render(
      <Menu defaultOpen>
        <MenuItem>Action</MenuItem>
        <MenuLinkItem href="#link">Link</MenuLinkItem>
        <MenuCheckboxItem checked>Toggle</MenuCheckboxItem>
      </Menu>,
    );
    const menu = screen.getByRole('menu');
    expect(menu).not.toHaveAttribute('data-color');
    for (const item of items()) expect(item).toHaveAttribute('data-color', 'default');
    expect(indicator()).toHaveAttribute('data-color', 'default');
    expect(menu).not.toHaveAttribute('color');
    expect(propertyFor(menu, 'background-color')).toBe('var(--perses-bg-overlay)');
    expect(propertyFor(menu, 'color')).toBe('var(--perses-text-primary)');
    expectNeutralRows();
    expect(propertyFor(indicator(), '--perses-checkbox-color')).toBe('var(--perses-status-solid-default)');
  });

  it.each(colors)('supports item color=%s without coloring the rows', (color) => {
    render(
      <Menu defaultOpen>
        <MenuItem color={color} selected>
          Action
        </MenuItem>
        <MenuLinkItem href="#link" color={color} selected>
          Link
        </MenuLinkItem>
        <MenuCheckboxItem checked color={color}>
          Toggle
        </MenuCheckboxItem>
      </Menu>,
    );
    expectNeutralRows();
    expect(propertyFor(indicator(), '--perses-checkbox-color')).toBe(`var(--perses-status-solid-${color})`);
    expect(propertyFor(indicator(), 'background-color')).toBe(`var(--perses-status-bg-${color})`);
    expect(propertyFor(indicator(), 'color')).toBe(`var(--perses-status-text-${color})`);
  });

  it('does not expose menu-wide color variants', () => {
    expectTypeOf<MenuProps>().not.toHaveProperty('color');
  });

  it('keeps items neutral even when an ancestor has a semantic color marker', () => {
    render(
      <Menu defaultOpen data-color="warning">
        <MenuItem>Action</MenuItem>
        <MenuLinkItem href="#link">Link</MenuLinkItem>
        <MenuCheckboxItem checked>Toggle</MenuCheckboxItem>
      </Menu>,
    );
    expectNeutralRows();
    for (const item of items()) expect(item).toHaveAttribute('data-color', 'default');
    expect(propertyFor(indicator(), '--perses-checkbox-color')).toBe('var(--perses-status-solid-default)');
  });

  it('updates item colors without remounting and restores neutral defaults when colors are removed', () => {
    const { rerender } = render(
      <Menu open>
        <MenuItem color="primary">Action</MenuItem>
        <MenuLinkItem href="#link" color="primary">
          Link
        </MenuLinkItem>
        <MenuCheckboxItem checked color="primary">
          Toggle
        </MenuCheckboxItem>
      </Menu>,
    );
    const originalItems = items();
    const box = indicator();
    expectNeutralRows();
    rerender(
      <Menu open>
        <MenuItem color="success">Action</MenuItem>
        <MenuLinkItem href="#link" color="success">
          Link
        </MenuLinkItem>
        <MenuCheckboxItem checked color="success">
          Toggle
        </MenuCheckboxItem>
      </Menu>,
    );
    expect(items()).toEqual(originalItems);
    expect(indicator()).toBe(box);
    expectNeutralRows();
    expect(propertyFor(box, '--perses-checkbox-color')).toBe('var(--perses-status-solid-success)');
    rerender(
      <Menu open>
        <MenuItem color="default">Action</MenuItem>
        <MenuLinkItem href="#link" color="default">
          Link
        </MenuLinkItem>
        <MenuCheckboxItem checked color="default">
          Toggle
        </MenuCheckboxItem>
      </Menu>,
    );
    expectNeutralRows();
    rerender(
      <Menu open>
        <MenuItem color="warning">Action</MenuItem>
        <MenuLinkItem href="#link" color="warning">
          Link
        </MenuLinkItem>
        <MenuCheckboxItem checked color="warning">
          Toggle
        </MenuCheckboxItem>
      </Menu>,
    );
    expectNeutralRows();
    expect(propertyFor(box, '--perses-checkbox-color')).toBe('var(--perses-status-solid-warning)');
    rerender(
      <Menu open>
        <MenuItem>Action</MenuItem>
        <MenuLinkItem href="#link">Link</MenuLinkItem>
        <MenuCheckboxItem checked>Toggle</MenuCheckboxItem>
      </Menu>,
    );
    expectNeutralRows();
  });

  it('keeps explicit item colors local to that row', () => {
    render(
      <Menu defaultOpen>
        <MenuItem color="error" selected>
          Action
        </MenuItem>
        <MenuLinkItem href="#link" selected>
          Link
        </MenuLinkItem>
        <MenuCheckboxItem checked>Toggle</MenuCheckboxItem>
      </Menu>,
    );
    const [action, link] = items();
    expect(propertyFor(action ?? null, 'background-color')).toBe('var(--perses-bg-overlay)');
    expect(propertyFor(link ?? null, 'background-color')).toBe('var(--perses-bg-overlay)');
    expect(propertyFor(action?.querySelector('.ps-MenuItemBase__selected') ?? null, 'color')).toBe(
      'var(--perses-status-text-error)',
    );
    expect(propertyFor(link?.querySelector('.ps-MenuItemBase__selected') ?? null, 'color')).toBe(
      'var(--perses-status-text-default)',
    );
    expectNeutralRows();
    expect(propertyFor(indicator(), '--perses-checkbox-color')).toBe('var(--perses-status-solid-default)');
  });

  describe.each(['light', 'dark'] as const)('contrast in %s mode', (mode) => {
    it.each(colors)('keeps color=%s row text readable using only existing tokens', (color) => {
      render(
        <ThemeModeProvider mode={mode}>
          <Menu defaultOpen>
            <MenuItem color={color}>Action</MenuItem>
            <MenuLinkItem href="#link" color={color}>
              Link
            </MenuLinkItem>
            <MenuCheckboxItem checked color={color}>
              Toggle
            </MenuCheckboxItem>
          </Menu>
        </ThemeModeProvider>,
      );
      for (const item of items()) {
        expect(
          contrastRatio(propertyFor(item, 'color', true), propertyFor(item, 'background-color', true)),
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  it.each(['light', 'dark'] as const)('keeps keyboard focus distinguishable in %s mode', async (mode) => {
    render(
      <ThemeModeProvider mode={mode}>
        <Menu trigger={<button type="button">Open</button>}>
          <MenuItem>Action</MenuItem>
          <MenuLinkItem href="#link">Link</MenuLinkItem>
          <MenuCheckboxItem>Toggle</MenuCheckboxItem>
        </Menu>
      </ThemeModeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await expectNextItemFocusContrast(screen.getByRole('menuitem', { name: 'Action' }));
    await expectNextItemFocusContrast(screen.getByRole('menuitem', { name: 'Link' }));
    await expectNextItemFocusContrast(screen.getByRole('menuitemcheckbox', { name: 'Toggle' }));
  });

  describe.each(['light', 'dark'] as const)('selection check in %s mode', (mode) => {
    it.each(colors)('uses item color=%s without changing row colors', (color) => {
      render(
        <ThemeModeProvider mode={mode}>
          <Menu defaultOpen>
            <MenuItem selected color={color}>
              Action
            </MenuItem>
            <MenuLinkItem href="#link" selected color={color}>
              Link
            </MenuLinkItem>
            <MenuCheckboxItem checked color={color}>
              Toggle
            </MenuCheckboxItem>
          </Menu>
        </ThemeModeProvider>,
      );
      expect(
        screen.getByRole('menuitemcheckbox', { name: 'Toggle' }).querySelector('.ps-MenuItemBase__selected'),
      ).toBeNull();
      for (const item of screen.getAllByRole('menuitem')) {
        const check = item.querySelector('.ps-MenuItemBase__selected');
        expect(check).not.toBeNull();
        expect(check).toHaveAttribute('aria-hidden', 'true');
        expect(propertyFor(item, 'background-color')).toBe('var(--perses-bg-overlay)');
        expect(propertyFor(item, 'color')).toBe('var(--perses-text-primary)');
        expect(propertyFor(check, 'color')).toBe(`var(--perses-status-text-${color})`);
        expect(
          contrastRatio(propertyFor(check, 'color', true), propertyFor(item, 'background-color', true)),
        ).toBeGreaterThanOrEqual(3);
        expect(propertyFor(check, 'color', false, true)).toBe('CanvasText');
      }
    });
  });

  it('updates selection check colors without remounting and restores the default when color is removed', () => {
    const { rerender } = render(
      <Menu open>
        <MenuItem selected color="warning">
          Action
        </MenuItem>
        <MenuLinkItem href="#link" selected color="warning">
          Link
        </MenuLinkItem>
      </Menu>,
    );
    const action = screen.getByRole('menuitem', { name: 'Action' });
    const link = screen.getByRole('menuitem', { name: 'Link' });
    const checks = [action, link].map((item) => item.querySelector('.ps-MenuItemBase__selected'));
    for (const check of checks) {
      expect(check).not.toBeNull();
      expect(propertyFor(check, 'color')).toBe('var(--perses-status-text-warning)');
    }
    rerender(
      <Menu open>
        <MenuItem selected color="success">
          Action
        </MenuItem>
        <MenuLinkItem href="#link" selected color="success">
          Link
        </MenuLinkItem>
      </Menu>,
    );
    for (const [index, item] of [action, link].entries()) {
      expect(item.querySelector('.ps-MenuItemBase__selected')).toBe(checks[index]);
      expect(propertyFor(checks[index] ?? null, 'color')).toBe('var(--perses-status-text-success)');
    }
    rerender(
      <Menu open>
        <MenuItem selected>Action</MenuItem>
        <MenuLinkItem href="#link" selected>
          Link
        </MenuLinkItem>
      </Menu>,
    );
    for (const check of checks) expect(propertyFor(check, 'color')).toBe('var(--perses-status-text-default)');
  });

  describe.each([false, true])('forced-colors outline indicator (checked=%s)', (checked) => {
    it.each(colors)('preserves system mark and border colors for color=%s', (color) => {
      render(
        <Menu defaultOpen>
          <MenuCheckboxItem checked={checked} variant="outline" color={color}>
            Toggle
          </MenuCheckboxItem>
        </Menu>,
      );
      const box = indicator();
      expect(propertyFor(box, 'border-color', false, true)).toBe(checked ? 'Highlight' : 'ButtonText');
      if (checked) {
        expect(propertyFor(box, 'color', false, true)).toBe('HighlightText');
        expect(propertyFor(box, 'background-color', false, true)).toBe('Highlight');
      }
    });
  });

  it.each(['light', 'dark'] as const)('preserves item colors through the themed portal in %s mode', (mode) => {
    render(
      <ThemeModeProvider mode={mode}>
        <Menu defaultOpen>
          <MenuItem color="warning">Action</MenuItem>
          <MenuLinkItem href="#link" color="warning">
            Link
          </MenuLinkItem>
          <MenuCheckboxItem checked color="warning">
            Toggle
          </MenuCheckboxItem>
        </Menu>
      </ThemeModeProvider>,
    );
    expect(screen.getByRole('menu').parentElement).toHaveAttribute('data-perses-mode', mode);
    expectNeutralRows();
  });
});
