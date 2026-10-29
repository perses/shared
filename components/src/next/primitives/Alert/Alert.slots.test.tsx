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
import type { ReactElement, ReactNode, RefObject, SVGProps } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import type { PersesCSSProperties } from '../../types';
import { defaultComponents, defaultIcons } from '../defaults';
import { Alert } from './index';
import type { AlertSlotProps } from './index';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

const rootStyle: PersesCSSProperties = { padding: 9, '--ps-width': '80px', '--consumer-root': 'root' };
const slots: AlertSlotProps = {
  icon: { className: 'custom-icon', style: { marginTop: 2, '--consumer-icon': 'icon' } },
  message: { className: 'custom-message', style: { fontWeight: 700, '--consumer-message': 'message' } },
};
const customIcon = (
  <svg aria-hidden="true">
    <title>Custom icon</title>
  </svg>
);

function StatefulMessage(): ReactElement {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((value) => value + 1), []);
  return <button onClick={increment}>Count {count}</button>;
}
const statefulMessage = <StatefulMessage />;

function ProviderInfoIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...props}>
      <title>Provider info</title>
    </svg>
  );
}
const providerIcons = { ...defaultIcons, Info: ProviderInfoIcon };

function ProviderWrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={providerIcons}>
      {children}
    </ComponentsProvider>
  );
}

function createRuntimeSlots(): {
  injectedRef: RefObject<HTMLElement | null>;
  injectedHandler: ReturnType<typeof vi.fn>;
  runtimeSlots: AlertSlotProps;
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
  const runtimeSlots = { icon: invalidSlot, message: invalidSlot, root: invalidSlot, unknown: invalidSlot };
  return { injectedRef, injectedHandler, runtimeSlots };
}

describe('Alert slots', () => {
  it('styles the existing Icon wrapper and message while preserving root styles, native attributes and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Alert
        ref={ref}
        id="status"
        title="Environment"
        data-consumer="alert"
        role="note"
        severity="warning"
        className="consumer-root"
        style={rootStyle}
        width={100}
        p="md"
        icon={customIcon}
        slotProps={slots}
      >
        Something happened
      </Alert>,
      { wrapper: Wrapper },
    );
    const root = screen.getByRole('note');
    const icon = root.querySelector('.ps-Alert__icon');
    const message = screen.getByText('Something happened');
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('ps-Alert', 'consumer-root', 'ps-width', 'ps-p');
    expect(root).toHaveAttribute('id', 'status');
    expect(root).toHaveAttribute('title', 'Environment');
    expect(root).toHaveAttribute('data-consumer', 'alert');
    expect(root).toHaveAttribute('data-severity', 'warning');
    expect(root).toHaveStyle({
      padding: '9px',
      '--ps-width': '80px',
      '--consumer-root': 'root',
      '--ps-p': 'var(--perses-spacing-md)',
    });
    expect(root).not.toHaveAttribute('slotProps');
    expect(icon).toHaveClass('ps-Icon', 'ps-Alert__icon', 'custom-icon');
    expect(icon).toHaveStyle({ marginTop: '2px', '--consumer-icon': 'icon' });
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).toHaveTextContent('Custom icon');
    expect(icon?.querySelector('svg')).not.toHaveClass('custom-icon');
    expect(message).toHaveClass('ps-Alert__message', 'custom-message');
    expect(message).toHaveStyle({ fontWeight: 700, '--consumer-message': 'message' });
    expect(root.children).toHaveLength(2);
  });

  it.each([undefined, null, false, 0])('does not render an icon for icon=%s despite slot styling', (icon) => {
    render(
      <Alert icon={icon} slotProps={slots}>
        Message only
      </Alert>,
      { wrapper: Wrapper },
    );
    const root = screen.getByRole('alert');
    expect(root.querySelector('.ps-Alert__icon')).not.toBeInTheDocument();
    expect(root.children).toHaveLength(1);
    expect(screen.getByText('Message only')).toHaveClass('ps-Alert__message', 'custom-message');
  });

  it('keeps provider icon resolution independent of severity when slots are styled', () => {
    render(
      <Alert severity="error" icon="info" slotProps={slots}>
        Message
      </Alert>,
      { wrapper: ProviderWrapper },
    );
    const root = screen.getByRole('alert');
    expect(root).toHaveAttribute('data-severity', 'error');
    expect(root.querySelector('.ps-Alert__icon')).toHaveClass('custom-icon');
    expect(root.querySelector('.ps-Alert__icon svg')).toHaveTextContent('Provider info');
  });

  it('ignores runtime content, semantics, handlers and ref keys in all slots', async () => {
    const ref = createRef<HTMLDivElement>();
    const { injectedRef, injectedHandler, runtimeSlots } = createRuntimeSlots();
    const onClick = vi.fn();
    render(
      <Alert
        ref={ref}
        id="status"
        role="note"
        aria-label="Environment status"
        severity="success"
        icon={customIcon}
        onClick={onClick}
        slotProps={runtimeSlots}
      >
        Message
      </Alert>,
      { wrapper: Wrapper },
    );
    const root = screen.getByRole('note', { name: 'Environment status' });
    const icon = root.querySelector('.ps-Alert__icon');
    const message = screen.getByText('Message');
    expect(icon).toHaveClass('runtime-slot');
    expect(message).toHaveClass('runtime-slot');
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'status');
    expect(root).toHaveAttribute('data-severity', 'success');
    expect(root).not.toHaveClass('runtime-slot');
    expect(root).not.toHaveAttribute('slotProps');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).toHaveTextContent('Custom icon');
    expect(document.getElementById('injected-id')).not.toBeInTheDocument();
    expect(screen.queryByText('Injected content')).not.toBeInTheDocument();
    expect(injectedRef.current).toBeNull();
    for (const part of [icon, message]) {
      expect(part).not.toHaveAttribute('role');
      expect(part).not.toHaveAttribute('aria-label');
      expect(part).not.toHaveAttribute('disabled');
      expect(part).not.toHaveAttribute('tabindex');
    }
    await userEvent.click(message);
    await userEvent.click(screen.getByTitle('Custom icon'));
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(injectedHandler).not.toHaveBeenCalled();
  });

  it('removes slot styling on rerender without resetting children, parts or refs', async () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <Alert ref={ref} icon="info" slotProps={slots}>
        {statefulMessage}
      </Alert>,
      { wrapper: Wrapper },
    );
    const root = screen.getByRole('alert');
    const icon = root.querySelector('.ps-Alert__icon');
    const message = root.querySelector('.ps-Alert__message');
    await userEvent.click(screen.getByRole('button', { name: 'Count 0' }));
    expect(message).toHaveClass('custom-message');
    rerender(
      <Alert ref={ref} icon="info">
        {statefulMessage}
      </Alert>,
    );
    expect(ref.current).toBe(root);
    expect(root.querySelector('.ps-Alert__icon')).toBe(icon);
    expect(root.querySelector('.ps-Alert__message')).toBe(message);
    expect(icon).toHaveClass('ps-Icon ps-Alert__icon', { exact: true });
    expect(message).toHaveClass('ps-Alert__message', { exact: true });
    expect(icon?.getAttribute('style') ?? '').toBe('');
    expect(message?.getAttribute('style') ?? '').toBe('');
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
    rerender(
      <Alert ref={ref} slotProps={slots}>
        {statefulMessage}
      </Alert>,
    );
    expect(root.querySelector('.ps-Alert__icon')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
  });
});
