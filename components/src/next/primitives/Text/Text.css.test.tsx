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

import { TextHelper } from '../TextHelper';
import { Text } from './Text';

const customStyle = { color: '#663399' };

// jsdom does not apply cascade layers; preserve the selectors while unwrapping the component layer.
const css = readFileSync(resolve(__dirname, './text.css'), 'utf-8')
  .replace(/@import\s+[^;]+;/g, '')
  .replace('@layer perses.components {', '')
  .replace(/}\s*$/, '');

describe('Text CSS contracts', () => {
  const style = document.createElement('style');

  // jsdom cannot compute opacity containing var(); inspect the matching authored declarations instead.
  function getOpacity(element: Element): string {
    const rules = Array.from(style.sheet?.cssRules ?? []).filter(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && Boolean(rule.style.opacity) && element.matches(rule.selectorText),
    );
    return rules.at(-1)?.style.opacity ?? '1';
  }
  beforeAll(() => {
    style.textContent = css;
    document.head.append(style);
  });
  afterAll(() => {
    style.remove();
  });

  it('does not apply helper-specific width containment to ordinary text', () => {
    render(<Text as="p">Body text</Text>);
    const textStyle = getComputedStyle(screen.getByText('Body text'));
    expect(textStyle.contain).not.toContain('inline-size');
    expect(textStyle.margin).toBe('0px');
  });

  it.each(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const)('uses the font size token for %s', (size) => {
    render(<Text size={size}>Body text</Text>);
    expect(getComputedStyle(screen.getByText('Body text')).fontSize).toBe(`var(--perses-font-size-${size})`);
  });

  it.each(['light', 'regular', 'medium', 'bold'] as const)('uses the font weight token for %s', (weight) => {
    render(<Text weight={weight}>Body text</Text>);
    expect(getComputedStyle(screen.getByText('Body text')).fontWeight).toBe(`var(--perses-font-weight-${weight})`);
  });

  it.each([
    ['#663399', 'rgb(102, 51, 153)'],
    ['rebeccapurple', 'rgb(102, 51, 153)'],
    ['rgb(100 50 200 / 80%)', 'rgba(100, 50, 200, 0.8)'],
  ])('renders CSS color %s', (color, expected) => {
    render(<Text color={color}>Custom color</Text>);
    expect(getComputedStyle(screen.getByText('Custom color')).color).toBe(expected);
  });

  it.each([
    ['primary', 'var(--perses-text-primary)'],
    ['secondary', 'var(--perses-text-secondary)'],
    ['error', 'var(--perses-status-text-error)'],
    ['warning', 'var(--perses-status-text-warning)'],
    ['success', 'var(--perses-status-text-success)'],
    ['info', 'var(--perses-status-text-info)'],
    ['#663399', 'rgb(102, 51, 153)'],
  ] as const)('dims disabled %s text without replacing its color', (color, expected) => {
    const { rerender } = render(
      <Text disabled color={color}>
        Message
      </Text>,
    );
    const text = screen.getByText('Message');
    expect(getComputedStyle(text).color).toBe(expected);
    expect(getOpacity(text)).toBe('var(--perses-opacity-disabled, 0.5)');

    rerender(<Text color={color}>Message</Text>);
    expect(getComputedStyle(text).color).toBe(expected);
    expect(getOpacity(text) || '1').toBe('1');
  });

  it('preserves an explicit style color on disabled text', () => {
    render(
      <Text disabled color="error" style={customStyle}>
        Message
      </Text>,
    );
    const computed = getComputedStyle(screen.getByText('Message'));
    expect(computed.color).toBe('rgb(102, 51, 153)');
    expect(getOpacity(screen.getByText('Message'))).toBe('var(--perses-opacity-disabled, 0.5)');
  });

  it.each([undefined, 'error', 'warning', 'success', 'info'] as const)(
    'dims standalone helpers without replacing status=%s',
    (status) => {
      render(
        <TextHelper disabled status={status}>
          Hint
        </TextHelper>,
      );
      const computed = getComputedStyle(screen.getByText('Hint'));
      expect(computed.color).toBe(status ? `var(--perses-status-text-${status})` : 'var(--perses-text-secondary)');
      expect(getOpacity(screen.getByText('Hint'))).toBe('var(--perses-opacity-disabled, 0.5)');
    },
  );

  it('does not compound opacity on nested disabled text and helpers', () => {
    const { rerender } = render(
      <Text as="div" disabled>
        <TextHelper disabled status="error">
          Hint
        </TextHelper>
      </Text>,
    );
    const helper = screen.getByText('Hint');
    const parent = helper.parentElement;
    if (!parent) throw new Error('Missing text parent');
    expect(getOpacity(parent)).toBe('var(--perses-opacity-disabled, 0.5)');
    expect(getOpacity(helper)).toBe('1');

    rerender(
      <Text as="div">
        <TextHelper disabled status="error">
          Hint
        </TextHelper>
      </Text>,
    );
    expect(getOpacity(helper)).toBe('var(--perses-opacity-disabled, 0.5)');
  });

  it.each([
    ['primary', 'var(--perses-text-primary)'],
    ['secondary', 'var(--perses-text-secondary)'],

    ['error', 'var(--perses-status-text-error)'],
    ['warning', 'var(--perses-status-text-warning)'],
    ['success', 'var(--perses-status-text-success)'],
    ['info', 'var(--perses-status-text-info)'],
  ] as const)('uses semantic text color for %s', (color, expected) => {
    render(<Text color={color}>Body text</Text>);
    expect(getComputedStyle(screen.getByText('Body text')).color).toBe(expected);
  });
});
