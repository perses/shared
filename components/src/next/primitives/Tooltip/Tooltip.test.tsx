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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    render(
      <Tooltip title="Helpful text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  it('does not render the tooltip content until hovered', () => {
    render(
      <Tooltip title="Helpful text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByText('Helpful text')).not.toBeInTheDocument();
  });

  it('shows the tooltip content on hover', async () => {
    render(
      <Tooltip title="Helpful text" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
    await waitFor(() => expect(screen.getByText('Helpful text')).toBeInTheDocument());
  });

  it('applies the ps-Tooltip class to the popup', async () => {
    render(
      <Tooltip title="Helpful text" delay={0}>
        <button>Hover me</button>
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
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  describe('accessibility', () => {
    it('links the trigger to the open tooltip with aria-describedby', async () => {
      render(
        <Tooltip title="Helpful text" delay={0}>
          <button>Hover me</button>
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

    it('opens on keyboard focus and closes on blur', async () => {
      render(
        <Tooltip title="Helpful text" delay={0}>
          <button>Focus me</button>
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
          <button>Focus me</button>
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
          <button>Hover me</button>
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
          <button aria-label="Close dialog">x</button>
        </Tooltip>,
      );
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });

    it('does not add aria-describedby when there is no title', () => {
      render(
        <Tooltip title={null}>
          <button>Hover me</button>
        </Tooltip>,
      );
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
    });

    it('preserves the trigger disabled and aria-disabled state', () => {
      render(
        <>
          <Tooltip title="Why disabled">
            <button disabled>Native</button>
          </Tooltip>
          <Tooltip title="Why busy">
            <button aria-disabled="true">Aria</button>
          </Tooltip>
        </>,
      );
      expect(screen.getByRole('button', { name: 'Native' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Aria' })).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('popup props', () => {
    it('forwards ref and extra props to the popup', async () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Tooltip title="Helpful text" delay={0} ref={ref} className="custom" data-testid="popup">
          <button>Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
      const popup = await screen.findByTestId('popup');
      expect(ref.current).toBe(popup);
      expect(popup).toHaveClass('ps-Tooltip', 'custom');
    });

    it.each(['top', 'bottom', 'left', 'right'] as const)('renders with placement %s', async (placement) => {
      render(
        <Tooltip title="Helpful text" delay={0} placement={placement}>
          <button>Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
      const popup = (await screen.findByText('Helpful text')).closest('.ps-Tooltip');
      expect(popup).toHaveAttribute('data-side');
    });

    it('renders rich content and an arrow', async () => {
      render(
        <Tooltip title={<strong>Bold</strong>} delay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
      expect(await screen.findByText('Bold')).toBeInTheDocument();
      expect(document.querySelector('.ps-Tooltip__arrow')).toBeInTheDocument();
    });
  });
});
