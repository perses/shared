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

import { Field } from '@base-ui/react/field';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { TextHelper } from './TextHelper';

const style = { marginTop: '8px' };
const errorHelper = <TextHelper status="error" />;

describe('TextHelper', () => {
  it('works outside a field and describes a button through its id', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(
      <>
        <button aria-describedby="publish-help">Publish</button>
        <TextHelper id="publish-help" ref={ref}>
          Visible to your team
        </TextHelper>
      </>,
    );
    const helper = screen.getByText('Visible to your team');
    expect(helper.tagName).toBe('P');
    expect(helper).toHaveClass('ps-Text', 'ps-TextHelper');
    expect(helper).toHaveAttribute('data-size', 'xs');
    expect(helper).toHaveAttribute('data-color', 'secondary');
    expect(ref.current).toBe(helper);
    expect(screen.getByRole('button', { name: 'Publish' })).toHaveAccessibleDescription('Visible to your team');
  });

  it.each(['error', 'warning', 'success', 'info'] as const)('maps %s status to its text color', (status) => {
    render(<TextHelper status={status}>Validation message</TextHelper>);
    const helper = screen.getByText('Validation message');
    expect(helper).toHaveAttribute('data-status', status);
    expect(helper).toHaveAttribute('data-color', status);
    expect(helper).not.toHaveAttribute('status');
    expect(helper).not.toHaveAttribute('role');
  });

  it.each([undefined, 'error', 'warning', 'success', 'info'] as const)(
    'uses the disabled text color ahead of status=%s and restores the color when re-enabled',
    (status) => {
      const { rerender } = render(
        <TextHelper disabled status={status}>
          Hint
        </TextHelper>,
      );
      const helper = screen.getByText('Hint');
      expect(helper).toHaveAttribute('data-color', 'disabled');
      expect(helper).toHaveAttribute('data-disabled');
      expect(helper).not.toHaveAttribute('disabled');
      expect(helper).not.toHaveAttribute('aria-disabled');

      rerender(
        <TextHelper disabled={false} status={status}>
          Hint
        </TextHelper>,
      );
      expect(helper).toHaveAttribute('data-color', status ?? 'secondary');
      expect(helper).not.toHaveAttribute('data-disabled');
    },
  );

  it('forwards custom classes, styles and spacing to its single root', () => {
    render(
      <TextHelper className="custom" style={style} m="sm">
        Hint
      </TextHelper>,
    );
    const helper = screen.getByText('Hint');
    expect(helper).toHaveClass('ps-Text', 'ps-TextHelper', 'custom', 'ps-m');
    expect(helper).toHaveStyle({ marginTop: '8px', '--ps-m': 'var(--perses-spacing-sm)' });
    expect(helper.childElementCount).toBe(0);
  });

  it('composes with Field.Description without an extra DOM element', () => {
    render(
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Field.Control />
        <Field.Description render={errorHelper}>Required</Field.Description>
      </Field.Root>,
    );
    const helper = screen.getByText('Required');
    expect(helper.tagName).toBe('P');
    expect(helper).toHaveClass('ps-TextHelper');
    expect(helper.childElementCount).toBe(0);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('Required');
  });
});
