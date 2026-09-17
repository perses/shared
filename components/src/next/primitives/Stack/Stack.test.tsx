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

import { Stack } from './Stack';

const RESPONSIVE_DIRECTION = { default: 'column', md: 'row' } as const;
const RESPONSIVE_SPACING = { default: 'sm', md: 'xl' } as const;
const STYLE_OVERRIDE = { gap: '99px' };

describe('Stack', () => {
  it('renders children', () => {
    render(<Stack>Content</Stack>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies the ps-Stack class', () => {
    render(<Stack data-testid="stack">Content</Stack>);
    expect(screen.getByTestId('stack')).toHaveClass('ps-Stack');
  });

  it('merges additional className', () => {
    render(
      <Stack data-testid="stack" className="custom">
        Content
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toHaveClass('ps-Stack');
    expect(screen.getByTestId('stack')).toHaveClass('custom');
  });

  it('renders as a div', () => {
    render(<Stack data-testid="stack">Content</Stack>);
    expect(screen.getByTestId('stack').tagName).toBe('DIV');
  });

  it('defaults to a flex column', () => {
    render(<Stack data-testid="stack">Content</Stack>);
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('ps-display', 'ps-flex-direction');
    expect(stack).toHaveStyle({ '--ps-display': 'flex', '--ps-flex-direction': 'column' });
  });

  it('supports row direction', () => {
    render(
      <Stack data-testid="stack" direction="row">
        Content
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ '--ps-flex-direction': 'row' });
  });

  it('resolves the spacing prop to a gap custom property', () => {
    render(
      <Stack data-testid="stack" spacing="lg">
        Content
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('ps-gap');
    expect(stack).toHaveStyle({ '--ps-gap': 'var(--perses-spacing-lg)' });
  });

  it('forwards alignItems and justifyContent', () => {
    render(
      <Stack data-testid="stack" alignItems="center" justifyContent="space-between">
        Content
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toHaveStyle({
      '--ps-align-items': 'center',
      '--ps-justify-content': 'space-between',
    });
  });

  it('applies spacing and sizing props', () => {
    render(
      <Stack data-testid="stack" p="md" width={200}>
        Content
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('ps-p', 'ps-width');
    expect(stack).toHaveStyle({ '--ps-p': 'var(--perses-spacing-md)', '--ps-width': '200px' });
  });

  it('creates responsive direction variables', () => {
    render(
      <Stack data-testid="stack" direction={RESPONSIVE_DIRECTION}>
        Content
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toHaveStyle({
      '--ps-flex-direction': 'column',
      '--ps-flex-direction-md': 'row',
    });
  });

  it('creates responsive spacing variables', () => {
    render(
      <Stack data-testid="stack" spacing={RESPONSIVE_SPACING}>
        Content
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toHaveStyle({
      '--ps-gap': 'var(--perses-spacing-sm)',
      '--ps-gap-md': 'var(--perses-spacing-xl)',
    });
  });

  it('lets the style prop override a computed style', () => {
    render(
      <Stack data-testid="stack" spacing="md" style={STYLE_OVERRIDE}>
        Content
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('ps-Stack', 'ps-gap');
    expect(stack).toHaveStyle({ gap: '99px' });
  });

  it('does not forward style props to the DOM element', () => {
    render(
      <Stack data-testid="stack" spacing="md" direction="row" p="sm" id="x">
        Content
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('id', 'x');
    expect(stack).not.toHaveAttribute('spacing');
    expect(stack).not.toHaveAttribute('direction');
    expect(stack).not.toHaveAttribute('p');
  });

  it('forwards a ref to the underlying div', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Stack ref={ref}>Content</Stack>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
