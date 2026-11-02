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
import type { KeyboardEvent, RefObject } from 'react';

import type { PersesCSSProperties } from '../../types';
import { Chip } from './index';
import type { ChipSlotProps } from './index';

const noop = (): void => {};
const prefix = <span>Prefix</span>;
const closeIcon = (
  <svg aria-hidden="true">
    <title>Close filter</title>
  </svg>
);
const rootStyle: PersesCSSProperties = { marginTop: 7, '--ps-width': '80px', '--consumer-root': 'root' };
const slots: ChipSlotProps = {
  start: { className: 'custom-start', style: { padding: 2, '--consumer-start': 'start' } },
  label: { className: 'custom-label', style: { fontWeight: 700, '--consumer-label': 'label' } },
  closeButton: { className: 'custom-close', style: { borderRadius: 0, '--consumer-close': 'close' } },
};

function createRuntimeSlots(): {
  injectedRef: RefObject<HTMLElement | null>;
  injectedHandler: ReturnType<typeof vi.fn>;
  runtimeSlots: ChipSlotProps;
} {
  const injectedRef = createRef<HTMLElement>();
  const injectedHandler = vi.fn();
  const invalidSlot = {
    className: 'runtime-slot',
    style: { opacity: 0.9 },
    id: 'injected-id',
    role: 'link',
    children: 'Injected content',
    'aria-label': 'Injected name',
    'aria-disabled': true,
    tabIndex: -1,
    disabled: true,
    onClick: injectedHandler,
    onKeyDown: injectedHandler,
    ref: injectedRef,
  };
  const runtimeSlots = {
    start: invalidSlot,
    label: invalidSlot,
    closeButton: invalidSlot,
    root: invalidSlot,
    unknown: invalidSlot,
  };
  return { injectedRef, injectedHandler, runtimeSlots };
}

const invalidEnabledSlot = { className: 'disabled-slot', disabled: false, 'aria-disabled': false, tabIndex: 0 };
const enabledRuntimeSlots = { label: invalidEnabledSlot, closeButton: invalidEnabledSlot };

function expectSlotStyles(root: HTMLElement | null): void {
  expect(root?.querySelector('.ps-Chip__start')).toHaveClass('custom-start');
  expect(root?.querySelector('.ps-Chip__start')).toHaveStyle({ padding: '2px', '--consumer-start': 'start' });
  expect(root?.querySelector('.ps-Chip__label')).toHaveClass('custom-label');
  expect(root?.querySelector('.ps-Chip__label')).toHaveStyle({ fontWeight: 700, '--consumer-label': 'label' });
  expect(root?.querySelector('button.ps-Chip__close')).toHaveClass('custom-close');
  expect(root?.querySelector('button.ps-Chip__close')).toHaveStyle({ borderRadius: 0, '--consumer-close': 'close' });
}

