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

import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { render, screen } from '@testing-library/react';

import { Text } from '../Text';
import { Switch } from './Switch';

const customTextStyle = { color: '#663399' };
const customLabel = (
  <Text disabled style={customTextStyle}>
    Custom label
  </Text>
);

// jsdom does not apply cascade layers; unwrap the component layer while preserving its selectors.
const switchCss = ['../Text/text.css', './switch.css']
  .map((path) =>
    readFileSync(resolve(__dirname, path), 'utf-8')
      .replace(/@import\s+[^;]+;/g, '')
      .replace('@layer perses.components {', '')
      .replace(/}\s*$/, ''),
  )
  .join('\n');

describe('Switch CSS contracts', () => {
  const style = document.createElement('style');

  // jsdom cannot compute opacity containing var(); inspect the matching authored declarations instead.
  function getOpacity(element: Element): string {
    const rules = Array.from(style.sheet?.cssRules ?? []).filter(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && Boolean(rule.style.opacity) && element.matches(rule.selectorText),
    );
    return rules.at(-1)?.style.opacity ?? '1';
  }

  function expectFullOpacity(element: Element): void {
    expect(getOpacity(element)).toBe('1');
  }

  beforeAll(() => {
    style.textContent = switchCss;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
  });

  it.each([false, true])('dims the disabled labeled switch once without replacing colors (checked=%s)', (checked) => {
    const { rerender } = render(<Switch label="Enable feature" checked={checked} disabled />);
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const label = screen.getByText('Enable feature');
    const wrapper = label.closest('label');
    if (!wrapper) throw new Error('Missing switch label wrapper');

    expect(control).toHaveAttribute('data-disabled');
    expect(getComputedStyle(label).color).toBe('var(--perses-text-primary)');
    expectFullOpacity(label);
    expectFullOpacity(control);
    expect(getOpacity(wrapper)).toBe('var(--perses-opacity-disabled, 0.5)');
    expect(getComputedStyle(wrapper).cursor).toBe('not-allowed');

    rerender(<Switch label="Enable feature" checked={checked} />);

    expect(control).not.toHaveAttribute('data-disabled');
    expect(getComputedStyle(label).color).toBe('var(--perses-text-primary)');
    expectFullOpacity(label);
    expectFullOpacity(wrapper);
    expect(getComputedStyle(wrapper).cursor).toBe('pointer');
  });

  it.each(['Field.Root', 'Fieldset.Root'] as const)(
    'follows inherited %s disabled state through Field.Root and dynamic re-enabling despite disabled={false}',
    (source) => {
      const { rerender } = render(
        <Fieldset.Root disabled={source === 'Fieldset.Root'}>
          <Field.Root disabled={source === 'Field.Root'}>
            <Switch label="Enable feature" disabled={false} />
          </Field.Root>
        </Fieldset.Root>,
      );
      const control = screen.getByRole('switch', { name: 'Enable feature' });
      const label = screen.getByText('Enable feature');

      expect(control).toHaveAttribute('data-disabled');
      expect(getComputedStyle(label).color).toBe('var(--perses-text-primary)');
      const wrapper = label.closest('label');
      if (!wrapper) throw new Error('Missing switch label wrapper');
      expect(getOpacity(wrapper)).toBe('var(--perses-opacity-disabled, 0.5)');
      expectFullOpacity(label);
      expectFullOpacity(control);

      rerender(
        <Fieldset.Root>
          <Field.Root>
            <Switch label="Enable feature" disabled={false} />
          </Field.Root>
        </Fieldset.Root>,
      );

      expect(control).not.toHaveAttribute('data-disabled');
      expect(getComputedStyle(label).color).toBe('var(--perses-text-primary)');
      expectFullOpacity(label);
    },
  );

  it.each([false, true])('preserves track/thumb dimming and checked styling (checked=%s)', (checked) => {
    const { rerender } = render(<Switch aria-label="Enable feature" checked={checked} disabled />);
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const thumb = control.querySelector('.ps-Switch__thumb');
    if (!thumb) throw new Error('Missing switch thumb');

    expect(getOpacity(control)).toBe('var(--perses-opacity-disabled, 0.5)');
    expectFullOpacity(thumb);
    expect(getComputedStyle(control).backgroundColor).toBe(
      checked ? 'var(--ps-switch-checked-bg)' : 'var(--perses-color-gray-300)',
    );
    expect(getComputedStyle(thumb).backgroundColor).toBe('var(--perses-color-white)');
    expect(getComputedStyle(thumb).transform).toBe(checked ? 'translateX(var(--ps-switch-thumb-size))' : '');

    rerender(<Switch aria-label="Enable feature" checked={checked} />);

    expectFullOpacity(control);
    expectFullOpacity(thumb);
    expect(getComputedStyle(control).backgroundColor).toBe(
      checked ? 'var(--ps-switch-checked-bg)' : 'var(--perses-color-gray-300)',
    );
    expect(getComputedStyle(thumb).backgroundColor).toBe('var(--perses-color-white)');
    expect(getComputedStyle(thumb).transform).toBe(checked ? 'translateX(var(--ps-switch-thumb-size))' : '');
  });

  it('preserves custom label colors without compounding disabled text opacity', () => {
    render(<Switch disabled label={customLabel} />);
    const label = screen.getByText('Custom label');
    expect(getComputedStyle(label).color).toBe('rgb(102, 51, 153)');
    expectFullOpacity(label);
    const wrapper = label.closest('label');
    if (!wrapper) throw new Error('Missing switch label wrapper');
    expect(getOpacity(wrapper)).toBe('var(--perses-opacity-disabled, 0.5)');
  });

  it.each([false, true])('keeps read-only labels styled as enabled (checked=%s)', (checked) => {
    render(<Switch label="Enable feature" checked={checked} readOnly />);
    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const label = screen.getByText('Enable feature');

    expect(control).toHaveAttribute('data-readonly');
    expect(control).not.toHaveAttribute('data-disabled');
    expect(getComputedStyle(label).color).toBe('var(--perses-text-primary)');
    expectFullOpacity(control);
    expectFullOpacity(label);
  });
});
