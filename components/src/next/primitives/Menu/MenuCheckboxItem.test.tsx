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
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import type { CheckboxProps } from '../Checkbox';
import { defaultComponents, defaultIcons } from '../defaults';
import { TextField } from '../TextField';
import { Menu } from './Menu';
import { MenuCheckboxItem } from './MenuCheckboxItem';
import { MenuItem } from './MenuItem';

const trigger = <button type="button">Open</button>;
const variants: Array<NonNullable<CheckboxProps['variant']>> = ['subtle', 'solid', 'outline'];
const colors: Array<NonNullable<CheckboxProps['color']>> = [
  'default',
  'primary',
  'secondary',
  'error',
  'warning',
  'success',
  'info',
];

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

async function renderOpenMenu(children: ReactElement | ReactElement[]): Promise<RenderResult> {
  const result = render(<Menu trigger={trigger}>{children}</Menu>, { wrapper: Wrapper });
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  await screen.findByRole('menu');
  return result;
}

function getItem(name: string): HTMLElement {
  return screen.getByRole('menuitemcheckbox', { name });
}

function getIndicatorBox(item: HTMLElement): HTMLElement {
  const box = item.querySelector('.ps-MenuCheckboxItem__indicator .ps-Checkbox');
  expect(box).not.toBeNull();
  return box as HTMLElement;
}

function ControlledItem(): ReactElement {
  const [checked, setChecked] = useState(false);
  return (
    <MenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
      Show ID
    </MenuCheckboxItem>
  );
}

