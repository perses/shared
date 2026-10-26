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

import { Text } from './Text';

// jsdom does not apply cascade layers; preserve the selectors while unwrapping the component layer.
const css = readFileSync(resolve(__dirname, './text.css'), 'utf-8')
  .replace(/@import\s+[^;]+;/g, '')
  .replace('@layer perses.components {', '')
  .replace(/}\s*$/, '');

describe('Text CSS contracts', () => {
  const style = document.createElement('style');
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
    ['disabled', 'var(--perses-text-disabled)'],
    ['error', 'var(--perses-status-text-error)'],
    ['warning', 'var(--perses-status-text-warning)'],
    ['success', 'var(--perses-status-text-success)'],
    ['info', 'var(--perses-status-text-info)'],
  ] as const)('uses semantic text color for %s', (color, expected) => {
    render(<Text color={color}>Body text</Text>);
    expect(getComputedStyle(screen.getByText('Body text')).color).toBe(expected);
  });
});
