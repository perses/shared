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

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef, useCallback, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { Tooltip } from './Tooltip';
import type { TooltipProps } from './Tooltip';

const richTitle = <strong>Bold</strong>;
const dimensionOffset: Exclude<TooltipProps['offset'], number | undefined> = ({ side, align, anchor, positioner }) => {
  if (align !== 'center') return 0;
  return side === 'top' || side === 'bottom'
    ? anchor.height / 2 + positioner.height / 4
    : anchor.width / 2 + positioner.width / 4;
};

function tooltipDimensions(element: HTMLElement): [number, number] {
  if (element.classList.contains('ps-Tooltip__arrow')) return [8, 8];
  if (element.classList.contains('ps-Tooltip__positioner') || element.classList.contains('ps-Tooltip')) {
    return [120, 32];
  }
  if (element.tagName === 'BUTTON') return [100, 32];
  return [0, 0];
}

const StatefulTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>(
  function StatefulTrigger(props, ref) {
    const [count, setCount] = useState(0);
    const increment = useCallback(() => setCount((value) => value + 1), []);
    return (
      <button {...props} ref={ref} type="button" onClick={increment}>
        Count: {count}
      </button>
    );
  },
);

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    render(
      <Tooltip title="Helpful text">
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  it('does not render the tooltip content until hovered', () => {
    render(
      <Tooltip title="Helpful text">
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByText('Helpful text')).not.toBeInTheDocument();
  });

  it('shows the tooltip content on hover', async () => {
    render(
      <Tooltip title="Helpful text" delay={0}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
    await waitFor(() => expect(screen.getByText('Helpful text')).toBeInTheDocument());
  });

  it('applies the ps-Tooltip class to the popup', async () => {
    render(
      <Tooltip title="Helpful text" delay={0}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
    await waitFor(() => {
      const popup = screen.getByText('Helpful text').closest('.ps-Tooltip');
      expect(popup).toBeInTheDocument();
    });
  });

  it('renders children unwrapped when title is empty', () => {
    render(
      <Tooltip title="">
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders children unwrapped when title is false', async () => {
    const { container } = render(
      <Tooltip title={false}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Hover me' });
    expect(container.firstElementChild).toBe(trigger);
    expect(trigger).not.toHaveAttribute('aria-describedby');
    await userEvent.hover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders only the trigger when title is an empty string', async () => {
    const { container } = render(
      <Tooltip title="">
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Hover me' });
    expect(container.firstElementChild).toBe(trigger);
    await userEvent.hover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it.each(['', false, null, undefined])('preserves the trigger when title changes to %s', async (emptyTitle) => {
    const { rerender } = render(
      <Tooltip title="Helpful text" delay={0}>
        <StatefulTrigger />
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Count: 0' });
    await userEvent.click(trigger);
    expect(trigger).toHaveTextContent('Count: 1');
    expect(trigger).toHaveFocus();

    rerender(
      <Tooltip title={emptyTitle} delay={0}>
        <StatefulTrigger />
      </Tooltip>,
    );
    expect(screen.getByRole('button')).toBe(trigger);
    expect(trigger).toHaveTextContent('Count: 1');
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    rerender(
      <Tooltip title="Restored text" delay={0}>
        <StatefulTrigger />
      </Tooltip>,
    );
    expect(screen.getByRole('button')).toBe(trigger);
    expect(trigger).toHaveTextContent('Count: 1');
    expect(trigger).toHaveFocus();
  });

  it('clears the description when an open tooltip is disabled and re-enabled', async () => {
    const { rerender } = render(
      <Tooltip title="Helpful text" delay={0}>
        <button type="button">Focus me</button>
      </Tooltip>,
    );
    await userEvent.tab();
    const trigger = screen.getByRole('button');
    await screen.findByRole('tooltip');

    rerender(
      <Tooltip title={false} delay={0}>
        <button type="button">Focus me</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute('aria-describedby');

    rerender(
      <Tooltip title="Restored text" delay={0}>
        <button type="button">Focus me</button>
      </Tooltip>,
    );
    const restoredTrigger = screen.getByRole('button');
    expect(restoredTrigger).not.toHaveAttribute('aria-describedby');
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Restored text');
    expect(restoredTrigger).toHaveAccessibleDescription('Restored text');
  });

  describe('delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('waits 400ms before opening by default', () => {
      render(
        <Tooltip title="Helpful text">
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
      act(() => vi.advanceTimersByTime(399));
      expect(screen.queryByText('Helpful text')).not.toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByText('Helpful text')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('links the trigger to the open tooltip with aria-describedby', async () => {
      render(
        <Tooltip title="Helpful text" delay={0}>
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      const trigger = screen.getByRole('button', { name: 'Hover me' });
      await userEvent.hover(trigger);
      const popup = await screen.findByText('Helpful text');
      const describedBy = trigger.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(popup.closest('.ps-Tooltip')?.id).toBe(describedBy);
      expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful text');
    });

    it('uses a custom popup id and preserves existing descriptions', async () => {
      render(
        <>
          <span id="existing-description">Existing help</span>
          <Tooltip id="custom-tooltip" title="Helpful text" delay={0}>
            <button type="button" aria-describedby="existing-description">
              Focus me
            </button>
          </Tooltip>
        </>,
      );
      await userEvent.tab();
      expect(await screen.findByRole('tooltip')).toHaveAttribute('id', 'custom-tooltip');
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-describedby', 'existing-description custom-tooltip');
      expect(trigger).toHaveAccessibleDescription('Existing help Helpful text');
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveAttribute('aria-describedby', 'existing-description'));
    });

    it('opens on keyboard focus and closes on blur', async () => {
      render(
        <Tooltip title="Helpful text" delay={0}>
          <button type="button">Focus me</button>
        </Tooltip>,
      );
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Focus me' })).toHaveFocus();
      expect(await screen.findByText('Helpful text')).toBeInTheDocument();
      await userEvent.tab();
      await waitFor(() => expect(screen.queryByText('Helpful text')).not.toBeInTheDocument());
    });

    it('dismisses with Escape while keeping focus on the trigger', async () => {
      render(
        <Tooltip title="Helpful text" delay={0}>
          <button type="button">Focus me</button>
        </Tooltip>,
      );
      await userEvent.tab();
      await screen.findByText('Helpful text');
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByText('Helpful text')).not.toBeInTheDocument());
      expect(screen.getByRole('button', { name: 'Focus me' })).toHaveFocus();
    });

    it('keeps the tooltip open while the pointer moves onto the popup', async () => {
      render(
        <Tooltip title="Helpful text" delay={0}>
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
      const popup = (await screen.findByText('Helpful text')).closest('.ps-Tooltip') as HTMLElement;
      await userEvent.hover(popup);
      expect(screen.getByText('Helpful text')).toBeInTheDocument();
    });

    it('does not change the trigger accessible name or role', () => {
      render(
        <Tooltip title="Helpful text">
          <button type="button" aria-label="Close dialog">
            x
          </button>
        </Tooltip>,
      );
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });

    it('does not add aria-describedby when there is no title', () => {
      render(
        <Tooltip title={null}>
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
    });

    it('preserves the trigger disabled and aria-disabled state', () => {
      render(
        <>
          <Tooltip title="Why disabled">
            <button type="button" disabled>
              Native
            </button>
          </Tooltip>
          <Tooltip title="Why busy">
            <button type="button" aria-disabled="true">
              Aria
            </button>
          </Tooltip>
        </>,
      );
      expect(screen.getByRole('button', { name: 'Native' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Aria' })).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('portals the popup outside the trigger container', async () => {
    const { container } = render(
      <Tooltip title="Helpful text" delay={0}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole('button'));
    const popup = await screen.findByRole('tooltip');
    expect(container).not.toContainElement(popup);
    expect(document.body).toContainElement(popup);
  });

  describe('offset', () => {
    beforeEach(() => {
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
      vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return tooltipDimensions(this)[0];
      });
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return tooltipDimensions(this)[1];
      });
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const [width, height] = tooltipDimensions(this);
        const isTrigger = this.tagName === 'BUTTON';
        return new DOMRect(isTrigger ? 462 : 0, isTrigger ? 368 : 0, width, height);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      [undefined, 'translate(452px, 328px)'],
      [0, 'translate(452px, 336px)'],
      [16, 'translate(452px, 320px)'],
      [-4, 'translate(452px, 340px)'],
    ] as const)('positions the popup with offset %s (default 8)', async (offset, expectedTransform) => {
      render(
        <Tooltip title="Helpful text" delay={0} offset={offset}>
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button'));
      const popup = await screen.findByRole('tooltip');
      await waitFor(() => expect(popup.parentElement?.style.transform).toBe(expectedTransform));
      expect(popup).not.toHaveAttribute('offset');
    });

    it.each([
      ['top', 'translate(452px, 312px)'],
      ['bottom', 'translate(452px, 424px)'],
      ['left', 'translate(262px, 368px)'],
      ['right', 'translate(642px, 368px)'],
    ] as const)('calculates the %s offset from positioner data', async (placement, expectedTransform) => {
      render(
        <Tooltip title="Helpful text" delay={0} placement={placement} offset={dimensionOffset}>
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button'));
      const popup = await screen.findByRole('tooltip');
      await waitFor(() => expect(popup.parentElement?.style.transform).toBe(expectedTransform));
    });

    it('repositions an open tooltip when offset changes from a number to a function', async () => {
      const { rerender } = render(
        <Tooltip title="Helpful text" delay={0} offset={16}>
          <button type="button">Focus me</button>
        </Tooltip>,
      );
      await userEvent.tab();
      const popup = await screen.findByRole('tooltip');
      await waitFor(() => expect(popup.parentElement?.style.transform).toBe('translate(452px, 320px)'));

      rerender(
        <Tooltip title="Helpful text" delay={0} offset={dimensionOffset}>
          <button type="button">Focus me</button>
        </Tooltip>,
      );
      await waitFor(() => expect(popup.parentElement?.style.transform).toBe('translate(452px, 312px)'));
      expect(screen.getByRole('tooltip')).toBe(popup);
      expect(screen.getByRole('button')).toHaveFocus();
    });
  });

  describe('popup props', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it('forwards ref and extra props to the popup', async () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Tooltip title="Helpful text" delay={0} ref={ref} className="custom" data-testid="popup">
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
      const popup = await screen.findByTestId('popup');
      expect(ref.current).toBe(popup);
      expect(popup).toHaveClass('ps-Tooltip', 'custom');
    });

    it.each(['top', 'bottom', 'left', 'right'] as const)('applies placement %s as data-side', async (placement) => {
      render(
        <Tooltip title="Helpful text" delay={0} placement={placement}>
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      const trigger = screen.getByRole('button', { name: 'Hover me' });
      // jsdom has no layout (0x0 viewport), so fake a viewport and center the trigger to rule out collision flipping.
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
      vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(462, 368, 100, 32));
      await userEvent.hover(trigger);
      const popup = (await screen.findByText('Helpful text')).closest('.ps-Tooltip');
      expect(popup).toHaveAttribute('data-side', placement);
    });

    it.each(['top', 'bottom', 'left', 'right'] as const)(
      'keeps the arrow centered when revealed while open at %s',
      async (placement) => {
        vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
        vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
          return tooltipDimensions(this)[0];
        });
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
          return tooltipDimensions(this)[1];
        });
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
          const [width, height] = tooltipDimensions(this);
          const isTrigger = this.tagName === 'BUTTON';
          return new DOMRect(isTrigger ? 462 : 0, isTrigger ? 368 : 0, width, height);
        });
        const tree = (hideArrow: boolean): ReactElement => (
          <Tooltip title="Helpful text" delay={0} placement={placement} hideArrow={hideArrow}>
            <button type="button">Hover me</button>
          </Tooltip>
        );
        const { rerender } = render(tree(true));
        await userEvent.hover(screen.getByRole('button'));
        await screen.findByRole('tooltip');

        rerender(tree(false));
        const arrow = document.querySelector<HTMLElement>('.ps-Tooltip__arrow');
        const axis = placement === 'top' || placement === 'bottom' ? 'left' : 'top';
        await waitFor(() => expect(arrow?.style[axis]).toBe(axis === 'left' ? '56px' : '12px'));

        rerender(tree(true));
        expect(arrow).toBeInTheDocument();
        expect(arrow).not.toBeVisible();
      },
    );

    it('can hide the arrow without changing tooltip behavior', async () => {
      render(
        <Tooltip title="Helpful text" hideArrow delay={0}>
          <button type="button">Focus me</button>
        </Tooltip>,
      );
      await userEvent.tab();
      const popup = await screen.findByRole('tooltip');
      expect(popup).toHaveTextContent('Helpful text');
      expect(screen.getByRole('button')).toHaveAccessibleDescription('Helpful text');
      const arrow = popup.querySelector('.ps-Tooltip__arrow');
      expect(arrow).toBeInTheDocument();
      expect(arrow).not.toBeVisible();
    });

    it('renders rich content and an arrow hidden from assistive technology', async () => {
      render(
        <Tooltip title={richTitle} delay={0}>
          <button type="button">Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
      expect(await screen.findByText('Bold')).toBeInTheDocument();
      const arrow = document.querySelector('.ps-Tooltip__arrow');
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
