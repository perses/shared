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
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactElement } from 'react';

import { Tooltip } from '../Tooltip';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';
import { MenuLinkItem } from './MenuLinkItem';

const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(
  function RouterLink({ to, children, ...props }, ref) {
    return (
      <a ref={ref} href={to} data-router-link="" {...props}>
        {children}
      </a>
    );
  },
);

const trigger = <button type="button">Open</button>;

async function renderOpenMenu(children: ReactElement | ReactElement[]): Promise<RenderResult> {
  const result = render(<Menu trigger={trigger}>{children}</Menu>);
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  await screen.findByRole('menu');
  return result;
}

function getLink(name: string): HTMLElement {
  return screen.getByRole('menuitem', { name });
}

describe('MenuLinkItem', () => {
  it('renders a real anchor with the menuitem role and shared item classes', async () => {
    await renderOpenMenu(
      <MenuLinkItem href="/docs" target="_blank" rel="noopener">
        Documentation
      </MenuLinkItem>,
    );
    const link = getLink('Documentation');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveClass('ps-MenuItemBase', 'ps-MenuLinkItem');
    expect(link).not.toHaveClass('ps-MenuItem');
    expect(link).toHaveAttribute('data-size', 'md');
  });

  it('renders a router link through the render prop while keeping menu item behaviour', async () => {
    await renderOpenMenu([
      <MenuItem key="a">Copy</MenuItem>,
      <MenuLinkItem key="b" render={<RouterLink to="/profile" />}>
        Profile
      </MenuLinkItem>,
    ]);
    const link = getLink('Profile');
    expect(link).toHaveAttribute('data-router-link');
    expect(link).toHaveAttribute('href', '/profile');
    expect(link).toHaveClass('ps-MenuLinkItem');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(link).toHaveAttribute('data-highlighted');
  });

  it('closes the menu after activation by default', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    await renderOpenMenu(
      <MenuLinkItem href="/docs" onClick={onClick}>
        Documentation
      </MenuLinkItem>,
    );
    await userEvent.click(getLink('Documentation'));
    expect(onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('stays open with closeOnClick={false}', async () => {
    await renderOpenMenu(
      <MenuLinkItem href="/docs" closeOnClick={false} onClick={(event) => event.preventDefault()}>
        Documentation
      </MenuLinkItem>,
    );
    await userEvent.click(getLink('Documentation'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('activates with Enter', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    await renderOpenMenu(
      <MenuLinkItem href="/docs" onClick={onClick}>
        Documentation
      </MenuLinkItem>,
    );
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('still highlights when wrapped in a Tooltip', async () => {
    await renderOpenMenu([
      <MenuItem key="a">Copy</MenuItem>,
      <Tooltip key="b" title="Opens in a new tab">
        <MenuLinkItem href="/docs" target="_blank">
          Documentation
        </MenuLinkItem>
      </Tooltip>,
    ]);
    const link = getLink('Documentation');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(link).toHaveAttribute('data-highlighted');
    await userEvent.hover(link);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Opens in a new tab');
  });

  it('exposes selected and size and renders start and end elements', async () => {
    await renderOpenMenu(
      <MenuLinkItem
        href="/docs"
        selected
        size="sm"
        startElement={<span data-testid="start" />}
        endElement={<span data-testid="end" />}
      >
        Documentation
      </MenuLinkItem>,
    );
    const link = getLink('Documentation');
    expect(link).toHaveAttribute('data-selected', '');
    expect(link).toHaveAttribute('aria-current', 'true');
    expect(link).toHaveAttribute('data-size', 'sm');
    const [start, content, end] = link.children;
    expect(start).toHaveClass('ps-MenuItemBase__start');
    expect(content).toHaveClass('ps-MenuItemBase__content');
    expect(content).toHaveTextContent('Documentation');
    expect(end).toHaveClass('ps-MenuItemBase__end');
  });

  it('forwards ref, className, and style props without leaking them', async () => {
    const ref = createRef<HTMLAnchorElement>();
    await renderOpenMenu(
      <MenuLinkItem ref={ref} href="/docs" py="sm" rounded="sm" className="custom" style={{ color: 'red' }}>
        Documentation
      </MenuLinkItem>,
    );
    const link = getLink('Documentation');
    expect(ref.current).toBe(link);
    expect(link).toHaveClass('ps-py', 'ps-rounded', 'custom');
    expect(link).toHaveStyle({
      '--ps-py': 'var(--perses-spacing-sm)',
      '--ps-rounded': 'var(--perses-radius-sm)',
      color: 'rgb(255, 0, 0)',
    });
    expect(link).not.toHaveAttribute('py');
    expect(link).not.toHaveAttribute('rounded');
  });

  it('rejects disabled at the type level because anchors cannot be disabled', async () => {
    await renderOpenMenu(
      // @ts-expect-error -- MenuLinkItem has no disabled prop; omit the item instead
      <MenuLinkItem href="/docs" disabled>
        Documentation
      </MenuLinkItem>,
    );
    expect(getLink('Documentation')).toBeInTheDocument();
  });
});
