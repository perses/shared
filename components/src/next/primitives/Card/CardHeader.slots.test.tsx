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
import { createRef, useCallback, useState } from 'react';
import type { ReactElement, RefObject } from 'react';

import type { PersesCSSProperties } from '../../types';
import { CardHeader } from './Card';
import type { CardHeaderSlotProps } from './Card';

const rootStyle: PersesCSSProperties = { padding: 9, '--ps-width': '80px', '--consumer-root': 'root' };
const slots: CardHeaderSlotProps = {
  content: { className: 'custom-content', style: { marginTop: 2, '--consumer-content': 'content' } },
  end: { className: 'custom-end', style: { gap: 4, '--consumer-end': 'end' } },
};
const actions = <button type="button">Edit</button>;

function StatefulTitle(): ReactElement {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((value) => value + 1), []);
  return <button onClick={increment}>Count {count}</button>;
}
const statefulTitle = <StatefulTitle />;

function createRuntimeSlots(): {
  injectedRef: RefObject<HTMLElement>;
  injectedHandler: ReturnType<typeof vi.fn>;
  runtimeSlots: CardHeaderSlotProps;
} {
  const injectedRef = createRef<HTMLElement>();
  const injectedHandler = vi.fn();
  const invalidSlot = {
    className: 'runtime-slot',
    style: { opacity: 0.9 },
    id: 'injected-id',
    role: 'button',
    children: 'Injected content',
    'aria-label': 'Injected name',
    'aria-hidden': false,
    disabled: true,
    tabIndex: 0,
    onClick: injectedHandler,
    ref: injectedRef,
  };
  const runtimeSlots = { content: invalidSlot, end: invalidSlot, root: invalidSlot, unknown: invalidSlot };
  return { injectedRef, injectedHandler, runtimeSlots };
}

describe('CardHeader slots', () => {
  it('styles the content and end wrappers while preserving root styles, native attributes and ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <CardHeader
        ref={ref}
        as="header"
        id="panel-header"
        data-consumer="header"
        className="consumer-root"
        style={rootStyle}
        p="md"
        endElement={actions}
        slotProps={slots}
      >
        Variables
      </CardHeader>,
    );
    const root = screen.getByRole('banner');
    const content = screen.getByText('Variables');
    const end = screen.getByRole('button', { name: 'Edit' }).parentElement;
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('ps-CardHeader', 'consumer-root', 'ps-p');
    expect(root).toHaveAttribute('id', 'panel-header');
    expect(root).toHaveAttribute('data-consumer', 'header');
    expect(root).toHaveStyle({
      padding: '9px',
      '--ps-width': '80px',
      '--consumer-root': 'root',
      '--ps-p': 'var(--perses-spacing-md)',
    });
    expect(root).not.toHaveAttribute('slotProps');
    expect(root).not.toHaveClass('custom-content');
    expect(root).not.toHaveClass('custom-end');
    expect(content).toHaveClass('ps-CardHeader__content', 'custom-content');
    expect(content).toHaveStyle({ marginTop: '2px', '--consumer-content': 'content' });
    expect(content.style.padding).toBe('');
    expect(end).toHaveClass('ps-CardHeader__end', 'custom-end');
    expect(end).toHaveStyle({ gap: '4px', '--consumer-end': 'end' });
    expect(root.children).toHaveLength(2);
  });

  it.each([undefined, null, false, true])(
    'does not render an end wrapper for endElement=%s despite slot styling',
    (endElement) => {
      render(
        <CardHeader data-testid="header" endElement={endElement} slotProps={slots}>
          Title only
        </CardHeader>,
      );
      const root = screen.getByTestId('header');
      expect(root.querySelector('.ps-CardHeader__end')).not.toBeInTheDocument();
      expect(root.querySelector('.custom-end')).not.toBeInTheDocument();
      expect(root.children).toHaveLength(1);
      expect(screen.getByText('Title only')).toHaveClass('ps-CardHeader__content', 'custom-content');
    },
  );

  it('ignores runtime content, semantics, handlers and ref keys in all slots', async () => {
    const ref = createRef<HTMLElement>();
    const { injectedRef, injectedHandler, runtimeSlots } = createRuntimeSlots();
    const onClick = vi.fn();
    render(
      <CardHeader
        ref={ref}
        as="header"
        id="panel-header"
        aria-label="Panel header"
        endElement={actions}
        onClick={onClick}
        slotProps={runtimeSlots}
      >
        Title
      </CardHeader>,
    );
    const root = screen.getByRole('banner', { name: 'Panel header' });
    const content = screen.getByText('Title');
    const end = screen.getByRole('button', { name: 'Edit' }).parentElement;
    expect(content).toHaveClass('runtime-slot');
    expect(end).toHaveClass('runtime-slot');
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'panel-header');
    expect(root).not.toHaveClass('runtime-slot');
    expect(root).not.toHaveAttribute('slotProps');
    expect(document.getElementById('injected-id')).not.toBeInTheDocument();
    expect(screen.queryByText('Injected content')).not.toBeInTheDocument();
    expect(injectedRef.current).toBeNull();
    for (const part of [content, end]) {
      expect(part).not.toHaveAttribute('role');
      expect(part).not.toHaveAttribute('aria-label');
      expect(part).not.toHaveAttribute('disabled');
      expect(part).not.toHaveAttribute('tabindex');
    }
    await userEvent.click(content);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(injectedHandler).not.toHaveBeenCalled();
  });

  it('removes slot styling on rerender without resetting children, parts or refs', async () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(
      <CardHeader ref={ref} endElement={actions} slotProps={slots}>
        {statefulTitle}
      </CardHeader>,
    );
    const root = ref.current as HTMLElement;
    const content = root.querySelector('.ps-CardHeader__content');
    const end = root.querySelector('.ps-CardHeader__end');
    await userEvent.click(screen.getByRole('button', { name: 'Count 0' }));
    expect(content).toHaveClass('custom-content');
    rerender(
      <CardHeader ref={ref} endElement={actions}>
        {statefulTitle}
      </CardHeader>,
    );
    expect(ref.current).toBe(root);
    expect(root.querySelector('.ps-CardHeader__content')).toBe(content);
    expect(root.querySelector('.ps-CardHeader__end')).toBe(end);
    expect(content).toHaveClass('ps-CardHeader__content', { exact: true });
    expect(end).toHaveClass('ps-CardHeader__end', { exact: true });
    expect(content?.getAttribute('style') ?? '').toBe('');
    expect(end?.getAttribute('style') ?? '').toBe('');
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
    rerender(
      <CardHeader ref={ref} slotProps={slots}>
        {statefulTitle}
      </CardHeader>,
    );
    expect(root.querySelector('.ps-CardHeader__end')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
  });
});
