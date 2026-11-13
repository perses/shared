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

const source = readFileSync(resolve(__dirname, './select.css'), 'utf-8');

// jsdom cannot resolve token values; inspect declarations from rules matching synthetic elements.
const css = source
  .replace(/@import\s+[^;]+;/g, '')
  .replace('@layer perses.components {', '')
  .replace(/}\s*$/, '');
const style = document.createElement('style');

// jsdom cannot evaluate media queries, so every block would match; skip forced-colors to read default-mode values.
function styleRules(): CSSStyleRule[] {
  const rules: CSSStyleRule[] = [];
  const visit = (list: CSSRuleList): void => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) rules.push(rule);
      else if (rule instanceof CSSMediaRule && !rule.conditionText.includes('forced-colors')) visit(rule.cssRules);
    }
  };
  visit(style.sheet?.cssRules ?? new CSSRuleList());
  return rules;
}

function propertyFor(element: Element, property: string): string {
  const matching = styleRules().filter((rule) => element.matches(rule.selectorText));
  expect(matching.length).toBeGreaterThan(0);
  return matching.reduce((value, rule) => rule.style.getPropertyValue(property) || value, '');
}

function rulesHiding(element: Element): CSSStyleRule[] {
  return styleRules().filter((rule) => element.matches(rule.selectorText) && rule.style.display === 'none');
}

function makeSelect(attributes: Record<string, string> = {}): {
  root: HTMLElement;
  control: HTMLElement;
  trigger: HTMLElement;
} {
  const root = document.createElement('div');
  root.className = 'ps-Select';
  for (const [name, value] of Object.entries(attributes)) root.setAttribute(name, value);
  const control = document.createElement('div');
  control.className = 'ps-Select__control';
  const trigger = document.createElement('button');
  trigger.className = 'ps-Select__trigger';
  control.append(trigger);
  root.append(control);
  document.body.append(root);
  return { root, control, trigger };
}

function makeChips(attributes: Record<string, string> = {}): {
  control: HTMLElement;
  chips: HTMLElement;
  chip: HTMLElement;
  more: HTMLElement;
} {
  const { control } = makeSelect(attributes);
  const chips = document.createElement('div');
  chips.className = 'ps-Select__chips';
  const chip = document.createElement('div');
  chip.className = 'ps-Chip ps-Select__chip';
  chip.setAttribute('data-overflow', '');
  const more = document.createElement('span');
  more.className = 'ps-Select__more';
  chips.append(chip, more);
  control.prepend(chips);
  return { control, chips, chip, more };
}

