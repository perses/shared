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
import type { ColorVariant, Size, Status } from '../types';
import { Checkbox } from './Checkbox';
import type { CheckboxStyle, CheckboxVariant } from './Checkbox';

// jsdom does not apply cascade layers; unwrap the component layer while preserving its selectors.
const checkboxCss = readFileSync(resolve(__dirname, './checkbox.css'), 'utf-8')
  .replace(/@import\s+[^;]+;/g, '')
  .replace('@layer perses.components {', '')
  .replace(/}\s*$/, '');
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const colors: Array<ColorVariant | Status> = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
const customStyle: CheckboxStyle = {
  '--perses-checkbox-color': '#663399',
  color: '#663399',
  backgroundColor: '#ddeeff',
};
const customLabel = (
  <Text disabled color="#663399">
    Custom label
  </Text>
);

describe('Checkbox CSS contracts', () => {
  const style = document.createElement('style');

  // jsdom cannot compute opacity containing var(); inspect matching authored declarations instead.
  function getOpacity(element: Element): string {
    const rules = Array.from(style.sheet?.cssRules ?? []).filter(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && Boolean(rule.style.opacity) && element.matches(rule.selectorText),
    );
    return rules.at(-1)?.style.opacity ?? '1';
  }

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
    expect(getComputedStyle(checkbox).backgroundColor).toBe('var(--perses-bg-sunken)');
    expect(getOpacity(checkbox)).toBe('var(--perses-opacity-disabled, 0.5)');
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
      const computed = getComputedStyle(screen.getByRole('checkbox'));
      expect(computed.getPropertyValue('--ps-checkbox-bg-subtle')).toBe(`var(--perses-status-bg-${color})`);
      expect(computed.getPropertyValue('--ps-checkbox-text')).toBe(`var(--perses-status-text-${color})`);
    },
  );

  describe.each<CheckboxVariant>(['solid', 'subtle', 'outline'])('disabled variant=%s', (variant) => {
    it.each(['unchecked', 'checked', 'indeterminate'])('preserves all color choices when %s', (state) => {
      const checked = state === 'checked';
      const indeterminate = state === 'indeterminate';
      const { rerender } = render(<Checkbox aria-label="Select row" checked={checked} indeterminate={indeterminate} />);
      const checkbox = screen.getByRole('checkbox');

      for (const color of colors) {
        rerender(
          <Checkbox
            aria-label="Select row"
            variant={variant}
            color={color}
            checked={checked}
            indeterminate={indeterminate}
          />,
        );
        const enabled = getComputedStyle(checkbox);
        const normalColors = { color: enabled.color, background: enabled.backgroundColor, border: enabled.borderColor };

        rerender(
          <Checkbox
            aria-label="Select row"
            variant={variant}
            color={color}
            checked={checked}
            indeterminate={indeterminate}
            disabled
          />,
        );
        const disabled = getComputedStyle(checkbox);
        expect(disabled.color).toBe(normalColors.color);
        expect(disabled.backgroundColor).toBe(normalColors.background);
        expect(disabled.borderColor).toBe(normalColors.border);
        expect(getOpacity(checkbox)).toBe('var(--perses-opacity-disabled, 0.5)');
        expect(checkbox).toHaveAttribute('aria-disabled', 'true');
        expect(checkbox).toHaveAttribute('aria-checked', indeterminate ? 'mixed' : String(checked));
      }
    });

    it('restores full opacity when re-enabled and keeps read-only and invalid styling', () => {
      const { rerender } = render(<Checkbox aria-label="Select row" variant={variant} checked disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(getOpacity(checkbox)).toBe('var(--perses-opacity-disabled, 0.5)');

      rerender(<Checkbox aria-label="Select row" variant={variant} checked readOnly />);
      expect(getOpacity(checkbox)).toBe('1');
      expect(checkbox).not.toHaveAttribute('data-disabled');

      rerender(<Checkbox aria-label="Select row" variant={variant} checked={false} indeterminate disabled />);
      expect(getComputedStyle(checkbox).backgroundColor).toBe('var(--perses-text-disabled)');
      expect(getComputedStyle(checkbox).color).toBe('var(--perses-bg-surface)');
      expect(getComputedStyle(checkbox).cursor).toBe('not-allowed');

      rerender(<Checkbox aria-label="Select row" variant={variant} checked={false} invalid />);
      expect(getComputedStyle(checkbox).borderStyle).toBe('dashed');
      // jsdom does not consistently compute variable border colors after state changes.
      const borderRules = Array.from(style.sheet?.cssRules ?? []).filter(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule &&
          checkbox.matches(rule.selectorText) &&
          Boolean(rule.style.getPropertyValue('border-color')),
      );
      expect(borderRules.at(-1)?.style.getPropertyValue('border-color')).toBe('var(--perses-status-border-error)');
    });
  });

  it.each(['start', 'end'] as const)(
    'dims the labelPosition=%s group once without replacing label colors',
    (labelPosition) => {
      const { rerender } = render(
        <Checkbox label="Accept terms" labelPosition={labelPosition} checked disabled color="primary" />,
      );
      const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
      const label = screen.getByText('Accept terms');
      const wrapper = checkbox.closest('label');
      if (!wrapper) throw new Error('Missing checkbox label wrapper');
      expect(getOpacity(wrapper)).toBe('var(--perses-opacity-disabled, 0.5)');
      expect(getOpacity(checkbox)).toBe('1');
      expect(getOpacity(label)).toBe('1');
      expect(getComputedStyle(label).color).toBe('var(--perses-text-primary)');
      expect(getComputedStyle(wrapper).cursor).toBe('not-allowed');

      rerender(<Checkbox label="Accept terms" labelPosition={labelPosition} checked color="primary" />);
      expect(getOpacity(wrapper)).toBe('1');
      expect(getOpacity(checkbox)).toBe('1');
      expect(getComputedStyle(wrapper).cursor).toBe('pointer');
    },
  );

  it.each(['Field.Root', 'Fieldset.Root'] as const)(
    'follows inherited %s disabled state through Field.Root',
    (source) => {
      const { rerender } = render(
        <Fieldset.Root disabled={source === 'Fieldset.Root'}>
          <Field.Root disabled={source === 'Field.Root'}>
            <Checkbox label="Accept terms" disabled={false} checked color="success" />
          </Field.Root>
        </Fieldset.Root>,
      );
      const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
      const wrapper = checkbox.closest('label');
      if (!wrapper) throw new Error('Missing checkbox label wrapper');
      expect(checkbox).toHaveAttribute('data-disabled');
      expect(getOpacity(wrapper)).toBe('var(--perses-opacity-disabled, 0.5)');
      expect(getOpacity(checkbox)).toBe('1');
      expect(getComputedStyle(screen.getByText('Accept terms')).color).toBe('var(--perses-text-primary)');
      expect(getComputedStyle(wrapper).cursor).toBe('not-allowed');

      rerender(
        <Fieldset.Root>
          <Field.Root>
            <Checkbox label="Accept terms" disabled={false} checked color="success" />
          </Field.Root>
        </Fieldset.Root>,
      );
      expect(checkbox).not.toHaveAttribute('data-disabled');
      expect(getOpacity(wrapper)).toBe('1');
      expect(getOpacity(checkbox)).toBe('1');
      expect(getComputedStyle(wrapper).cursor).toBe('pointer');
    },
  );

  it('preserves custom control colors while disabled', () => {
    render(<Checkbox aria-label="Select row" checked disabled style={customStyle} />);
    const checkbox = screen.getByRole('checkbox');
    const computed = getComputedStyle(checkbox);
    expect(computed.getPropertyValue('--perses-checkbox-color')).toBe('#663399');
    expect(computed.color).toBe('rgb(102, 51, 153)');
    expect(computed.backgroundColor).toBe('rgb(221, 238, 255)');
    expect(getOpacity(checkbox)).toBe('var(--perses-opacity-disabled, 0.5)');
  });

  it('preserves custom label colors without compounding nested disabled text opacity', () => {
    render(<Checkbox label={customLabel} checked disabled />);
    const text = screen.getByText('Custom label');
    const wrapper = text.closest('label');
    if (!wrapper) throw new Error('Missing checkbox label wrapper');
    expect(getComputedStyle(text).color).toBe('rgb(102, 51, 153)');
    expect(getOpacity(text)).toBe('1');
    expect(getOpacity(wrapper)).toBe('var(--perses-opacity-disabled, 0.5)');
  });
  it.each([undefined, '', 'true', 'false'])(
    'styles invalid controls by marker presence, not its value (%s)',
    (marker) => {
      render(<Checkbox aria-label="Select row" checked={false} />);
      const checkbox = screen.getByRole('checkbox', { name: 'Select row' });
      if (marker !== undefined) checkbox.setAttribute('data-invalid', marker);

      // jsdom cannot resolve the variable-based base border shorthand, but it can apply the invalid longhand.
      if (marker === undefined) expect(getComputedStyle(checkbox).borderStyle).not.toBe('dashed');
      else expect(getComputedStyle(checkbox).borderStyle).toBe('dashed');
    },
  );

  it.each([undefined, '', 'true', 'false'])(
    'styles disabled labels by marker presence, not its value (%s)',
    (marker) => {
      render(<Checkbox label="Select row" />);
      const label = screen.getByRole('checkbox', { name: 'Select row' }).closest('label');
      if (!label) throw new Error('Missing checkbox label wrapper');
      if (marker !== undefined) label.setAttribute('data-disabled', marker);

      expect(getComputedStyle(label).color).toBe(
        marker === undefined ? 'var(--perses-text-primary)' : 'var(--perses-text-disabled)',
      );
      expect(getComputedStyle(label).cursor).toBe(marker === undefined ? 'pointer' : 'not-allowed');
    },
  );

  it.each<CheckboxVariant>(['solid', 'subtle', 'outline'])(
    'preserves forced-color selection and disabled precedence with variant=%s',
    (variant) => {
      const forcedColors = Array.from(style.sheet?.cssRules ?? []).find(
        (rule): rule is CSSMediaRule =>
          rule instanceof CSSMediaRule && /\(forced-colors:\s*active\)/.test(rule.conditionText),
      );
      if (!forcedColors) throw new Error('Missing forced-colors rules');

      const { rerender } = render(<Checkbox aria-label="Select row" variant={variant} checked={false} />);
      const checkbox = screen.getByRole('checkbox', { name: 'Select row' });
      // jsdom does not activate media queries or resolve system colors. Match the original media selectors
      // and inspect their winning declarations in source order, preserving descendant and state conditions.
      function propertyFor(property: string): string {
        const rules = Array.from(forcedColors?.cssRules ?? []).filter(
          (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && checkbox.matches(rule.selectorText),
        );
        expect(rules.length).toBeGreaterThan(0);
        return rules.reduce((value, rule) => rule.style.getPropertyValue(property) || value, '');
      }

      expect(propertyFor('border-color')).toBe('ButtonText');
      for (const state of [{ checked: true }, { checked: false, indeterminate: true }]) {
        rerender(<Checkbox aria-label="Select row" variant={variant} {...state} />);
        expect(propertyFor('border-color')).toBe('Highlight');
        expect(propertyFor('color')).toBe('HighlightText');
        expect(propertyFor('background-color')).toBe('Highlight');

        rerender(<Checkbox aria-label="Select row" variant={variant} {...state} disabled />);
        expect(propertyFor('border-color')).toBe('GrayText');
        expect(propertyFor('color')).toBe('GrayText');
        expect(propertyFor('background-color')).toBe('transparent');
      }
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
