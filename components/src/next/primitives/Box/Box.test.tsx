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

  it('applies display style', () => {
    render(
      <Box data-testid="box" display="flex">
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveStyle({ display: 'flex' });
  });

  it('applies a spacing class for padding', () => {
    render(
      <Box data-testid="box" p="md">
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveClass('ps-spacing-p-md');
  });

  it('applies spacing classes for directional shorthands', () => {
    render(
      <Box data-testid="box" px="lg" py="sm">
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-spacing-px-lg', 'ps-spacing-py-sm');
  });

  it('resolves margin tokens', () => {
    render(
      <Box data-testid="box" m="xl">
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveClass('ps-spacing-m-xl');
  });

  it('resolves the 0 spacing token through the design token', () => {
    render(
      <Box data-testid="box" p="0">
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveClass('ps-spacing-p-0');
  });

  it('creates responsive spacing variables', () => {
    render(
      <Box data-testid="box" p={{ default: 'lg', xs: 'sm' }}>
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-spacing-p');
    expect(box).toHaveStyle({ '--ps-spacing-p-default': 'var(--perses-spacing-lg)' });
    expect(box).toHaveStyle({ '--ps-spacing-p-xs': 'var(--perses-spacing-sm)' });
  });

  it('creates responsive layout variables', () => {
    render(
      <Box data-testid="box" display={{ default: 'flex', sm: 'block' }}>
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-responsive-display');
    expect(box).toHaveStyle({ '--ps-box-display-default': 'flex', '--ps-box-display-sm': 'block' });
  });

  it('merges style prop with computed styles', () => {
    render(
      <Box data-testid="box" p="sm" style={{ color: 'red' }}>
        Content
      </Box>,
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveClass('ps-spacing-p-sm');
    expect(box).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('lets the style prop override a spacing class', () => {
    render(
      <Box data-testid="box" p="md" style={{ padding: '99px' }}>
        Content
      </Box>,
    );
    expect(screen.getByTestId('box')).toHaveClass('ps-spacing-p-md');
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