describe('select.css', () => {
  beforeAll(() => {
    style.textContent = css;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('declares its rules inside the components layer', () => {
    expect(source).toContain("@import '@perses-dev/design-tokens/css/layers';");
    expect(source).toContain('@layer perses.components {');
  });

  it('uses design tokens instead of raw colours and pixel values', () => {
    const declarations = source.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarations).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(declarations).not.toMatch(/\brgba?\(/);
    expect(declarations).not.toMatch(/\d+px/);
  });

  it('wraps every default-styling rule in :where() so a single consumer class wins', () => {
    const unwrapped = styleRules()
      .map((rule) => rule.selectorText)
      .filter((selector) => !selector.startsWith(':where('));
    // State and status rules are intentionally specific; defaults must stay zero-specificity.
    expect(unwrapped).toEqual([
      '.ps-Select__control:has(.ps-Select__trigger:focus-visible)',
      '.ps-Select__control:not(:focus-within):not([data-open]) .ps-Select__chip[data-overflow]',
      '.ps-Select__control[data-readonly]',
      '.ps-Select[data-disabled]',
      '.ps-Select[data-disabled] .ps-Text[data-disabled]',
      '.ps-Select__control[data-disabled]',
      ".ps-Select[data-status='error'] .ps-Select__control",
      ".ps-Select[data-status='warning'] .ps-Select__control",
      ".ps-Select[data-status='success'] .ps-Select__control",
      ".ps-Select[data-status='info'] .ps-Select__control",
    ]);
  });

  it('keeps sizing independent of the optional document reset', () => {
    const { root, control } = makeSelect();
    const popup = document.createElement('div');
    popup.className = 'ps-Select__popup';
    const list = document.createElement('div');
    list.className = 'ps-Select__list';
    const item = document.createElement('div');
    item.className = 'ps-SelectItem';
    for (const element of [root, control, popup, list, item]) {
      expect(propertyFor(element, 'box-sizing')).toBe('border-box');
    }
  });

  it.each(['xs', 'sm', 'md', 'lg'])(
    'sizes the %s control from a per-component token with a shared fallback',
    (size) => {
      const { control } = makeSelect({ 'data-size': size });
      expect(propertyFor(control, '--ps-select-size')).toBe(
        `var(--perses-select-size-${size}, var(--perses-control-size-${size}))`,
      );
      expect(propertyFor(control, 'min-height')).toBe('var(--ps-select-size)');
    },
  );

  it.each([
    ['xs', 'var(--perses-font-size-xs)', 'var(--perses-control-size-sm)'],
    ['sm', 'var(--perses-font-size-xs)', 'var(--perses-control-size-sm)'],
    ['md', 'var(--perses-font-size-sm)', 'var(--perses-control-size-sm)'],
    ['lg', 'var(--perses-font-size-md)', 'var(--perses-control-size-md)'],
  ])('scales the %s popup text and row height with the trigger', (size, fontSize, rowHeight) => {
    const popup = document.createElement('div');
    popup.className = 'ps-Select__popup';
    popup.setAttribute('data-size', size);
    const item = document.createElement('div');
    item.className = 'ps-SelectItem';
    popup.append(item);
    document.body.append(popup);
    expect(propertyFor(popup, 'font-size')).toBe(fontSize);
    expect(propertyFor(item, 'min-height')).toBe(rowHeight);
  });

  it('stretches the root and control when fullWidth is set', () => {
    const { root, control } = makeSelect({ 'data-full-width': 'true' });
    expect(propertyFor(root, 'display')).toBe('flex');
    expect(propertyFor(root, 'width')).toBe('100%');
    expect(propertyFor(control, 'display')).toBe('flex');
    expect(propertyFor(makeSelect().root, 'display')).toBe('inline-flex');
  });

  it.each([
    ['error', true],
    ['warning', true],
    ['success', false],
    ['info', false],
  ])('colours the %s border from the status token (thickened=%s)', (status, thickened) => {
    const { control } = makeSelect({ 'data-status': status });
    expect(propertyFor(control, 'border-color')).toBe(`var(--perses-status-border-${status})`);
    expect(propertyFor(control, 'box-shadow') !== '').toBe(thickened);
  });

  it('dims the disabled root once and not the disabled helper text again', () => {
    const { root } = makeSelect({ 'data-disabled': '' });
    const helper = document.createElement('p');
    helper.className = 'ps-Text';
    helper.setAttribute('data-disabled', '');
    root.append(helper);
    expect(propertyFor(root, 'opacity')).toBe('var(--perses-opacity-disabled, 0.5)');
    expect(propertyFor(helper, 'opacity')).toBe('1');
  });

  it('sizes the popup from the anchor and available height and stacks it on the overlay layer', () => {
    const positioner = document.createElement('div');
    positioner.className = 'ps-Select__positioner';
    const popup = document.createElement('div');
    popup.className = 'ps-Select__popup';
    positioner.append(popup);
    document.body.append(positioner);
    expect(propertyFor(positioner, 'z-index')).toBe('var(--perses-z-index-overlay)');
    expect(propertyFor(popup, 'min-width')).toBe('var(--anchor-width)');
    expect(propertyFor(popup, 'max-height')).toBe('var(--available-height)');
    expect(propertyFor(popup, 'overflow')).toBe('hidden');
    expect(propertyFor(popup, 'background-color')).toBe('var(--perses-bg-overlay)');
    expect(propertyFor(popup, 'box-shadow')).toBe('var(--perses-shadow-overlay)');
    expect(propertyFor(popup, 'z-index')).toBe('');
  });

  it('draws the focus ring on the control while its trigger has keyboard focus', () => {
    const ring = styleRules().find(
      (rule) => rule.selectorText === '.ps-Select__control:has(.ps-Select__trigger:focus-visible)',
    );
    expect(ring?.style.getPropertyValue('outline')).toBe(
      'var(--perses-focus-ring-width) solid var(--perses-focus-ring-color)',
    );
    expect(ring?.style.getPropertyValue('outline-offset')).toBe('var(--perses-focus-ring-offset)');
  });

  it('makes the inner list the scroller so a header can sit above it', () => {
    const popup = document.createElement('div');
    popup.className = 'ps-Select__popup';
    const list = document.createElement('div');
    list.className = 'ps-Select__list';
    popup.append(list);
    document.body.append(popup);
    expect(propertyFor(list, 'overflow-y')).toBe('auto');
    expect(propertyFor(list, 'min-height')).toBe('0');
    expect(propertyFor(popup, 'overflow')).toBe('hidden');
  });

  it('insets the popup and rounds each row so the ring and rows share the Menu density', () => {
    const popup = document.createElement('div');
    popup.className = 'ps-Select__popup';
    const item = document.createElement('div');
    item.className = 'ps-SelectItem';
    const label = document.createElement('div');
    label.className = 'ps-SelectGroup__label';
    popup.append(label, item);
    document.body.append(popup);
    expect(propertyFor(popup, 'padding')).toBe('var(--perses-spacing-xs)');
    expect(propertyFor(item, 'padding')).toBe('var(--perses-spacing-xs) var(--perses-spacing-sm)');
    expect(propertyFor(item, 'border-radius')).toBe('var(--perses-radius-md)');
    expect(propertyFor(label, 'padding')).toBe(propertyFor(item, 'padding'));
  });

  it('flips only the default chevron while the list is open', () => {
    const trigger = document.createElement('button');
    trigger.className = 'ps-Select__trigger';
    trigger.setAttribute('data-popup-open', '');
    const icon = document.createElement('span');
    icon.className = 'ps-Select__icon';
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'ps-Select__chevron');
    icon.append(chevron);
    trigger.append(icon);
    document.body.append(trigger);
    expect(propertyFor(chevron, 'transform')).toBe('rotate(180deg)');
    expect(propertyFor(icon, 'transform')).toBe('');
  });

  it('marks the focused row with an inset focus ring only for keyboard focus, like Menu', () => {
    const rules = styleRules();
    const ring = rules.find((rule) => rule.selectorText === ':where(.ps-SelectItem:focus-visible)');
    expect(ring?.style.getPropertyValue('outline')).toBe(
      'var(--perses-focus-ring-width) solid var(--perses-focus-ring-color)',
    );
    expect(ring?.style.getPropertyValue('outline-offset')).toBe('calc(-1 * var(--perses-focus-ring-offset))');
    expect(ring?.style.getPropertyValue('background-color')).toBe('');
    // Base UI moves DOM focus to an option on pointer hover too, so the highlight attribute must not draw the ring.
    const highlightRings = rules.filter(
      (rule) => rule.selectorText.includes('data-highlighted') && rule.style.getPropertyValue('outline'),
    );
    expect(highlightRings).toEqual([]);
  });

  it('gives a hovered enabled row a neutral fill, like Menu', () => {
    const hover = styleRules().find(
      (rule) => rule.selectorText === ':where(.ps-SelectItem:hover:not([data-disabled]))',
    );
    expect(hover?.style.getPropertyValue('background-color')).toBe('var(--perses-status-bg-default)');
  });

  it('gives the root a minimum width that cannot overflow a narrower container', () => {
    expect(propertyFor(makeSelect().root, 'min-width')).toBe('min(10rem, 100%)');
  });

  it('keeps the selected row neutral and lets the check carry the selection colour', () => {
    const item = document.createElement('div');
    item.className = 'ps-SelectItem';
    item.setAttribute('data-selected', '');
    const indicator = document.createElement('span');
    indicator.className = 'ps-SelectItem__indicator';
    item.append(indicator);
    document.body.append(item);
    expect(propertyFor(item, 'background-color')).toBe('');
    expect(propertyFor(item, 'color')).toBe('');
    expect(propertyFor(item, 'box-shadow')).toBe('');
    expect(propertyFor(indicator, 'color')).toBe('var(--perses-status-text-primary)');
  });

  it('shows the check indicator only on the selected item while keeping its space', () => {
    const item = document.createElement('div');
    item.className = 'ps-SelectItem';
    const indicator = document.createElement('span');
    indicator.className = 'ps-SelectItem__indicator';
    item.append(indicator);
    document.body.append(item);
    expect(propertyFor(indicator, 'visibility')).toBe('hidden');
    item.setAttribute('data-selected', '');
    expect(propertyFor(indicator, 'visibility')).toBe('visible');
  });

  it('restates the focus ring and check in system colours when colours are forced', () => {
    const forced = source.slice(source.indexOf('@media (forced-colors: active)'));
    // The default focus rule is deliberately specific, so its forced-colors restatement must not be in :where().
    expect(forced).toMatch(
      /\n\s*\.ps-Select__control:has\(\.ps-Select__trigger:focus-visible\) \{[^}]*outline-color: Highlight/,
    );
    expect(forced).not.toContain(':where(.ps-Select__control:has(');
    expect(forced).toMatch(/\.ps-SelectItem:focus-visible\)[\s\S]*?outline-color: Highlight/);
    expect(forced).toMatch(/\.ps-SelectItem__indicator\)[\s\S]*?color: CanvasText/);
  });

  it('thickens the error and warning border when colours are forced, since box-shadow is dropped', () => {
    const forced = source.slice(source.indexOf('@media (forced-colors: active)'));
    expect(forced).toMatch(
      /\.ps-Select\[data-status='error'\] \.ps-Select__control,\s*\.ps-Select\[data-status='warning'\] \.ps-Select__control \{\s*border-width: var\(--perses-border-width-md\)/,
    );
  });

  describe('chips', () => {
    it('caps the chip area at six chip rows and scrolls beyond', () => {
      const { chips } = makeChips({ 'data-size': 'md' });
      expect(propertyFor(chips, 'max-height')).toBe(
        'calc(6 * var(--ps-select-chip-row) + 5 * var(--perses-spacing-xs))',
      );
      expect(propertyFor(chips, 'overflow-y')).toBe('auto');
    });

    it.each([
      ['xs', 'xs'],
      ['sm', 'xs'],
      ['md', 'sm'],
      ['lg', 'sm'],
    ])('sizes the chip row of a %s field like a %s chip', (size, chipStep) => {
      const { chips } = makeChips({ 'data-size': size });
      expect(propertyFor(chips, '--ps-select-chip-row')).toBe(
        `var(--perses-chip-size-${chipStep}, var(--perses-selection-control-size-${chipStep}))`,
      );
    });

    it('draws an inset focus ring on a focused chip only for keyboard focus', () => {
      const ring = styleRules().find((rule) => rule.selectorText === ':where(.ps-Select__chip:focus-visible)');
      expect(ring?.style.getPropertyValue('outline')).toBe(
        'var(--perses-focus-ring-width) solid var(--perses-focus-ring-color)',
      );
      expect(ring?.style.getPropertyValue('outline-offset')).toBe('calc(-1 * var(--perses-focus-ring-offset))');
    });

    it('restates the chip focus ring in the Highlight system colour when colours are forced', () => {
      const forced = source.slice(source.indexOf('@media (forced-colors: active)'));
      expect(forced).toMatch(/:where\(\.ps-Select__chip:focus-visible\) \{[^}]*outline-color: Highlight/);
    });

    it('wraps the control only when it holds chips', () => {
      const { control } = makeChips();
      expect(propertyFor(control, 'flex-wrap')).toBe('wrap');
      expect(styleRules().some((rule) => makeSelect().control.matches(rule.selectorText) && rule.style.flexWrap)).toBe(
        false,
      );
    });

    it('lets a chips container that holds the search input fill the control, and no other', () => {
      const { chips } = makeChips();
      expect(styleRules().some((rule) => chips.matches(rule.selectorText) && rule.style.flex)).toBe(false);

      const input = document.createElement('input');
      input.className = 'ps-Select__trigger ps-Select__input';
      chips.append(input);
      expect(propertyFor(chips, 'flex')).toBe('1 1 4rem');
    });

    it('hides overflow chips and shows +N only while focus is outside and the list is closed', () => {
      const { control, chip, more } = makeChips();
      expect(propertyFor(chip, 'display')).toBe('none');
      expect(propertyFor(more, 'display')).toBe('inline-flex');

      control.setAttribute('data-open', '');
      const hidingChip = styleRules().filter(
        (rule) => chip.matches(rule.selectorText) && rule.style.display === 'none',
      );
      expect(hidingChip).toEqual([]);
      expect(propertyFor(more, 'display')).toBe('none');
    });

    it('hides visually hidden text without removing it from the accessibility tree', () => {
      const hidden = document.createElement('span');
      hidden.className = 'ps-Select__visually-hidden';
      document.body.append(hidden);
      expect(propertyFor(hidden, 'position')).toBe('absolute');
      expect(propertyFor(hidden, 'clip-path')).toBe('inset(50%)');
      expect(propertyFor(hidden, 'width')).toBe('0.0625rem');
      expect(propertyFor(hidden, 'height')).toBe('0.0625rem');
      expect(propertyFor(hidden, 'overflow')).toBe('hidden');
      expect(propertyFor(hidden, 'white-space')).toBe('nowrap');
    });
  });

  it('resets the search input so it sizes inside the control', () => {
    const input = document.createElement('input');
    input.className = 'ps-Select__trigger ps-Select__input';
    document.body.append(input);
    expect(propertyFor(input, 'box-sizing')).toBe('border-box');
    expect(propertyFor(input, 'min-width')).toBe('4rem');
  });

  it('styles the empty and loading message as secondary text', () => {
    const empty = document.createElement('div');
    empty.className = 'ps-Select__empty';
    document.body.append(empty);
    expect(propertyFor(empty, 'color')).toBe('var(--perses-text-secondary)');
    expect(propertyFor(empty, 'flex')).toBe('none');
  });

  it('hides an empty message element, which the search engine keeps mounted, but not one with text', () => {
    const empty = document.createElement('div');
    empty.className = 'ps-Select__empty';
    const filled = document.createElement('div');
    filled.className = 'ps-Select__empty';
    filled.textContent = 'No results';
    document.body.append(empty, filled);

    expect(propertyFor(empty, 'display')).toBe('none');
    expect(rulesHiding(filled)).toEqual([]);
  });

  it('only animates when the user has not asked for reduced motion', () => {
    const mediaRules = Array.from(style.sheet?.cssRules ?? []).filter(
      (rule): rule is CSSMediaRule => rule instanceof CSSMediaRule,
    );
    const motion = mediaRules.find((rule) => rule.conditionText === '(prefers-reduced-motion: no-preference)');
    expect(motion).toBeDefined();
    const transitions = styleRules().filter((rule) => rule.style.transition);
    expect(transitions.length).toBeGreaterThan(0);
    for (const rule of transitions) expect(rule.parentRule).toBe(motion);
  });
});
