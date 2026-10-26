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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Variants } from './Switch.stories';

const colors = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];

describe('Switch variants story', () => {
  it.each(['xs', 'sm', 'md', 'lg'])('groups both states and all colors under size %s', (size) => {
    render(<Variants />);
    const group = screen.getByRole('heading', { name: `Size: ${size}` }).parentElement;
    if (!group) throw new Error('Missing size group');
    const preview = within(group);
    expect(preview.getAllByRole('switch')).toHaveLength(16);

    for (const state of ['off', 'on']) {
      for (const color of colors) {
        const control = preview.getByRole('switch', { name: `${size} ${state} ${color}` });
        expect(control).toHaveAttribute('data-color', color);
        expect(control).toHaveAttribute('data-size', size);
        expect(control).toHaveAttribute('aria-checked', String(state === 'on'));
        expect(control).not.toHaveAttribute('data-disabled');
      }
      const disabled = preview.getByRole('switch', { name: `${size} ${state} disabled` });
      expect(disabled).toHaveAttribute('aria-disabled', 'true');
      expect(disabled).toHaveAttribute('aria-checked', String(state === 'on'));
      expect(disabled).toHaveAttribute('data-size', size);
    }
  });

  it('keeps enabled examples toggleable and disabled examples inert', async () => {
    render(<Variants />);
    const control = screen.getByRole('switch', { name: 'md on primary' });
    const disabled = screen.getByRole('switch', { name: 'md on disabled' });
    await userEvent.click(control);
    await userEvent.click(disabled);
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(disabled).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps accessible unlabeled examples in a separate sample', () => {
    render(<Variants />);
    const sample = screen.getByText('Without a visible label').closest('section');
    if (!sample) throw new Error('Missing unlabeled sample');
    expect(within(sample).getAllByRole('switch')).toHaveLength(4);
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      expect(within(sample).getByRole('switch', { name: `${size} switch without label` })).toHaveAttribute(
        'data-size',
        size,
      );
    }
  });
});
