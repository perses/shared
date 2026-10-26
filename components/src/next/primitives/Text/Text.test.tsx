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

import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { Text } from './Text';

const style = { color: 'red' };
const width = { default: '100%', md: '20rem' };

describe('Text', () => {
  it('renders inline text by default without helper-specific containment', () => {
    render(<Text>Dashboard name</Text>);
    const text = screen.getByText('Dashboard name');
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('ps-Text');
    expect(text).not.toHaveClass('ps-TextHelper');
  });

  it.each(['p', 'div', 'strong', 'em', 'small'] as const)('can render a %s element and forward its ref', (as) => {
    const ref = createRef<HTMLElement>();
    render(
      <Text as={as} ref={ref}>
        Description
      </Text>,
    );
    const text = screen.getByText('Description');
    expect(text.tagName.toLowerCase()).toBe(as);
    expect(ref.current).toBe(text);
  });

  it('applies token-based typography without forwarding presentation props to the DOM', () => {
    render(
      <Text size="xl" weight="bold" color="secondary">
        Summary
      </Text>,
    );
    const text = screen.getByText('Summary');
    expect(text).toHaveAttribute('data-size', 'xl');
    expect(text).toHaveAttribute('data-weight', 'bold');
    expect(text).toHaveAttribute('data-color', 'secondary');
    for (const prop of ['as', 'size', 'weight', 'color']) expect(text).not.toHaveAttribute(prop);
  });

  it.each([
    ['#663399', 'rgb(102, 51, 153)'],
    ['rebeccapurple', 'rebeccapurple'],
    ['rgb(100 50 200 / 80%)', 'rgba(100, 50, 200, 0.8)'],
    ['var(--custom-color)', 'var(--custom-color)'],
    ['currentColor', 'currentcolor'],
    ['initial', 'initial'],
  ])('accepts CSS color %s without forwarding a native color attribute', (color, expected) => {
    render(<Text color={color}>Custom color</Text>);
    const text = screen.getByText('Custom color');
    expect(text.style.color).toBe(expected);
    expect(text).not.toHaveAttribute('color');
  });

  it('lets an explicit style color override a CSS color prop', () => {
    render(
      <Text color="#663399" style={style}>
        Custom color
      </Text>,
    );
    expect(screen.getByText('Custom color').style.color).toBe('red');
  });

  it('removes a custom color when switching back to a design-system color', () => {
    const { rerender } = render(<Text color="#663399">Custom color</Text>);
    expect(screen.getByText('Custom color').style.color).toBe('rgb(102, 51, 153)');
    rerender(<Text color="secondary">Custom color</Text>);
    expect(screen.getByText('Custom color').style.color).toBe('');
    expect(screen.getByText('Custom color')).toHaveAttribute('data-color', 'secondary');
  });

  it('supports native attributes, custom styles and responsive style props', () => {
    render(
      <Text id="summary" title="Details" className="custom" style={style} m="sm" width={width}>
        Summary
      </Text>,
    );
    const text = screen.getByText('Summary');
    expect(text).toHaveAttribute('id', 'summary');
    expect(text).toHaveAttribute('title', 'Details');
    expect(text).toHaveClass('ps-Text', 'custom', 'ps-m', 'ps-width');
    expect(text.style.color).toBe('red');
    expect(text).toHaveStyle({ '--ps-m': 'var(--perses-spacing-sm)', '--ps-width': '100%', '--ps-width-md': '20rem' });
    expect(text).not.toHaveAttribute('m');
    expect(text).not.toHaveAttribute('width');
  });
});
