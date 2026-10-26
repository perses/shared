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

import { Box } from './Box';

const RESPONSIVE_WIDTH = { default: '100%', md: 400, lg: 'calc(30em + 4px)' };
const OUTER_PADDING = { md: 100 };
const MIDDLE_PADDING = { md: '50%' };
const INNER_PADDING = { md: 'sm' };

describe('Box', () => {
  it('renders children', () => {
    render(<Box>Content</Box>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies the ps-Box class', () => {
    render(<Box data-testid="box">Content</Box>);
    expect(screen.getByTestId('box')).toHaveClass('ps-Box');
  });

  it('merges additional className', () => {
    render(
      <Box data-testid="box" className="custom">
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveClass('ps-Box');
    expect(screen.getByTestId('box')).toHaveClass('custom');
  });

  it('renders as a div by default', () => {
    render(<Box data-testid="box">Content</Box>);
    expect(screen.getByTestId('box').tagName).toBe('DIV');
  });

  it('applies a non-responsive layout prop through a custom property', () => {
    render(
      <Box data-testid="box" display="flex">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-display');
    expect(box).toHaveStyle({ '--ps-display': 'flex' });
  });

  it('applies a spacing token through its design-token custom property', () => {
    render(
      <Box data-testid="box" p="md">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-p');
    expect(box).toHaveStyle({ '--ps-p': 'var(--perses-spacing-md)' });
  });

  it('accepts scalar pixels and CSS strings for spacing props', () => {
    render(
      <Box p={24} px="5%" py="1rem" m="auto" mx={-8} my={0} gap="var(--custom-gap)">
        Custom spacing
      </Box>,
    );
    const box = screen.getByText('Custom spacing');
    expect(box).toHaveStyle({
      '--ps-p': '24px',
      '--ps-px': '5%',
      '--ps-py': '1rem',
      '--ps-m': 'auto',
      '--ps-mx': '-8px',
      '--ps-my': '0px',
      '--ps-gap': 'var(--custom-gap)',
    });
    for (const prop of ['p', 'px', 'py', 'm', 'mx', 'my', 'gap']) {
      expect(box).not.toHaveAttribute(prop);
    }
  });

  it('writes responsive padding on each nested box', () => {
    render(
      <Box p={OUTER_PADDING}>
        Outer
        <Box p={MIDDLE_PADDING}>
          Middle
          <Box p={INNER_PADDING}>Inner</Box>
        </Box>
      </Box>,
    );
    for (const name of ['Outer', 'Middle', 'Inner']) {
      expect(screen.getByText(name)).toHaveClass('ps-p-md');
      expect(screen.getByText(name)).not.toHaveClass('ps-p');
      expect(screen.getByText(name)).not.toHaveClass('ps-p-lg');
      expect(screen.getByText(name)).not.toHaveClass('ps-p-xl');
    }
    expect(screen.getByText('Outer')).toHaveStyle({ '--ps-p-md': '100px' });
    expect(screen.getByText('Middle')).toHaveStyle({ '--ps-p-md': '50%' });
    expect(screen.getByText('Inner')).toHaveStyle({ '--ps-p-md': 'var(--perses-spacing-sm)' });
  });

  it('applies directional spacing shorthands', () => {
    render(
      <Box data-testid="box" px="lg" py="sm">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-px', 'ps-py');
    expect(box).toHaveStyle({ '--ps-px': 'var(--perses-spacing-lg)' });
    expect(box).toHaveStyle({ '--ps-py': 'var(--perses-spacing-sm)' });
  });

  it('resolves margin tokens', () => {
    render(
      <Box data-testid="box" m="xl">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-m');
    expect(box).toHaveStyle({ '--ps-m': 'var(--perses-spacing-xl)' });
  });

  it('resolves the 0 spacing token through the design token', () => {
    render(
      <Box data-testid="box" p="0">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-p');
    expect(box).toHaveStyle({ '--ps-p': 'var(--perses-spacing-0)' });
  });

  it('passes a string length prop through verbatim', () => {
    render(
      <Box data-testid="box" width="100%">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-width');
    expect(box).toHaveStyle({ '--ps-width': '100%' });
  });

  it('treats a numeric length prop as pixels', () => {
    render(
      <Box data-testid="box" width={130}>
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveStyle({ '--ps-width': '130px' });
  });

  it('keeps unitless numeric props unitless', () => {
    render(
      <Box data-testid="box" flex={1}>
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveStyle({ '--ps-flex': '1' });
  });

  it('kebab-cases multi-word sizing props', () => {
    render(
      <Box data-testid="box" minWidth={200} maxWidth="50%">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-min-width', 'ps-max-width');
    expect(box).toHaveStyle({ '--ps-min-width': '200px' });
    expect(box).toHaveStyle({ '--ps-max-width': '50%' });
  });

  it('mixes string and numeric values across breakpoints', () => {
    render(
      <Box data-testid="box" width={RESPONSIVE_WIDTH}>
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-width', 'ps-width-md', 'ps-width-lg');
    expect(box).toHaveStyle({ '--ps-width': '100%' });
    expect(box).toHaveStyle({ '--ps-width-md': '400px' });
    expect(box).toHaveStyle({ '--ps-width-lg': 'calc(30em + 4px)' });
  });

  it('creates responsive spacing variables', () => {
    render(
      <Box data-testid="box" p={{ default: 'lg', xs: 'sm' }}>
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-p', 'ps-p-xs');
    expect(box).toHaveStyle({ '--ps-p': 'var(--perses-spacing-lg)' });
    expect(box).toHaveStyle({ '--ps-p-xs': 'var(--perses-spacing-sm)' });
  });

  it('creates responsive layout variables', () => {
    render(
      <Box data-testid="box" display={{ default: 'flex', sm: 'block' }}>
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-display', 'ps-display-sm');
    expect(box).toHaveStyle({ '--ps-display': 'flex', '--ps-display-sm': 'block' });
  });

  it('merges style prop with computed styles', () => {
    render(
      <Box data-testid="box" p="sm" style={{ color: 'red' }}>
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-p');
    expect(box).toHaveStyle({ '--ps-p': 'var(--perses-spacing-sm)' });
    expect(box).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('lets the style prop override a spacing utility', () => {
    render(
      <Box data-testid="box" p="md" style={{ padding: '99px' }}>
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveClass('ps-p');
    expect(screen.getByTestId('box')).toHaveStyle({ padding: '99px' });
  });

  it('does not render a style attribute when no style-affecting props are given', () => {
    render(<Box data-testid="box">Content</Box>);
    expect(screen.getByTestId('box')).not.toHaveAttribute('style');
  });

  it('forwards a ref to the underlying div', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Box ref={ref}>Content</Box>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