describe('MenuCheckboxItem', () => {
  it('renders a menuitemcheckbox row with the shared item classes and a decorative Checkbox indicator', async () => {
    await renderOpenMenu(<MenuCheckboxItem defaultChecked>Show ID</MenuCheckboxItem>);
    const item = getItem('Show ID');
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(item).toHaveClass('ps-MenuItemBase', 'ps-MenuCheckboxItem');
    expect(item).toHaveAttribute('data-size', 'sm');
    expect(item).toHaveAttribute('data-checked');

    const box = getIndicatorBox(item);
    expect(box).toHaveAttribute('aria-hidden', 'true');
    expect(box).not.toHaveAttribute('tabindex');
    expect(box).not.toHaveAttribute('role');
    expect(box).not.toHaveAttribute('aria-checked');
    expect(box).toHaveAttribute('data-checked');
    expect(box).toHaveAttribute('data-size', 'sm');
    expect(box).toHaveAttribute('data-variant', 'subtle');
    expect(box).toHaveAttribute('data-color', 'default');
    expect(box.parentElement).toHaveClass('ps-MenuCheckboxItem__indicator');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('does not render nested controls or tab stops', async () => {
    await renderOpenMenu(<MenuCheckboxItem>Show ID</MenuCheckboxItem>);
    const item = getItem('Show ID');
    expect(item.querySelectorAll('input, button, [role="checkbox"], [tabindex]')).toHaveLength(0);
  });

  it.each([
    ['', false],
    ['', true],
    ['up', false],
    ['up', true],
  ] as const)(
    'does not register its indicator with an enclosing TextField (value=%s, checked=%s)',
    async (value, defaultChecked) => {
      render(
        <TextField
          id="query"
          label="Query"
          defaultValue={value}
          endElement={
            <Menu trigger={trigger}>
              <MenuCheckboxItem defaultChecked={defaultChecked}>Show ID</MenuCheckboxItem>
            </Menu>
          }
        />,
        { wrapper: Wrapper },
      );
      const input = screen.getByRole('textbox', { name: 'Query' });
      const field = input.closest('.ps-TextField');
      expect(document.querySelectorAll('[id="query"]')).toHaveLength(1);
      expect(field).not.toHaveAttribute('data-dirty');
      expect(field?.hasAttribute('data-filled')).toBe(value !== '');

      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const item = await screen.findByRole('menuitemcheckbox', { name: 'Show ID' });
      expect(document.querySelectorAll('[id="query"]')).toHaveLength(1);
      expect(field?.hasAttribute('data-filled')).toBe(value !== '');
      expect(field).not.toHaveAttribute('data-dirty');

      await userEvent.click(item);
      expect(item).toHaveAttribute('aria-checked', String(!defaultChecked));
      expect(input).toHaveValue(value);
      expect(field).not.toHaveAttribute('data-dirty');
      expect(field?.hasAttribute('data-filled')).toBe(value !== '');
      expect(document.querySelectorAll('[id="query"]')).toHaveLength(1);
    },
  );

  it('toggles with a click, reports the change, and keeps the menu open by default', async () => {
    const onCheckedChange = vi.fn();
    await renderOpenMenu(<MenuCheckboxItem onCheckedChange={onCheckedChange}>Show ID</MenuCheckboxItem>);
    const item = getItem('Show ID');
    expect(item).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item);
    expect(onCheckedChange).toHaveBeenCalledWith(true, { event: expect.any(Object) });
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(getIndicatorBox(item)).toHaveAttribute('data-checked');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the menu after toggling when closeOnClick is set', async () => {
    await renderOpenMenu(<MenuCheckboxItem closeOnClick>Show ID</MenuCheckboxItem>);
    await userEvent.click(getItem('Show ID'));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('supports controlled checked state', async () => {
    await renderOpenMenu(<ControlledItem />);
    const item = getItem('Show ID');
    expect(item).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles with Space and Enter from the keyboard', async () => {
    await renderOpenMenu(<MenuCheckboxItem>Show ID</MenuCheckboxItem>);
    const item = getItem('Show ID');
    await userEvent.keyboard('{ArrowDown}');
    expect(item).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(item).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    expect(item).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('clicking the indicator box toggles the row, not a nested control', async () => {
    const onCheckedChange = vi.fn();
    await renderOpenMenu(<MenuCheckboxItem onCheckedChange={onCheckedChange}>Show ID</MenuCheckboxItem>);
    const item = getItem('Show ID');
    await userEvent.click(getIndicatorBox(item));
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(item).toHaveAttribute('aria-checked', 'true');
  });

  it('does not toggle when disabled', async () => {
    const onCheckedChange = vi.fn();
    await renderOpenMenu(
      <MenuCheckboxItem disabled onCheckedChange={onCheckedChange}>
        Show ID
      </MenuCheckboxItem>,
    );
    const item = getItem('Show ID');
    expect(item).toHaveAttribute('data-disabled');
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(getIndicatorBox(item)).toHaveAttribute('data-disabled');
    await userEvent.click(item);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(item).toHaveAttribute('aria-checked', 'false');
  });

  it('passes size to the indicator Checkbox', async () => {
    await renderOpenMenu(
      <MenuCheckboxItem size="sm" defaultChecked>
        Show ID
      </MenuCheckboxItem>,
    );
    const item = getItem('Show ID');
    expect(item).toHaveAttribute('data-size', 'sm');
    expect(getIndicatorBox(item)).toHaveAttribute('data-size', 'sm');
  });

  describe.each(variants)('checkbox variant=%s', (variant) => {
    it.each(colors)('styles the row and indicator with color=%s while preserving toggling', async (color) => {
      await renderOpenMenu(
        <MenuCheckboxItem variant={variant} color={color} defaultChecked>
          Show ID
        </MenuCheckboxItem>,
      );
      const item = getItem('Show ID');
      const box = getIndicatorBox(item);
      expect(box).toHaveAttribute('data-variant', variant);
      expect(box).toHaveAttribute('data-color', color);
      expect(item).not.toHaveAttribute('variant');
      expect(item).not.toHaveAttribute('color');
      expect(item).not.toHaveAttribute('data-variant');
      expect(item).toHaveAttribute('data-color', color);
      expect(item.querySelector('input')).toBeNull();

      await userEvent.click(item);
      expect(item).toHaveAttribute('aria-checked', 'false');
      expect(box).not.toHaveAttribute('data-checked');
      expect(box).toHaveAttribute('data-variant', variant);
      expect(box).toHaveAttribute('data-color', color);
    });
  });

  it('updates indicator appearance and restores neutral defaults when colors are removed', async () => {
    const { rerender } = await renderOpenMenu(
      <MenuCheckboxItem variant="solid" color="primary" checked>
        Show ID
      </MenuCheckboxItem>,
    );
    const item = getItem('Show ID');
    const box = getIndicatorBox(item);
    expect(box).toHaveAttribute('data-variant', 'solid');
    expect(box).toHaveAttribute('data-color', 'primary');

    rerender(
      <Menu trigger={trigger}>
        <MenuCheckboxItem variant="outline" color="success" checked>
          Show ID
        </MenuCheckboxItem>
      </Menu>,
    );
    expect(getItem('Show ID')).toBe(item);
    expect(getIndicatorBox(item)).toBe(box);
    expect(box).toHaveAttribute('data-variant', 'outline');
    expect(box).toHaveAttribute('data-color', 'success');

    rerender(
      <Menu trigger={trigger}>
        <MenuCheckboxItem checked>Show ID</MenuCheckboxItem>
      </Menu>,
    );
    expect(box).toHaveAttribute('data-variant', 'subtle');
    expect(box).toHaveAttribute('data-color', 'default');
    expect(item).toHaveAttribute('data-color', 'default');
    expect(item).toHaveAttribute('aria-checked', 'true');
  });

  it('renders and toggles without requiring ComponentsProvider', async () => {
    render(
      <Menu trigger={trigger}>
        <MenuCheckboxItem defaultChecked>Show ID</MenuCheckboxItem>
      </Menu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const item = await screen.findByRole('menuitemcheckbox', { name: 'Show ID' });
    expect(getIndicatorBox(item)).toHaveAttribute('data-checked');
    await userEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'false');
    expect(getIndicatorBox(item)).not.toHaveAttribute('data-checked');
  });

  it('renders start and end elements after the indicator', async () => {
    await renderOpenMenu(
      <MenuCheckboxItem startElement={<span data-testid="start" />} endElement={<span data-testid="end" />}>
        Show ID
      </MenuCheckboxItem>,
    );
    const item = getItem('Show ID');
    const [indicator, start, content, end] = item.children;
    expect(indicator).toHaveClass('ps-MenuCheckboxItem__indicator');
    expect(start).toHaveClass('ps-MenuItemBase__start');
    expect(content).toHaveClass('ps-MenuItemBase__content');
    expect(end).toHaveClass('ps-MenuItemBase__end');
  });

  it('participates in arrow-key navigation alongside other items', async () => {
    await renderOpenMenu([<MenuItem key="a">Copy</MenuItem>, <MenuCheckboxItem key="b">Show ID</MenuCheckboxItem>]);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(getItem('Show ID')).toHaveFocus();
  });

  it('forwards ref, id, className, and style props without leaking them', async () => {
    const ref = createRef<HTMLDivElement>();
    await renderOpenMenu(
      <MenuCheckboxItem ref={ref} id="show-id" py="sm" rounded="sm" className="custom" style={{ color: 'red' }}>
        Show ID
      </MenuCheckboxItem>,
    );
    const item = getItem('Show ID');
    expect(ref.current).toBe(item);
    expect(item).toHaveAttribute('id', 'show-id');
    expect(getIndicatorBox(item)).not.toHaveAttribute('aria-labelledby');
    expect(item).toHaveClass('ps-py', 'ps-rounded', 'custom');
    expect(item).toHaveStyle({
      '--ps-py': 'var(--perses-spacing-sm)',
      '--ps-rounded': 'var(--perses-radius-sm)',
      color: 'rgb(255, 0, 0)',
    });
    expect(item).not.toHaveAttribute('py');
    expect(item).not.toHaveAttribute('checked');
  });
});
