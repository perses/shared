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
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import { defaultComponents, defaultIcons } from '../defaults';
import { Stack } from './Stack';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

describe('Stack', () => {
  it('renders children', () => {
    render(<Stack>Content</Stack>, { wrapper: Wrapper });
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies the ps-Stack and ps-Box classes', () => {
    render(<Stack data-testid="stack">Content</Stack>, { wrapper: Wrapper });
    expect(screen.getByTestId('stack')).toHaveClass('ps-Stack');
    expect(screen.getByTestId('stack')).toHaveClass('ps-Box');
  });

  it('merges additional className', () => {
    render(
      <Stack data-testid="stack" className="custom">
        Content
      </Stack>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('stack')).toHaveClass('custom');
  });

  it('defaults to a column direction', () => {
    render(<Stack data-testid="stack">Content</Stack>, { wrapper: Wrapper });
    expect(screen.getByTestId('stack')).toHaveStyle({ display: 'flex', flexDirection: 'column' });
  });

  it('supports row direction', () => {
    render(
      <Stack data-testid="stack" direction="row">
        Content
      </Stack>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ flexDirection: 'row' });
  });

  it('resolves the spacing prop to a gap CSS variable', () => {
    render(
      <Stack data-testid="stack" spacing="lg">
        Content
      </Stack>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ gap: 'var(--perses-spacing-lg)' });
  });

  it('forwards alignItems and justifyContent', () => {
    render(
      <Stack data-testid="stack" alignItems="center" justifyContent="space-between">
        Content
      </Stack>,
      { wrapper: Wrapper },
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ alignItems: 'center', justifyContent: 'space-between' });
  });

  it('forwards a ref to the underlying div', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Stack ref={ref}>Content</Stack>, { wrapper: Wrapper });
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
