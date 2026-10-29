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
import { createRef } from 'react';

import type { PersesCSSProperties } from '../../types';
import { Menu, MenuItem } from './index';
import type { MenuProps, MenuSlotProps } from './index';

const rootStyle: PersesCSSProperties = { marginTop: 7, '--ps-min-width': '80px', '--consumer-root': 'root' };
const slots: MenuSlotProps = {
  positioner: { className: 'custom-positioner', style: { zIndex: 5, '--consumer-positioner': 'positioner' } },
};

function renderOpenMenu(props: Partial<MenuProps> = {}): ReturnType<typeof render> {
  return render(
    <Menu open {...props}>
      <MenuItem>Copy</MenuItem>
    </Menu>,
  );
}

function getPositioner(): HTMLElement {
  const positioner = screen.getByRole('menu').parentElement;
  expect(positioner).not.toBeNull();
  return positioner as HTMLElement;
}

describe('Menu slots', () => {
  it('styles the positioner while preserving popup root styles, native attributes and ref', () => {
    const ref = createRef<HTMLDivElement>();
    renderOpenMenu({
      ref,
      id: 'actions',
      'aria-label': 'Row actions',
      'data-consumer': 'menu',
      className: 'consumer-root',
      style: rootStyle,
      minWidth: 100,
      slotProps: slots,
    } as Partial<MenuProps>);
    const popup = screen.getByRole('menu');
    expect(ref.current).toBe(popup);
    expect(popup).toHaveClass('ps-Menu', 'consumer-root', 'ps-min-width');
    expect(popup).toHaveAttribute('id', 'actions');
    expect(popup).toHaveAttribute('data-consumer', 'menu');
    expect(popup).toHaveAccessibleName('Row actions');
    expect(popup).toHaveStyle({ marginTop: '7px', '--ps-min-width': '80px', '--consumer-root': 'root' });
    expect(popup).not.toHaveAttribute('slotProps');
    expect(popup).not.toHaveClass('custom-positioner');

    const positioner = getPositioner();
    expect(positioner).toHaveClass('ps-Menu__positioner', 'custom-positioner');
    expect(positioner).toHaveStyle({ zIndex: '5', '--consumer-positioner': 'positioner' });
  });

  it('removes slot overrides on rerender without replacing the positioner or losing the popup ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <Menu open ref={ref} slotProps={slots}>
        <MenuItem>Copy</MenuItem>
      </Menu>,
    );
    const popup = ref.current;
    const positioner = getPositioner();
    expect(positioner).toHaveClass('custom-positioner');

    rerender(
      <Menu open ref={ref}>
        <MenuItem>Copy</MenuItem>
      </Menu>,
    );
    expect(ref.current).toBe(popup);
    expect(getPositioner()).toBe(positioner);
    expect(positioner).toHaveClass('ps-Menu__positioner', { exact: true });
    expect(positioner).not.toHaveStyle({ zIndex: '5' });
  });

  it('ignores runtime content, semantics, handlers and ref keys in the positioner slot', () => {
    const injectedRef = createRef<HTMLElement>();
    const injectedHandler = vi.fn();
    const runtimeSlots = {
      positioner: {
        className: 'runtime-slot',
        style: { opacity: 0.9 },
        id: 'injected-id',
        role: 'dialog',
        children: 'Injected content',
        'aria-label': 'Injected name',
        onClick: injectedHandler,
        ref: injectedRef,
      },
      popup: { className: 'runtime-popup' },
    } as unknown as MenuSlotProps;
    renderOpenMenu({ slotProps: runtimeSlots });

    const positioner = getPositioner();
    expect(positioner).toHaveClass('ps-Menu__positioner', 'runtime-slot');
    expect(positioner).toHaveStyle({ opacity: '0.9' });
    expect(positioner).not.toHaveAttribute('id', 'injected-id');
    expect(positioner).not.toHaveAttribute('role', 'dialog');
    expect(positioner).not.toHaveAttribute('aria-label');
    expect(positioner).not.toHaveTextContent('Injected content');
    expect(injectedRef.current).toBeNull();
    positioner.click();
    expect(injectedHandler).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).not.toHaveClass('runtime-popup');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeInTheDocument();
  });

  it('rejects non-style keys in the positioner slot at the type level', () => {
    renderOpenMenu({
      // @ts-expect-error -- slotProps only accepts className and style for the positioner
      slotProps: { positioner: { id: 'nope' } },
    });
    expect(getPositioner()).not.toHaveAttribute('id', 'nope');
  });
});
