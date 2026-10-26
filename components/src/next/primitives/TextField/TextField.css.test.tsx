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

import { TextField } from './TextField';

// jsdom does not apply cascade layers; preserve the selectors while unwrapping the component layer.
const textFieldCss = ['./textField.css', '../Text/text.css', '../TextHelper/textHelper.css']
  .map((path) =>
    readFileSync(resolve(__dirname, path), 'utf-8')
      .replace(/@import\s+[^;]+;/g, '')
      .replace('@layer perses.components {', '')
      .replace(/}\s*$/, ''),
  )
  .join('\n');

describe('TextField helper CSS contracts', () => {
  const style = document.createElement('style');

  beforeAll(() => {
    style.textContent = textFieldCss;
    document.head.append(style);
  });

  afterAll(() => {
    style.remove();
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
    'uses disabled helper styling ahead of status=%s and restores it when re-enabled',
    (status) => {
      const { rerender } = render(<TextField label="Name" disabled status={status} helperText="Hint" />);
      const helper = screen.getByText('Hint');
      const input = screen.getByRole('textbox', { name: 'Name' });
      expect(helper).toHaveAttribute('data-disabled');
      expect(getComputedStyle(helper).color).toBe('var(--perses-text-disabled)');
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

  it('inherits disabled helper styling from a fieldset, including for a multiline control', () => {
    const { rerender } = render(
      <Fieldset.Root disabled>
        <TextField label="Comment" multiline disabled={false} status="error" helperText="Hint" />
      </Fieldset.Root>,
    );
    const helper = screen.getByText('Hint');
    const input = screen.getByRole('textbox', { name: 'Comment' });
    expect(helper).toHaveAttribute('data-disabled');
    expect(getComputedStyle(helper).color).toBe('var(--perses-text-disabled)');
    expect(input).toBeDisabled();
    expect(input).toHaveAccessibleDescription('Hint');

    rerender(
      <Fieldset.Root>
        <TextField label="Comment" multiline disabled={false} status="error" helperText="Hint" />
      </Fieldset.Root>,
    );
    expect(helper).not.toHaveAttribute('data-disabled');
    expect(getComputedStyle(helper).color).toBe('var(--perses-status-text-error)');
    expect(input).not.toBeDisabled();
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
