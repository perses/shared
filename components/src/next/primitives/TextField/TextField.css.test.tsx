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

import { Fieldset } from '@base-ui/react/fieldset';
import { render, screen } from '@testing-library/react';

import { Text } from '../Text';
import { TextField } from './TextField';

const customTextStyle = { color: '#663399' };
const customHint = (
  <Text disabled style={customTextStyle}>
    Custom hint
  </Text>
);

// jsdom does not apply cascade layers; preserve the selectors while unwrapping the component layer.
const textFieldCss = ['../Text/text.css', '../TextHelper/textHelper.css', './textField.css']
  .map((path) =>
    readFileSync(resolve(__dirname, path), 'utf-8')
      .replace(/@import\s+[^;]+;/g, '')
      .replace('@layer perses.components {', '')
      .replace(/}\s*$/, ''),
  )
  .join('\n');

describe('TextField CSS contracts', () => {
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
    style.textContent = textFieldCss;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
  });

  it.each([false, true])('dims the disabled field once while preserving colors (multiline=%s)', (multiline) => {
    const { rerender } = render(
      <TextField
        label="Name"
        multiline={multiline}
        disabled
        status="error"
        helperText="Hint"
        startElement="$"
        endElement="%"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    const root = input.closest('.ps-TextField');
    const supportingText = [
      screen.getByText('Name'),
      screen.getByText('Hint'),
      screen.getByText('$'),
      screen.getByText('%'),
    ];
    expect(root).toHaveAttribute('data-disabled');
    expect(input).toBeDisabled();
    if (!root) throw new Error('Missing text field root');
    expect(getOpacity(root)).toBe('var(--perses-opacity-disabled, 0.5)');
    expect(getComputedStyle(input).color).toBe('var(--perses-text-primary)');
    expect(getComputedStyle(screen.getByText('Hint')).color).toBe('var(--perses-status-text-error)');
    for (const element of [screen.getByText('Name'), screen.getByText('$'), screen.getByText('%')]) {
      expect(getComputedStyle(element).color).toBe('var(--perses-text-secondary)');
    }
    for (const element of [input, ...supportingText]) {
      expect(getOpacity(element) || '1').toBe('1');
    }

    rerender(<TextField label="Name" multiline={multiline} helperText="Hint" startElement="$" endElement="%" />);
    expect(root).not.toHaveAttribute('data-disabled');
    expect(getOpacity(root) || '1').toBe('1');
    expect(input).not.toBeDisabled();
    expect(getComputedStyle(input).color).toBe('var(--perses-text-primary)');
    for (const element of supportingText) expect(getComputedStyle(element).color).toBe('var(--perses-text-secondary)');
  });

  it.each([false, true])('does not dim read-only text (multiline=%s)', (multiline) => {
    render(<TextField label="Name" multiline={multiline} readOnly helperText="Hint" startElement="$" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(getComputedStyle(input).color).toBe('var(--perses-text-primary)');
    for (const element of [screen.getByText('Name'), screen.getByText('Hint'), screen.getByText('$')]) {
      const computed = getComputedStyle(element);
      expect(computed.color).toBe('var(--perses-text-secondary)');
      expect(getOpacity(element) || '1').toBe('1');
    }
  });

  it.each([false, true])(
    'does not override placeholder colors or add placeholder dimming (multiline=%s)',
    (multiline) => {
      render(<TextField label="Name" multiline={multiline} disabled placeholder="Enter a name" />);
      const input = screen.getByRole('textbox', { name: 'Name' });
      // jsdom cannot compute pseudo-element styles; inspect the placeholder rule matching the rendered control.
      const rule = Array.from(style.sheet?.cssRules ?? []).find(
        (candidate) =>
          candidate instanceof CSSStyleRule &&
          candidate.selectorText.endsWith('::placeholder') &&
          input.matches(candidate.selectorText.replace('::placeholder', '')),
      );
      if (!(rule instanceof CSSStyleRule)) throw new Error('Missing placeholder rule');
      expect(rule.style.getPropertyValue('color')).toBe('');
      expect(rule.style.opacity).toBe('1');
    },
  );

  it.each([false, true])('leaves enabled and read-only placeholder opacity unchanged (readOnly=%s)', (readOnly) => {
    render(<TextField label="Name" readOnly={readOnly} placeholder="Enter a name" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    const matchingOpacityRules = Array.from(style.sheet?.cssRules ?? []).filter(
      (rule) =>
        rule instanceof CSSStyleRule &&
        rule.selectorText.endsWith('::placeholder') &&
        input.matches(rule.selectorText.replace('::placeholder', '')) &&
        rule.style.opacity,
    );
    expect(matchingOpacityRules).toHaveLength(0);
  });

  it('composes helper typography onto the existing description element', () => {
    render(<TextField label="Name" helperText="Hint" />);
    const helper = screen.getByText('Hint');
    expect(helper).toHaveClass('ps-Text', 'ps-TextHelper', 'ps-TextField__helper');
    expect(helper.tagName).toBe('P');
    expect(helper.childElementCount).toBe(0);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('Hint');
  });

  it.each(['error', 'warning', 'success', 'info'] as const)('preserves %s helper styling', (status) => {
    render(<TextField label="Name" status={status} helperText="Hint" />);
    expect(getComputedStyle(screen.getByText('Hint')).color).toBe(`var(--perses-status-text-${status})`);
  });

  it('updates helper status without losing its accessible description', () => {
    const { rerender } = render(<TextField label="Name" status="error" helperText="Hint" />);
    rerender(<TextField label="Name" status="warning" helperText="Hint" />);
    expect(getComputedStyle(screen.getByText('Hint')).color).toBe('var(--perses-status-text-warning)');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('Hint');

    rerender(<TextField label="Name" helperText="Hint" />);
    expect(getComputedStyle(screen.getByText('Hint')).color).toBe('var(--perses-text-secondary)');
    expect(screen.getByText('Hint')).not.toHaveAttribute('data-status');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('Hint');
  });

  it.each([undefined, 'error', 'warning', 'success', 'info'] as const)(
    'preserves helper status=%s across disabling and re-enabling',
    (status) => {
      const { rerender } = render(<TextField label="Name" disabled status={status} helperText="Hint" />);
      const helper = screen.getByText('Hint');
      const input = screen.getByRole('textbox', { name: 'Name' });
      expect(helper).toHaveAttribute('data-disabled');
      expect(getComputedStyle(helper).color).toBe(
        status ? `var(--perses-status-text-${status})` : 'var(--perses-text-secondary)',
      );
      expect(getOpacity(helper)).toBe('1');
      expect(input).toBeDisabled();
      expect(input).toHaveAccessibleDescription('Hint');

      rerender(<TextField label="Name" status={status} helperText="Hint" />);
      expect(helper).not.toHaveAttribute('data-disabled');
      expect(getComputedStyle(helper).color).toBe(
        status ? `var(--perses-status-text-${status})` : 'var(--perses-text-secondary)',
      );
      expect(input).not.toBeDisabled();
      expect(input).toHaveAccessibleDescription('Hint');
    },
  );

  it('inherits disabled text styling from a fieldset, including for a multiline control', () => {
    const { rerender } = render(
      <Fieldset.Root disabled>
        <TextField label="Comment" multiline disabled={false} status="error" helperText="Hint" startElement="$" />
      </Fieldset.Root>,
    );
    const helper = screen.getByText('Hint');
    const input = screen.getByRole('textbox', { name: 'Comment' });
    expect(helper).toHaveAttribute('data-disabled');
    expect(getComputedStyle(helper).color).toBe('var(--perses-status-text-error)');
    const root = input.closest('.ps-TextField');
    if (!root) throw new Error('Missing text field root');
    expect(getOpacity(root)).toBe('var(--perses-opacity-disabled, 0.5)');
    expect(getOpacity(helper)).toBe('1');
    expect(input).toBeDisabled();
    expect(input).toHaveAccessibleDescription('Hint');
    expect(getComputedStyle(input).color).toBe('var(--perses-text-primary)');
    for (const element of [screen.getByText('Comment'), screen.getByText('$')]) {
      expect(getComputedStyle(element).color).toBe('var(--perses-text-secondary)');
    }

    rerender(
      <Fieldset.Root>
        <TextField label="Comment" multiline disabled={false} status="error" helperText="Hint" startElement="$" />
      </Fieldset.Root>,
    );
    expect(helper).not.toHaveAttribute('data-disabled');
    expect(getComputedStyle(helper).color).toBe('var(--perses-status-text-error)');
    expect(input).not.toBeDisabled();
    expect(getOpacity(root) || '1').toBe('1');
  });

  it('preserves custom text colors and avoids dimming nested disabled text twice', () => {
    render(<TextField label="Name" disabled helperText={customHint} />);
    const hint = screen.getByText('Custom hint');
    expect(getComputedStyle(hint).color).toBe('rgb(102, 51, 153)');
    expect(getOpacity(hint)).toBe('1');
    const helper = hint.closest('.ps-TextHelper');
    if (!helper) throw new Error('Missing helper');
    expect(getOpacity(helper)).toBe('1');
  });

  it('keeps helper content from determining the intrinsic field width', () => {
    render(<TextField label="Name" helperText="A longer hint that should wrap within the control width" />);

    expect(getComputedStyle(screen.getByText('A longer hint that should wrap within the control width')).contain).toBe(
      'inline-size',
    );
  });

  it('allows helper text without spaces to wrap instead of overflowing', () => {
    const helperText = 'https://example.com/a-very-long-path-without-spaces-for-a-field-description';
    render(<TextField label="URL" helperText={helperText} fullWidth />);

    expect(getComputedStyle(screen.getByText(helperText)).overflowWrap).toBe('anywhere');
  });
});
