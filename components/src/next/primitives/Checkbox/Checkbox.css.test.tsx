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

import type { Size } from '../types';
import { Checkbox } from './Checkbox';
import type { CheckboxVariant } from './Checkbox';

// jsdom does not apply cascade layers; unwrap the component layer while preserving its selectors.
const checkboxCss = readFileSync(resolve(__dirname, './checkbox.css'), 'utf-8')
  .replace('@layer perses.components {', '')
  .replace(/}\s*$/, '');
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];

describe('Checkbox CSS contracts', () => {
  const style = document.createElement('style');

  beforeAll(() => {
    style.textContent = checkboxCss;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
  });

  it('uses the semantic control border while preserving the checkbox-specific override', () => {
    render(<Checkbox aria-label="Select row" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Select row' });

    // jsdom cannot resolve border shorthands containing variables; inspect the rule matching the rendered control.
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (candidate) =>
        candidate instanceof CSSStyleRule && checkbox.matches(candidate.selectorText) && candidate.style.border,
    );
    if (!(rule instanceof CSSStyleRule)) throw new Error('Missing checkbox border rule');
    expect(rule.style.border).toContain(
      'var(--perses-checkbox-border-color, var(--perses-border-control, var(--perses-border-default)))',
    );
  });

  it('preserves checked, indeterminate, invalid and disabled state styling', () => {
    const { rerender } = render(<Checkbox aria-label="Select row" checked />);
    const checkbox = screen.getByRole('checkbox', { name: 'Select row' });
    expect(getComputedStyle(checkbox).backgroundColor).toBe('var(--ps-checkbox-bg-subtle)');

    rerender(<Checkbox aria-label="Select row" checked={false} indeterminate />);
    expect(getComputedStyle(checkbox).backgroundColor).toBe('var(--ps-checkbox-bg-subtle)');

    rerender(<Checkbox aria-label="Select row" checked={false} invalid />);
    expect(getComputedStyle(checkbox).borderStyle).toBe('dashed');

    rerender(<Checkbox aria-label="Select row" checked={false} disabled />);
    expect(getComputedStyle(checkbox).backgroundColor).toBe('var(--perses-text-disabled)');
  });

  it.each([
    ['solid', 'var(--perses-checkbox-color)', 'var(--perses-text-on-solid)'],
    ['subtle', 'var(--ps-checkbox-bg-subtle)', 'var(--ps-checkbox-text)'],
    ['outline', 'rgba(0, 0, 0, 0)', 'var(--ps-checkbox-text)'],
  ] as const)('styles checked and indeterminate controls with variant=%s', (variant, background, color) => {
    const { rerender } = render(<Checkbox aria-label="Select row" variant={variant} checked />);
    const checkbox = screen.getByRole('checkbox', { name: 'Select row' });

    expect(getComputedStyle(checkbox).backgroundColor).toBe(background);
    expect(getComputedStyle(checkbox).color).toBe(color);

    rerender(<Checkbox aria-label="Select row" variant={variant} checked={false} indeterminate />);
    expect(getComputedStyle(checkbox).backgroundColor).toBe(background);
    expect(getComputedStyle(checkbox).color).toBe(color);

    rerender(<Checkbox aria-label="Select row" variant={variant} checked={false} />);
    expect(getComputedStyle(checkbox).backgroundColor).toBe(
      variant === 'outline' ? 'rgba(0, 0, 0, 0)' : 'var(--perses-bg-sunken)',
    );
  });

  it.each(['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'] as const)(
    'uses semantic subtle background and indicator text for color=%s',
    (color) => {
      render(<Checkbox aria-label="Select row" variant="subtle" color={color} checked />);
      const style = getComputedStyle(screen.getByRole('checkbox'));
      expect(style.getPropertyValue('--ps-checkbox-bg-subtle')).toBe(`var(--perses-status-bg-${color})`);
      expect(style.getPropertyValue('--ps-checkbox-text')).toBe(`var(--perses-status-text-${color})`);
    },
  );

  it.each<CheckboxVariant>(['solid', 'subtle', 'outline'])(
    'preserves disabled and invalid styling with variant=%s',
    (variant) => {
      const { rerender } = render(<Checkbox aria-label="Select row" variant={variant} checked disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(getComputedStyle(checkbox).backgroundColor).toBe('var(--perses-text-disabled)');
      expect(getComputedStyle(checkbox).color).toBe('var(--perses-bg-surface)');

      rerender(<Checkbox aria-label="Select row" variant={variant} checked={false} disabled />);
      expect(getComputedStyle(checkbox).backgroundColor).toBe('var(--perses-text-disabled)');

      rerender(<Checkbox aria-label="Select row" variant={variant} checked={false} invalid />);
      expect(getComputedStyle(checkbox).borderStyle).toBe('dashed');
    },
  );

  it.each(sizes)('uses content-independent inline alignment across selection states (%s)', (size) => {
    const { rerender } = render(<Checkbox aria-label="Select row" size={size} checked={false} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Select row' });

    expect(getComputedStyle(checkbox).verticalAlign).toBe('middle');

    rerender(<Checkbox aria-label="Select row" size={size} checked />);
    expect(getComputedStyle(checkbox).verticalAlign).toBe('middle');

    rerender(<Checkbox aria-label="Select row" size={size} checked={false} indeterminate />);
    expect(getComputedStyle(checkbox).verticalAlign).toBe('middle');

    rerender(<Checkbox aria-label="Select row" size={size} checked={false} />);
    expect(getComputedStyle(checkbox).verticalAlign).toBe('middle');
  });
});
