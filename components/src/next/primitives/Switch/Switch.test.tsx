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
import type { CSSProperties } from 'react';

import type { Size } from '../types';
import { Switch } from './Switch';

const noop = (): void => {};
const RESPONSIVE_WIDTH = { default: 100, md: 200 };
const WIDTH_OVERRIDE = { '--ps-width': '50px' } as CSSProperties;

if (typeof window.PointerEvent === 'undefined') {
  window.PointerEvent = window.MouseEvent as unknown as typeof PointerEvent;
}

describe('Switch', () => {
  it('renders a role="switch" element with the ps-Switch class', () => {
    render(<Switch checked={false} onCheckedChange={noop} />);
    const control = screen.getByRole('switch');
    expect(control).toBeInTheDocument();
    expect(control).toHaveClass('ps-Switch');
  });

  it('reflects the checked state via aria-checked', () => {
    const { rerender } = render(<Switch checked={false} onCheckedChange={noop} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    rerender(<Switch checked onCheckedChange={noop} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onCheckedChange with the new boolean value and event details when toggled', async () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={handleChange} />);

    await userEvent.click(screen.getByRole('switch'));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('does not call onCheckedChange when disabled and prevents interaction', async () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={handleChange} disabled />);

    const control = screen.getByRole('switch');
    await userEvent.click(control);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('exposes the disabled state via data-disabled and aria-disabled (not toBeDisabled, since the root renders a span)', () => {
    render(<Switch checked={false} onCheckedChange={noop} disabled />);
    const control = screen.getByRole('switch');
    expect(control.tagName).toBe('SPAN');
    expect(control).toHaveAttribute('data-disabled');
    expect(control).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not set data-disabled or aria-disabled when not disabled', () => {
    render(<Switch checked={false} onCheckedChange={noop} />);
    const control = screen.getByRole('switch');
    expect(control).not.toHaveAttribute('data-disabled');
    expect(control).not.toHaveAttribute('aria-disabled');
  });

  it('supports readOnly, blocking toggling while keeping the control interactive for focus', async () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={handleChange} readOnly />);

    const control = screen.getByRole('switch');
    expect(control).toHaveAttribute('aria-readonly', 'true');
    expect(control).toHaveAttribute('data-readonly');

    await userEvent.click(control);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it.each<Size>(['xs', 'sm', 'md', 'lg'])('sets data-size to %s', (size) => {
    render(<Switch checked={false} onCheckedChange={noop} size={size} />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', size);
  });

  it('defaults size to md when not provided', () => {
    render(<Switch checked={false} onCheckedChange={noop} />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'md');
  });

  it('renders a label wired to the control via a wrapping label element', () => {
    render(<Switch checked={false} onCheckedChange={noop} label="Enable feature" />);
    expect(screen.getByText('Enable feature')).toBeInTheDocument();
    expect(screen.getByText('Enable feature')).toHaveClass('ps-Switch__label');

    const wrapper = screen.getByText('Enable feature').closest('label');
    expect(wrapper).toHaveClass('ps-Switch__wrapper');
    expect(wrapper).toContainElement(screen.getByRole('switch'));
  });

  it('toggles via onCheckedChange exactly once when the label text is clicked, not the switch itself', async () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={handleChange} label="Enable feature" />);

    await userEvent.click(screen.getByText('Enable feature'));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('does not render a wrapper when no label is provided', () => {
    const { container } = render(<Switch checked={false} onCheckedChange={noop} />);
    expect(container.querySelector('.ps-Switch__wrapper')).not.toBeInTheDocument();
  });

  it('merges additional className with ps-Switch', () => {
    render(<Switch checked={false} onCheckedChange={noop} className="custom" />);
    const control = screen.getByRole('switch');
    expect(control).toHaveClass('ps-Switch');
    expect(control).toHaveClass('custom');
  });

  it('spreads ...rest props onto the root, e.g. onBlur from a react-hook-form field spread', async () => {
    const handleBlur = vi.fn();
    render(
      <>
        <Switch checked={false} onCheckedChange={noop} onBlur={handleBlur} />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.click(screen.getByRole('switch'));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLElement>();
    render(<Switch checked={false} onCheckedChange={noop} ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('switch'));
  });

  it('applies a caller-provided id to the visible switch element', () => {
    render(<Switch checked={false} onCheckedChange={noop} id="my-switch" />);
    expect(screen.getByRole('switch')).toHaveAttribute('id', 'my-switch');
  });

  describe('accessibility', () => {
    it('is named by aria-label when there is no visible label', () => {
      render(<Switch checked={false} onCheckedChange={noop} aria-label="Enable feature" />);
      expect(screen.getByRole('switch', { name: 'Enable feature' })).toBeInTheDocument();
    });

    it('is named by its visible label', () => {
      render(<Switch checked={false} onCheckedChange={noop} label="Enable feature" />);
      expect(screen.getByRole('switch', { name: 'Enable feature' })).toBeInTheDocument();
    });

    it('prefers a caller-provided aria-labelledby over the generated label', () => {
      render(
        <>
          <span id="ext">External name</span>
          <Switch checked={false} onCheckedChange={noop} label="Inner" aria-labelledby="ext" />
        </>,
      );
      expect(screen.getByRole('switch', { name: 'External name' })).toBeInTheDocument();
    });

    it('is reachable with Tab and toggles with Space', async () => {
      const handleChange = vi.fn();
      render(<Switch checked={false} onCheckedChange={handleChange} aria-label="Feature" />);

      await userEvent.tab();
      expect(screen.getByRole('switch')).toHaveFocus();

      await userEvent.keyboard(' ');
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true, expect.anything());
    });

    it('toggles an uncontrolled switch and updates aria-checked', async () => {
      render(<Switch defaultChecked={false} aria-label="Feature" />);
      const control = screen.getByRole('switch');
      expect(control).toHaveAttribute('aria-checked', 'false');

      await userEvent.click(control);
      expect(control).toHaveAttribute('aria-checked', 'true');
    });

    it('is skipped by Tab when disabled', async () => {
      render(
        <>
          <Switch checked={false} onCheckedChange={noop} aria-label="Feature" disabled />
          <button type="button">Next</button>
        </>,
      );
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    });

    it('stays focusable but does not toggle with Space when readOnly', async () => {
      const handleChange = vi.fn();
      render(<Switch checked={false} onCheckedChange={handleChange} aria-label="Feature" readOnly />);

      await userEvent.tab();
      expect(screen.getByRole('switch')).toHaveFocus();

      await userEvent.keyboard(' ');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not toggle when the label is clicked while disabled', async () => {
      const handleChange = vi.fn();
      render(<Switch checked={false} onCheckedChange={handleChange} label="Feature" disabled />);
      await userEvent.click(screen.getByText('Feature'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('exposes required via aria-required', () => {
      render(<Switch checked={false} onCheckedChange={noop} aria-label="Feature" required />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-required', 'true');
    });

    it('forwards aria-invalid and aria-describedby to the switch', () => {
      render(
        <>
          <Switch checked={false} onCheckedChange={noop} aria-label="Feature" aria-invalid aria-describedby="help" />
          <span id="help">Must be on</span>
        </>,
      );
      const control = screen.getByRole('switch');
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(control).toHaveAccessibleDescription('Must be on');
    });

    it('keeps aria-checked and the label correct for every size and state combination', () => {
      const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
      for (const size of sizes) {
        for (const checked of [true, false]) {
          for (const state of ['none', 'disabled', 'readOnly'] as const) {
            const { unmount } = render(
              <Switch
                checked={checked}
                onCheckedChange={noop}
                size={size}
                label="Feature"
                disabled={state === 'disabled'}
                readOnly={state === 'readOnly'}
              />,
            );
            const control = screen.getByRole('switch', { name: 'Feature' });
            expect(control).toHaveAttribute('aria-checked', String(checked));
            expect(control).toHaveAttribute('data-size', size);
            if (state === 'disabled') expect(control).toHaveAttribute('aria-disabled', 'true');
            if (state === 'readOnly') expect(control).toHaveAttribute('aria-readonly', 'true');
            unmount();
          }
        }
      }
    });
  });

  describe('style props', () => {
    it('applies style props to the switch when there is no label', () => {
      render(<Switch aria-label="Feature" m="md" width={RESPONSIVE_WIDTH} />);

      const control = screen.getByRole('switch') as HTMLElement;
      expect(control).toHaveClass('ps-m', 'ps-width');
      expect(control.style.getPropertyValue('--ps-width')).toBe('100px');
      expect(control.style.getPropertyValue('--ps-width-md')).toBe('200px');
    });

    it('applies style props to the label wrapper when a label is rendered', () => {
      render(<Switch label="Feature" m="md" />);

      const control = screen.getByRole('switch');
      expect(control).not.toHaveClass('ps-m');
      expect(control.closest('.ps-Switch__wrapper')).toHaveClass('ps-m');
    });

    it('lets the style prop override computed variables', () => {
      render(<Switch aria-label="Feature" width={100} style={WIDTH_OVERRIDE} />);
      expect(screen.getByRole('switch')).toHaveStyle({ '--ps-width': '50px' });
    });

    it('does not leak style props to the DOM', () => {
      render(<Switch aria-label="Feature" m="sm" />);
      expect(screen.getByRole('switch')).not.toHaveAttribute('m');
    });
  });
});
