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

const source = readFileSync(resolve(__dirname, './formControl.css'), 'utf-8');
const forcedColors = source.slice(source.indexOf('@media (forced-colors: active)'));

// jsdom cannot resolve token values; inspect declarations from rules matching synthetic elements.
const css = source
  .replace(/@import\s+[^;]+;/g, '')
  .replace('@layer perses.components {', '')
  .replace(/}\s*$/, '');
const style = document.createElement('style');

function styleRules(): CSSStyleRule[] {
  return Array.from(style.sheet?.cssRules ?? []).filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
}

function propertyFor(element: Element, property: string): string {
  const matching = styleRules().filter((rule) => element.matches(rule.selectorText));
  return matching.reduce((value, rule) => rule.style.getPropertyValue(property) || value, '');
}

function make(className: string, tag = 'div', attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  return element;
}

describe('formControl.css contracts', () => {
  beforeAll(() => {
    style.textContent = css;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
    document.body.innerHTML = '';
  });

  it('T25 is wrapped in the components layer and uses tokens only', () => {
    expect(source).toContain('@layer perses.components {');
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\b\d+px\b/);
    expect(source).not.toContain('!important');
  });

  it('T25 wraps overridable defaults in :where()', () => {
    expect(source).toMatch(/:where\(\.ps-FormControl\)\s*\{[^}]*display:\s*flex/);
    expect(source).toMatch(/:where\(\.ps-FormGroup\)\s*\{[^}]*display:\s*flex/);
    expect(source).toMatch(/:where\(\.ps-FormGroup\)\s*\{[^}]*border:\s*0/);
    expect(source).toMatch(/:where\(\.ps-FormControlLabel\)\s*\{[^}]*display:\s*inline-flex/);
  });

  it('sizes FormControl and FormGroup roots with border-box so width includes padding', () => {
    expect(propertyFor(make('ps-FormControl'), 'box-sizing')).toBe('border-box');
    expect(propertyFor(make('ps-FormGroup', 'fieldset'), 'box-sizing')).toBe('border-box');
  });

  it('T25 styles the state selectors each part emits', () => {
    expect(propertyFor(make('ps-FormControl'), 'display')).toBe('flex');
    expect(propertyFor(make('ps-FormGroup', 'fieldset'), 'min-inline-size')).toBe('0');
    expect(propertyFor(make('ps-FormLabel', 'label', { 'data-disabled': '' }), 'color')).toContain('disabled');
    expect(propertyFor(make('ps-FormLabel', 'label', { 'data-invalid': '' }), 'color')).toContain('error');
    expect(
      propertyFor(
        make('ps-FormControlLabel', 'label', {
          'data-label-placement': 'start',
        }),
        'flex-direction',
      ),
    ).toBe('row-reverse');
    expect(propertyFor(make('ps-FormControlLabel', 'label', { 'data-disabled': '' }), 'cursor')).toBe('not-allowed');
  });

  it('T25 draws the required indicator with aria-ignorable generated content', () => {
    expect(source).toMatch(/\.ps-FormControl\[data-required\] \.ps-FormLabel::after\s*\{[^}]*content:\s*'\*' \/ ''/);
  });

  it('restates disabled and error cues in system colours when colours are forced', () => {
    expect(forcedColors).toMatch(
      /\.ps-FormLabel\[data-disabled\],[^{]*\.ps-FormControlLabel\[data-disabled\] \{[^}]*color: GrayText/,
    );
    expect(forcedColors).toMatch(/\.ps-FormLabel\[data-invalid\],[^{]*::after \{[^}]*color: CanvasText/);
  });

  it('T25 scales label and helper text from the FormControl size', () => {
    const root = make('ps-FormControl', 'div', { 'data-size': 'lg' });
    const label = document.createElement('label');
    label.className = 'ps-FormLabel';
    root.append(label);
    expect(propertyFor(label, 'font-size')).toContain('--perses-font-size-md');
  });
});
