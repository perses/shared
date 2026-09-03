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
import { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import { defaultComponents, defaultIcons } from '../defaults';
import { Button } from './Button';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies the ps-Button class', () => {
    render(<Button>Test</Button>, { wrapper: Wrapper });
    expect(screen.getByRole('button')).toHaveClass('ps-Button');
  });

  it('sets data-variant, data-color, and data-size attributes', () => {
    render(
      <Button variant="outline" color="error" size="lg">
        Test
      </Button>,
      { wrapper: Wrapper },
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-color', 'error');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('uses default props when none are provided', () => {
    render(<Button>Test</Button>, { wrapper: Wrapper });
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'solid');
    expect(button).toHaveAttribute('data-color', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('merges additional className', () => {
    render(<Button className="custom-class">Test</Button>, { wrapper: Wrapper });
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ps-Button');
    expect(button).toHaveClass('custom-class');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', () => {
    render(<Button disabled>Disabled</Button>, { wrapper: Wrapper });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders spinner when loading is true', () => {
    const { container } = render(<Button loading>Save</Button>, { wrapper: Wrapper });
    expect(container.querySelector('.ps-Button__spinner')).toBeInTheDocument();
    expect(container.querySelector('.ps-Spinner')).toBeInTheDocument();
  });

  it('composes the shared Icon primitive for its spinner wrapper', () => {
    const { container } = render(<Button loading>Save</Button>, { wrapper: Wrapper });
    const spinnerContainer = container.querySelector('.ps-Button__spinner');
    expect(spinnerContainer).toHaveClass('ps-Icon');
  });

  it('disables button when loading is true', () => {
    render(<Button loading>Save</Button>, { wrapper: Wrapper });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy and data-loading when loading', () => {
    render(<Button loading>Save</Button>, { wrapper: Wrapper });
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('data-loading');
  });

  it('does not render spinner when loading is false', () => {
    const { container } = render(<Button>Save</Button>, { wrapper: Wrapper });
    expect(container.querySelector('.ps-Button__spinner')).not.toBeInTheDocument();
  });
});
