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
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Stack } from './Stack';

const RESPONSIVE_DIRECTION = { default: 'column', md: 'row' } as const;
const PARTIAL_RESPONSIVE_DIRECTION = { md: 'row' } as const;
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

  it('leaves the flex column default to the stylesheet', () => {
    render(<Stack data-testid="stack">Content</Stack>);
    const stack = screen.getByTestId('stack');
    expect(stack).not.toHaveClass('ps-display');
    expect(stack).not.toHaveClass('ps-flex-direction');
    expect(stack.style.getPropertyValue('--ps-flex-direction')).toBe('');
  });

  it.each(['row', 'column'] as const)('supports the %s direction', (direction) => {
    render(
      <Stack data-testid="stack" direction={direction}>
        Content
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('ps-flex-direction');
    expect(stack).toHaveStyle({ '--ps-flex-direction': direction });
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
    expect(stack).toHaveStyle({
      '--ps-p': 'var(--perses-spacing-md)',
      '--ps-width': '200px',
    });
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

  it('seeds a column base for a responsive direction that omits the default breakpoint', () => {
    render(
      <Stack data-testid="stack" direction={PARTIAL_RESPONSIVE_DIRECTION}>
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
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref}>Content</Stack>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it.each(['0', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const)('supports spacing token %s', (token) => {
    render(
      <Stack data-testid="stack" spacing={token}>
        Content
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toHaveStyle({
      '--ps-gap': `var(--perses-spacing-${token})`,
    });
  });

  describe('accessibility', () => {
    it('adds no implicit role or ARIA attributes', () => {
      render(<Stack data-testid="stack">Content</Stack>);
      const stack = screen.getByTestId('stack');
      expect(stack).not.toHaveAttribute('role');
      expect(stack.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
    });

    it('forwards role and aria attributes so a region can be named', () => {
      render(
        <Stack role="toolbar" aria-label="Filters">
          <button type="button">Apply</button>
        </Stack>,
      );
      expect(screen.getByRole('toolbar', { name: 'Filters' })).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <h2 id="heading">Actions</h2>
          <Stack role="toolbar" aria-labelledby="heading">
            <button type="button">Save</button>
          </Stack>
        </>,
      );
      expect(screen.getByRole('toolbar', { name: 'Actions' })).toBeInTheDocument();
    });

    it('keeps DOM order for keyboard navigation, also for row direction', () => {
      render(
        <Stack direction="row">
          <button type="button">One</button>
          <button type="button">Two</button>
          <button type="button">Three</button>
        </Stack>,
      );
      userEvent.tab();
      expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
      userEvent.tab();
      expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
      userEvent.tab();
      expect(screen.getByRole('button', { name: 'Three' })).toHaveFocus();
    });

    it('does not make itself focusable', () => {
      render(<Stack data-testid="stack">Content</Stack>);
      userEvent.tab();
      expect(screen.getByTestId('stack')).not.toHaveFocus();
      expect(screen.getByTestId('stack')).not.toHaveAttribute('tabindex');
    });
  });
});