describe('Chip slots', () => {
  it('styles existing parts while preserving root styles, native attributes and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Chip
        ref={ref}
        id="filter"
        title="Environment"
        data-consumer="chip"
        className="consumer-root"
        style={rootStyle}
        width={100}
        maxWidth={120}
        color="success"
        size="sm"
        variant="outline"
        startElement={prefix}
        onClose={noop}
        slotProps={slots}
      >
        Production
      </Chip>,
    );
    const root = screen.getByText('Production').parentElement;
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('ps-Chip', 'consumer-root', 'ps-width');
    expect(root).toHaveAttribute('id', 'filter');
    expect(root).toHaveAttribute('title', 'Environment');
    expect(root).toHaveAttribute('data-consumer', 'chip');
    expect(root).toHaveAttribute('data-color', 'success');
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(root).toHaveAttribute('data-variant', 'outline');
    expect(root).toHaveStyle({
      marginTop: '7px',
      '--ps-width': '80px',
      '--consumer-root': 'root',
      '--perses-chip-label-max-width': '120px',
    });
    expect(root).not.toHaveAttribute('slotProps');
    expectSlotStyles(root);
    expect(screen.getByRole('button', { name: 'Remove Production' })).toHaveClass('custom-close');
  });

  it.each([undefined, null, false, 0])(
    'does not render optional parts for startElement=%s without onClose',
    (startElement) => {
      render(
        <Chip startElement={startElement} slotProps={slots}>
          Production
        </Chip>,
      );
      const root = screen.getByText('Production').parentElement;
      expect(root?.querySelector('.ps-Chip__start')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(root?.children).toHaveLength(1);
      expect(screen.getByText('Production')).toHaveClass('ps-Chip__label', 'custom-label');
    },
  );

  it('removes slot overrides on rerender without replacing parts or losing the root ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <Chip ref={ref} startElement={prefix} onClose={noop} slotProps={slots}>
        Production
      </Chip>,
    );
    const root = ref.current;
    const start = screen.getByText('Prefix').parentElement;
    const label = screen.getByText('Production');
    const close = screen.getByRole('button', { name: 'Remove Production' });
    expect(label).toHaveClass('custom-label');
    rerender(
      <Chip ref={ref} startElement={prefix} onClose={noop}>
        Production
      </Chip>,
    );
    expect(ref.current).toBe(root);
    expect(screen.getByText('Prefix').parentElement).toBe(start);
    expect(screen.getByText('Production')).toBe(label);
    expect(screen.getByRole('button', { name: 'Remove Production' })).toBe(close);
    for (const [part, requiredClass] of [
      [start, 'ps-Chip__start'],
      [label, 'ps-Chip__label'],
      [close, 'ps-Chip__close'],
    ] as const) {
      expect(part).toHaveClass(requiredClass, { exact: true });
      expect(part?.getAttribute('style') ?? '').toBe('');
    }
  });

  it('ignores runtime behavior and content keys while preserving action and close keyboard behavior', async () => {
    const ref = createRef<HTMLDivElement>();
    const { injectedRef, injectedHandler, runtimeSlots } = createRuntimeSlots();
    const onClick = vi.fn();
    const onClose = vi.fn();
    const onKeyDown = vi.fn();
    const onParentClick = vi.fn();
    render(
      <div role="presentation" onClick={onParentClick}>
        <Chip
          ref={ref}
          id="filter"
          role="note"
          aria-label="Select environment"

          aria-live="polite"
          closeAriaLabel="Clear environment"
          startElement={prefix}
          closeIcon={closeIcon}
          onClick={onClick}
          onClose={onClose}
          onKeyDown={onKeyDown}
          slotProps={runtimeSlots}
        >
          Production
        </Chip>
      </div>,
    );
    const action = screen.getByRole('button', { name: 'Select environment' });
    const close = screen.getByRole('button', { name: 'Clear environment' });
    expect(action).toHaveClass('ps-Chip__label', 'runtime-slot');
    expect(close).toHaveClass('ps-Chip__close', 'runtime-slot');
    expect(close).toBeEnabled();
    expect(close).toHaveAttribute('type', 'button');
    expect(close.querySelector('svg')).toHaveTextContent('Close filter');
    expect(action).toHaveAttribute('tabindex', '0');
    expect(action).not.toHaveAttribute('aria-disabled');
    expect(close).not.toHaveAttribute('tabindex');
    expect(ref.current).toBe(screen.getByRole('note'));
    expect(ref.current).toHaveAttribute('id', 'filter');
    expect(ref.current).toHaveAttribute('aria-live', 'polite');
    expect(ref.current).not.toHaveClass('runtime-slot');
    expect(document.getElementById('injected-id')).not.toBeInTheDocument();
    expect(screen.queryByText('Injected content')).not.toBeInTheDocument();
    expect(screen.getByText('Prefix').parentElement).not.toHaveAttribute('role');
    expect(injectedRef.current).toBeNull();
    await userEvent.tab();
    expect(action).toHaveFocus();
    await userEvent.keyboard('{Enter} ');
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onParentClick).toHaveBeenCalledTimes(2);
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.keyboard('{Enter} ');
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onParentClick).toHaveBeenCalledTimes(2);
    expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['Enter', ' ', 'Tab', 'Enter', ' ']);
    expect(injectedHandler).not.toHaveBeenCalled();
  });

  it('keeps disabled state authoritative when runtime slots try to enable both controls', async () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <Chip ref={ref} disabled onClick={onClick} onClose={onClose} slotProps={enabledRuntimeSlots}>
        Production
      </Chip>,
    );
    const root = ref.current;
    const action = screen.getByRole('button', { name: 'Production' });
    const close = screen.getByRole('button', { name: 'Remove Production' });
    expect(action).toHaveClass('disabled-slot');
    expect(action).toHaveAttribute('aria-disabled', 'true');
    expect(action).toHaveAttribute('tabindex', '-1');
    expect(close).toBeDisabled();
    expect(root).toHaveAttribute('data-disabled');
    await userEvent.click(action);
    action.focus();
    await userEvent.keyboard('{Enter} ');
    await userEvent.click(close);
    expect(onClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    rerender(
      <Chip ref={ref} onClick={onClick} onClose={onClose} slotProps={enabledRuntimeSlots}>
        Production
      </Chip>,
    );
    expect(ref.current).toBe(root);
    expect(root).not.toHaveAttribute('data-disabled');
    expect(action).not.toHaveAttribute('aria-disabled');
    expect(close).toBeEnabled();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(close);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('preserves keyboard cancellation and action relocation when onClose changes', async () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault());
    const { rerender } = render(
      <Chip ref={ref} onClick={onClick} onClose={noop} onKeyDown={onKeyDown} slotProps={slots}>
        Production
      </Chip>,
    );
    const label = screen.getByRole('button', { name: 'Production' });
    label.focus();
    await userEvent.keyboard('{Enter} ');
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    expect(onClick).not.toHaveBeenCalled();
    rerender(
      <Chip ref={ref} onClick={onClick} slotProps={slots}>
        Production
      </Chip>,
    );
    const action = screen.getByRole('button', { name: 'Production' });
    expect(action).toBe(ref.current);
    expect(screen.queryByRole('button', { name: 'Remove Production' })).not.toBeInTheDocument();
    expect(label).toHaveClass('ps-Chip__label', 'custom-label');
    expect(label).not.toHaveAttribute('role');
    action.focus();
    await userEvent.keyboard('{Enter} ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
