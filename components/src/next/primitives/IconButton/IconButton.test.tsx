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

import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders children', () => {
    render(<IconButton aria-label="Close">X</IconButton>);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('applies the ps-IconButton class', () => {
    render(<IconButton aria-label="Close">X</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('ps-IconButton');
  });

  it('uses default variant, color, and size', () => {
    render(<IconButton aria-label="Close">X</IconButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-color', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('sets data-variant, data-color, and data-size from props', () => {
    render(
      <IconButton aria-label="Delete" variant="solid" color="error" size="sm">
        X
      </IconButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'solid');
    expect(button).toHaveAttribute('data-color', 'error');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  it('merges additional className', () => {
    render(
      <IconButton aria-label="Close" className="custom">
        X
      </IconButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ps-IconButton');
    expect(button).toHaveClass('custom');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(
      <IconButton aria-label="Close" onClick={handleClick}>
        X
      </IconButton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', () => {
    render(
      <IconButton aria-label="Close" disabled>
        X
      </IconButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards a ref to the underlying button', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <IconButton aria-label="Close" ref={ref}>
        X
      </IconButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
