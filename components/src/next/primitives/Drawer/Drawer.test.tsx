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

import { Dialog } from '@base-ui/react/dialog';
import { render, screen, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { ThemeModeProvider } from '../../contexts/ThemeModeProvider';
import { Drawer } from './Drawer';
import type { DrawerProps } from './Drawer';
import { DrawerContent } from './DrawerContent';
import { DrawerHeader } from './DrawerHeader';

function renderDrawer(props: Partial<DrawerProps> = {}, children: ReactNode = 'Body'): RenderResult {
  return render(
    <Drawer open onClose={() => {}} aria-label="Drawer" {...props}>
      {children}
    </Drawer>,
  );
}

function ControlledDrawer({
  onRequestClose,
  children,
}: {
  onRequestClose?: () => void;
  children?: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Drawer
        open={open}
        onClose={() => {
          onRequestClose?.();
          setOpen(false);
        }}
        aria-label="Drawer"
      >
        {children ?? (
          <button type="button" onClick={() => setOpen(false)}>
            Done
          </button>
        )}
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('renders nothing when closed and a dialog popup when open', () => {
    const { rerender } = render(<Drawer open={false} onClose={() => {}} aria-label="Drawer" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <Drawer open onClose={() => {}} aria-label="Drawer">
        Body
      </Drawer>,
    );
    const popup = screen.getByRole('dialog');
    expect(popup).toHaveClass('ps-Drawer');
    expect(popup).toHaveTextContent('Body');
  });

  it('forwards data-testid, className and ref to the popup', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Drawer open onClose={() => {}} aria-label="Drawer" data-testid="panel-editor" className="custom" ref={ref}>
        Body
      </Drawer>,
    );
    const popup = screen.getByTestId('panel-editor');
    expect(popup).toBe(screen.getByRole('dialog'));
    expect(popup).toHaveClass('ps-Drawer', 'custom');
    expect(ref.current).toBe(popup);
  });

  it('defaults anchor to right and reflects left', () => {
    const { rerender } = renderDrawer();
    expect(screen.getByRole('dialog')).toHaveAttribute('data-anchor', 'right');
    rerender(
      <Drawer open onClose={() => {}} aria-label="Drawer" anchor="left">
        Body
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-anchor', 'left');
  });

  it('renders a backdrop behind the popup', () => {
    renderDrawer();
    const backdrop = document.querySelector('.ps-Drawer__backdrop');
    expect(backdrop).toBeInTheDocument();
  });

  describe('closing is a request', () => {
    it('calls onClose on Escape but stays open while open stays true', async () => {
      const onClose = vi.fn();
      renderDrawer({ onClose });
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('calls onClose on backdrop click but stays open while open stays true', async () => {
      const onClose = vi.fn();
      renderDrawer({ onClose });
      const backdrop = document.querySelector<HTMLElement>('.ps-Drawer__backdrop');
      await userEvent.click(backdrop as HTMLElement);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes when the consumer flips open to false', async () => {
      render(<ControlledDrawer />);
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('does not request close when clicking inside a nested portaled dialog', async () => {
      const onClose = vi.fn();
      renderDrawer(
        { onClose },
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title>Discard changes?</Dialog.Title>
              <button type="button">Discard</button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it.each<DrawerProps['anchor']>(['right', 'left'])('fires onExited once after closing from %s', async (anchor) => {
    const onExited = vi.fn();
    function Harness(): ReactElement {
      const [open, setOpen] = useState(true);
      return (
        <Drawer open={open} onClose={() => setOpen(false)} onExited={onExited} anchor={anchor} aria-label="Drawer">
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </Drawer>
      );
    }
    render(<Harness />);
    expect(onExited).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(onExited).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('focus', () => {
    it('moves focus into the popup on open and returns it to the trigger on close', async () => {
      render(<ControlledDrawer />);
      const trigger = screen.getByRole('button', { name: 'Open' });
      await userEvent.click(trigger);
      const popup = await screen.findByRole('dialog');
      await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  });

  describe('theme mode across the portal', () => {
    it('propagates the nearest ThemeModeProvider mode onto the portal container', () => {
      render(
        <ThemeModeProvider mode="dark">
          <Drawer open onClose={() => {}} aria-label="Drawer">
            Body
          </Drawer>
        </ThemeModeProvider>,
      );
      const popup = screen.getByRole('dialog');
      expect(popup.closest('[data-perses-mode]')).toHaveAttribute('data-perses-mode', 'dark');
      expect(document.documentElement).not.toHaveAttribute('data-perses-mode');
      expect(document.body).not.toHaveAttribute('data-perses-mode');
    });

    it('sets no mode without a provider', () => {
      renderDrawer();
      expect(screen.getByRole('dialog').closest('[data-perses-mode]')).toBeNull();
    });
  });

  describe('parts', () => {
    it('DrawerHeader names the dialog from its visible title, over aria-label, and renders endElement', () => {
      render(
        <Drawer open onClose={() => {}} aria-label="fallback">
          <DrawerHeader endElement={<button type="button">Apply</button>}>Edit variables</DrawerHeader>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog', { name: 'Edit variables' });
      const title = screen.getByRole('heading', { level: 2, name: 'Edit variables' });
      expect(title).toHaveClass('ps-DrawerHeader__title');
      expect(dialog).toHaveAttribute('aria-labelledby', title.id);
      expect(screen.getByRole('button', { name: 'Apply' }).parentElement).toHaveClass('ps-DrawerHeader__end');
    });

    it.each([
      ['undefined', undefined],
      ['false', false],
      ['null', null],
    ])('DrawerHeader omits the end slot for falsy endElement (%s)', (_, endElement) => {
      renderDrawer({}, <DrawerHeader endElement={endElement}>Title</DrawerHeader>);
      expect(document.querySelector('.ps-DrawerHeader__end')).toBeNull();
    });

    it('DrawerHeader and DrawerContent forward ref, className, style props and slotProps', () => {
      const headerRef = createRef<HTMLDivElement>();
      const contentRef = createRef<HTMLDivElement>();
      renderDrawer(
        {},
        <>
          <DrawerHeader
            ref={headerRef}
            className="h"
            p="sm"
            slotProps={{ title: { className: 't' }, end: { className: 'e' } }}
            endElement="x"
          >
            Title
          </DrawerHeader>
          <DrawerContent ref={contentRef} className="c" p="0" data-testid="body">
            Body
          </DrawerContent>
        </>,
      );
      expect(headerRef.current).toHaveClass('ps-DrawerHeader', 'ps-p', 'h');
      expect(document.querySelector('.ps-DrawerHeader__title')).toHaveClass('t');
      expect(document.querySelector('.ps-DrawerHeader__end')).toHaveClass('e');
      expect(contentRef.current).toBe(screen.getByTestId('body'));
      expect(contentRef.current).toHaveClass('ps-DrawerContent', 'ps-p', 'c');
      expect(contentRef.current).toHaveStyle({ '--ps-p': 'var(--perses-spacing-0)' });
    });

    it('marks DrawerContent so mouse drags inside it do not start a swipe, leaving the header as the drag handle', () => {
      renderDrawer(
        {},
        <>
          <DrawerHeader data-testid="header">Title</DrawerHeader>
          <DrawerContent data-testid="body">Body</DrawerContent>
        </>,
      );
      expect(screen.getByTestId('body')).toHaveAttribute('data-drawer-content');
      expect(screen.getByTestId('header')).not.toHaveAttribute('data-drawer-content');
    });
  });

  describe('prop combinations', () => {
    it('maps sizing props onto the popup and keeps caller style and className', () => {
      renderDrawer({ width: '50%', className: 'custom', style: { color: 'red' } });
      const popup = screen.getByRole('dialog');
      expect(popup).toHaveClass('ps-Drawer', 'ps-width', 'custom');
      expect(popup).toHaveStyle({ '--ps-width': '50%', color: 'rgb(255, 0, 0)' });
      expect(popup).not.toHaveAttribute('width');
    });

    it('supports responsive width', () => {
      renderDrawer({ width: { default: '100%', lg: 1080 } });
      expect(screen.getByRole('dialog')).toHaveStyle({ '--ps-width': '100%', '--ps-width-lg': '1080px' });
    });

    it('maps radius props onto the popup', () => {
      renderDrawer({ roundedLeft: 'lg' });
      const popup = screen.getByRole('dialog');
      expect(popup).toHaveClass('ps-Drawer', 'ps-rounded-left');
      expect(popup).toHaveStyle({ '--ps-rounded-left': 'var(--perses-radius-lg)' });
      expect(popup).not.toHaveAttribute('roundedLeft');
    });

    it('applies --perses-drawer-* custom properties from style to the popup', () => {
      renderDrawer({
        style: { '--perses-drawer-bg': 'red', '--perses-drawer-radius': '0px', '--perses-drawer-width': '600px' },
      });
      expect(screen.getByRole('dialog')).toHaveStyle({
        '--perses-drawer-bg': 'red',
        '--perses-drawer-radius': '0px',
        '--perses-drawer-width': '600px',
      });
    });

    it('applies slotProps to the backdrop and viewport, keeping their component classes', () => {
      renderDrawer({
        slotProps: {
          backdrop: { className: 'b', style: { backgroundColor: 'red' } },
          viewport: { className: 'v', style: { top: '64px' } },
        },
      });
      const backdrop = document.querySelector('.ps-Drawer__backdrop');
      expect(backdrop).toHaveClass('b');
      expect(backdrop).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
      const viewport = screen.getByRole('dialog').parentElement;
      expect(viewport).toHaveClass('ps-Drawer__viewport', 'v');
      expect(viewport).toHaveStyle({ top: '64px' });
    });

    it('names the dialog from aria-label or aria-labelledby', () => {
      const { rerender } = renderDrawer({ 'aria-label': 'Edit panel' });
      expect(screen.getByRole('dialog', { name: 'Edit panel' })).toBeInTheDocument();
      rerender(
        <Drawer open onClose={() => {}} aria-labelledby="title">
          <h2 id="title">Edit datasource</h2>
        </Drawer>,
      );
      expect(screen.getByRole('dialog', { name: 'Edit datasource' })).toBeInTheDocument();
    });

    it.each([
      ['0', 0],
      ['false', false],
      ['null', null],
    ])('renders an empty popup for falsy children (%s)', (_, child) => {
      renderDrawer({}, child);
      const popup = screen.getByRole('dialog');
      expect(popup).toHaveTextContent(child === 0 ? '0' : '');
    });
  });
});
