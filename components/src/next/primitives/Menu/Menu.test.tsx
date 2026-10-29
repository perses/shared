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
import { createRef, useState } from 'react';
import type { ReactElement } from 'react';

import { Divider } from '../Divider';
import { Menu } from './Menu';
import type { MenuProps } from './Menu';
import { MenuItem } from './MenuItem';

const trigger = (
  <button type="button" id="open-menu">
    Open
  </button>
);

function renderMenu(
  props: Partial<MenuProps> = {},
  children: ReactElement | ReactElement[] = defaultItems(),
): RenderResult {
  return render(
    <Menu trigger={trigger} {...props}>
      {children}
    </Menu>,
  );
}

function defaultItems(): ReactElement[] {
  return [
    <MenuItem key="copy">Copy</MenuItem>,
    <MenuItem key="paste">Paste</MenuItem>,
    <MenuItem key="delete">Delete</MenuItem>,
  ];
}

async function openMenu(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  return screen.findByRole('menu');
}

function ThemeSwitchItem(): ReactElement {
  const [dark, setDark] = useState(false);
  return <MenuItem onClick={() => setDark((value) => !value)}>{dark ? 'Light mode' : 'Dark mode'}</MenuItem>;
}

describe('Menu', () => {
  it('renders the trigger and no menu until opened', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on trigger click with the expected roles and classes', async () => {
    renderMenu();
    const menu = await openMenu();
    expect(menu).toHaveClass('ps-Menu');
    expect(menu.parentElement).toHaveClass('ps-Menu__positioner');
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);
    for (const item of items) expect(item).toHaveClass('ps-MenuItemBase', 'ps-MenuItem');
  });

  it('supports uncontrolled defaultOpen', async () => {
    renderMenu({ defaultOpen: true });
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('supports controlled open with onOpenChange', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = renderMenu({ open: false, onOpenChange });
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    rerender(
      <Menu trigger={trigger} open onOpenChange={onOpenChange}>
        {defaultItems()}
      </Menu>,
    );
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    renderMenu();
    await openMenu();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('closes on outside click', async () => {
    render(
      <>
        <Menu trigger={trigger}>{defaultItems()}</Menu>
        <button type="button">Elsewhere</button>
      </>,
    );
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('keeps the popup mounted but hidden when keepMounted is set', async () => {
    renderMenu({ keepMounted: true });
    const menu = screen.getByRole('menu', { hidden: true });
    expect(menu).toBeInTheDocument();
    expect(menu).not.toBeVisible();
    await openMenu();
    expect(screen.getByRole('menu')).toBeVisible();
  });

  it('maps placement and align onto the positioner', async () => {
    renderMenu({ placement: 'top', align: 'end' });
    const menu = await openMenu();
    expect(menu.parentElement).toHaveAttribute('data-side', 'top');
    expect(menu.parentElement).toHaveAttribute('data-align', 'end');
  });

  it('defaults to bottom / start', async () => {
    renderMenu();
    const menu = await openMenu();
    expect(menu.parentElement).toHaveAttribute('data-side', 'bottom');
    expect(menu.parentElement).toHaveAttribute('data-align', 'start');
  });

  it('positions from a virtual anchor without a trigger', async () => {
    const anchor = { getBoundingClientRect: (): DOMRect => new DOMRect(40, 60, 0, 0) };
    render(
      <Menu open anchor={anchor}>
        {defaultItems()}
      </Menu>,
    );
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('forwards aria-label, onClick, and ref to the popup', async () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    renderMenu({ 'aria-label': 'Row actions', onClick, ref } as Partial<MenuProps>);
    const menu = await openMenu();
    expect(menu).toHaveAccessibleName('Row actions');
    expect(ref.current).toBe(menu);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('labels the popup from the trigger by default', async () => {
    renderMenu();
    const menu = await openMenu();
    expect(menu).toHaveAccessibleName('Open');
  });

  it('lets a consumer aria-labelledby replace the trigger label', async () => {
    render(
      <>
        <span id="heading">Row actions</span>
        <Menu trigger={trigger} aria-labelledby="heading">
          {defaultItems()}
        </Menu>
      </>,
    );
    const menu = await openMenu();
    expect(menu).toHaveAccessibleName('Row actions');
  });

  describe('keyboard', () => {
    it('moves highlight with arrow keys, Home, and End', async () => {
      renderMenu();
      await openMenu();
      const [copy, paste, del] = screen.getAllByRole('menuitem');
      await userEvent.keyboard('{ArrowDown}');
      expect(copy).toHaveAttribute('data-highlighted');
      await userEvent.keyboard('{ArrowDown}');
      expect(paste).toHaveAttribute('data-highlighted');
      await userEvent.keyboard('{End}');
      expect(del).toHaveAttribute('data-highlighted');
      await userEvent.keyboard('{Home}');
      expect(copy).toHaveAttribute('data-highlighted');
    });

    it('activates an item with Enter', async () => {
      const onClick = vi.fn();
      renderMenu({}, [
        <MenuItem key="a" onClick={onClick}>
          Copy
        </MenuItem>,
      ]);
      await openMenu();
      await userEvent.keyboard('{ArrowDown}{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('skips a Divider child during navigation and exposes it as a separator', async () => {
      renderMenu({}, [<MenuItem key="a">Copy</MenuItem>, <Divider key="d" />, <MenuItem key="b">Delete</MenuItem>]);
      const menu = await openMenu();
      expect(menu.querySelector('[role="separator"]')).toHaveClass('ps-Divider');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-highlighted');
    });

    it('uses label for typeahead when children are not plain text', async () => {
      renderMenu({}, [
        <MenuItem key="a" label="Copy">
          <svg aria-hidden="true" />
        </MenuItem>,
        <MenuItem key="b" label="Delete">
          <svg aria-hidden="true" />
        </MenuItem>,
      ]);
      await openMenu();
      await userEvent.keyboard('d');
      expect(screen.getAllByRole('menuitem')[1]).toHaveAttribute('data-highlighted');
    });
  });

  describe('style props', () => {
    it('maps style props onto the popup and keeps caller style and className', async () => {
      renderMenu({
        p: 'md',
        minWidth: 180,
        maxHeight: '50%',
        rounded: 'lg',
        className: 'custom',
        style: { color: 'red' },
      });
      const menu = await openMenu();
      expect(menu).toHaveClass('ps-Menu', 'ps-p', 'ps-min-width', 'ps-max-height', 'ps-rounded', 'custom');
      expect(menu).toHaveStyle({
        '--ps-p': 'var(--perses-spacing-md)',
        '--ps-min-width': '180px',
        '--ps-max-height': '50%',
        '--ps-rounded': 'var(--perses-radius-lg)',
        color: 'rgb(255, 0, 0)',
      });
      expect(menu).not.toHaveAttribute('p');
      expect(menu).not.toHaveAttribute('rounded');
    });

    it('supports responsive values', async () => {
      renderMenu({ p: { default: 'sm', md: 'xl' } });
      const menu = await openMenu();
      expect(menu).toHaveStyle({ '--ps-p': 'var(--perses-spacing-sm)', '--ps-p-md': 'var(--perses-spacing-xl)' });
    });
  });
});

describe('MenuItem', () => {
  it('calls onClick with the event and closes the menu', async () => {
    const onClick = vi.fn();
    renderMenu({}, [
      <MenuItem key="a" onClick={onClick}>
        Copy
      </MenuItem>,
    ]);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('stays open when closeOnClick is false', async () => {
    renderMenu({}, [
      <MenuItem key="a" closeOnClick={false}>
        Copy
      </MenuItem>,
    ]);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('lets an item stop propagation to a clickable ancestor', async () => {
    const rowClick = vi.fn();
    render(
      // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={rowClick}>
        <Menu trigger={trigger}>
          <MenuItem onClick={(event) => event.stopPropagation()}>Copy</MenuItem>
        </Menu>
      </div>,
    );
    await openMenu();
    rowClick.mockClear();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(rowClick).not.toHaveBeenCalled();
  });

  it('does not activate when disabled', async () => {
    const onClick = vi.fn();
    renderMenu({}, [
      <MenuItem key="a" disabled onClick={onClick}>
        Copy
      </MenuItem>,
    ]);
    await openMenu();
    const item = screen.getByRole('menuitem', { name: 'Copy' });
    expect(item).toHaveAttribute('data-disabled');
    expect(item).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(item);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('exposes selected and size as data attributes', async () => {
    renderMenu({}, [
      <MenuItem key="a" selected>
        Copy
      </MenuItem>,
      <MenuItem key="b" size="sm">
        Paste
      </MenuItem>,
    ]);
    await openMenu();
    const [copy, paste] = screen.getAllByRole('menuitem');
    expect(copy).toHaveAttribute('data-selected', '');
    expect(copy).toHaveAttribute('aria-current', 'true');
    expect(copy).toHaveAttribute('data-size', 'md');
    expect(paste).not.toHaveAttribute('data-selected');
    expect(paste).not.toHaveAttribute('aria-current');
    expect(paste).toHaveAttribute('data-size', 'sm');
  });

  it('renders startElement and endElement around the content', async () => {
    renderMenu({}, [
      <MenuItem key="a" startElement={<span data-testid="start" />} endElement={<span data-testid="end" />}>
        Copy
      </MenuItem>,
    ]);
    await openMenu();
    const item = screen.getByRole('menuitem', { name: 'Copy' });
    const [start, content, end] = item.children;
    expect(start).toHaveClass('ps-MenuItemBase__start');
    expect(start).toContainElement(screen.getByTestId('start'));
    expect(content).toHaveClass('ps-MenuItemBase__content');
    expect(content).toHaveTextContent('Copy');
    expect(end).toHaveClass('ps-MenuItemBase__end');
    expect(end).toContainElement(screen.getByTestId('end'));
  });

  it('omits empty start and end wrappers', async () => {
    renderMenu({}, [
      <MenuItem key="a" startElement={false} endElement={null}>
        Copy
      </MenuItem>,
    ]);
    await openMenu();
    const item = screen.getByRole('menuitem', { name: 'Copy' });
    expect(item.querySelector('.ps-MenuItemBase__start')).toBeNull();
    expect(item.querySelector('.ps-MenuItemBase__end')).toBeNull();
  });

  it('renders falsy-but-valid children such as 0', async () => {
    renderMenu({}, [<MenuItem key="a">{0}</MenuItem>]);
    await openMenu();
    expect(screen.getByRole('menuitem', { name: '0' })).toBeInTheDocument();
  });

  it('registers items rendered by a child component', async () => {
    renderMenu({}, [<MenuItem key="a">Copy</MenuItem>, <ThemeSwitchItem key="theme" />]);
    await openMenu();
    const toggle = screen.getByRole('menuitem', { name: 'Dark mode' });
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(toggle).toHaveAttribute('data-highlighted');
  });

  it('forwards ref, className, and style props without leaking them', async () => {
    const ref = createRef<HTMLDivElement>();
    renderMenu({}, [
      <MenuItem key="a" ref={ref} py="sm" px="lg" rounded="sm" className="custom" style={{ color: 'red' }}>
        Copy
      </MenuItem>,
    ]);
    await openMenu();
    const item = screen.getByRole('menuitem', { name: 'Copy' });
    expect(ref.current).toBe(item);
    expect(item).toHaveClass('ps-MenuItemBase', 'ps-MenuItem', 'ps-py', 'ps-px', 'ps-rounded', 'custom');
    expect(item).toHaveStyle({
      '--ps-py': 'var(--perses-spacing-sm)',
      '--ps-px': 'var(--perses-spacing-lg)',
      '--ps-rounded': 'var(--perses-radius-sm)',
      color: 'rgb(255, 0, 0)',
    });
    expect(item).not.toHaveAttribute('py');
    expect(item).not.toHaveAttribute('rounded');
  });
});
