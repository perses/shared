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
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies the ps-Button class', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('ps-Button');
  });

  it('sets default data attributes (solid, primary, md)', () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-variant', 'solid');
    expect(btn).toHaveAttribute('data-color', 'primary');
    expect(btn).toHaveAttribute('data-size', 'md');
  });

  it('applies custom variant, color, and size', () => {
    render(
      <Button variant="outline" color="error" size="sm">
        Delete
      </Button>
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-variant', 'outline');
    expect(btn).toHaveAttribute('data-color', 'error');
    expect(btn).toHaveAttribute('data-size', 'sm');
  });

  it('merges custom className', () => {
    render(<Button className="my-class">Test</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('ps-Button');
    expect(btn).toHaveClass('my-class');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
