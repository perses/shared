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

import { render } from '@testing-library/react';

import { Select } from './Select';
import type { SelectStyle } from './Select';
import { getRoot, getTrigger, renderSelect } from './Select.test.utils';

const responsiveWidth = { default: '100%', md: '20rem' };
const STYLE_OVERRIDE = { width: '99px' };
const COLOR_STYLE = { color: 'red' };
const SIZE_OVERRIDE_STYLE: SelectStyle = { '--perses-select-size-md': '40px' };

describe('style props', () => {
  it('applies a plain width through a custom property', () => {
    renderSelect({ width: '20rem' });
    expect(getRoot()).toHaveClass('ps-width');
    expect(getRoot()).toHaveStyle({ '--ps-width': '20rem' });
  });

  it('applies responsive width via the style-prop class and CSS variables', () => {
    renderSelect({ width: responsiveWidth });
    expect(getRoot()).toHaveClass('ps-width');
    expect(getRoot()).toHaveStyle({ '--ps-width': '100%', '--ps-width-md': '20rem' });
  });

  it('applies spacing and overflow props to the root', () => {
    renderSelect({ m: 'md', minWidth: 120, overflow: 'hidden' });
    const root = getRoot();
    expect(root).toHaveClass('ps-m', 'ps-min-width', 'ps-overflow');
    expect(root).toHaveStyle({
      '--ps-m': 'var(--perses-spacing-md)',
      '--ps-min-width': '120px',
      '--ps-overflow': 'hidden',
    });
  });

  it('does not accept a display prop because the stylesheet fixes display', () => {
    // @ts-expect-error display is fixed by the Select stylesheet
    render(<Select label="Unit" display="block" />);
    const root = getRoot();
    expect(root).not.toHaveClass('ps-display');
    expect(root.style.getPropertyValue('--ps-display')).toBe('');
    expect(getTrigger()).not.toHaveAttribute('display');
  });

  it('places className and style on the root, not the trigger', () => {
    renderSelect({ className: 'custom', style: COLOR_STYLE });
    const root = getRoot();
    expect(root).toHaveClass('custom');
    expect(root.style.color).toBe('red');
    expect(getTrigger()).not.toHaveClass('custom');
    expect(getTrigger().style.color).toBe('');
  });

  it('applies a per-size override custom property to the root', () => {
    renderSelect({ style: SIZE_OVERRIDE_STYLE });
    expect(getRoot().style.getPropertyValue('--perses-select-size-md')).toBe('40px');
  });

  it('merges the style prop and lets it override computed styles', () => {
    renderSelect({ width: '20rem', style: STYLE_OVERRIDE });
    expect(getRoot()).toHaveStyle({ width: '99px' });
  });

  it('does not forward style props to the trigger', () => {
    renderSelect({ m: 'md', width: '20rem', id: 'x' });
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('id', 'x');
    expect(trigger).not.toHaveAttribute('m');
    expect(trigger).not.toHaveAttribute('width');
  });
});
