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
import { createRef, forwardRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import type { CheckboxProps } from '../Checkbox';
import { defaultComponents, defaultIcons } from '../defaults';
import { Menu } from './Menu';
import { MenuCheckboxItem } from './MenuCheckboxItem';
import { MenuItem } from './MenuItem';

const trigger = <button type="button">Open</button>;

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
    expect(item).toHaveAttribute('data-size', 'md');
    expect(item).toHaveAttribute('data-checked');

    const box = getIndicatorBox(item);
    expect(box).toHaveAttribute('aria-hidden', 'true');
    expect(box).toHaveAttribute('tabindex', '-1');
    expect(box).toHaveAttribute('aria-checked', 'true');
    expect(box).toHaveAttribute('data-size', 'md');
    expect(box.parentElement).toHaveClass('ps-MenuCheckboxItem__indicator');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('is the only tab stop in the row', async () => {
    await renderOpenMenu(<MenuCheckboxItem>Show ID</MenuCheckboxItem>);
    const item = getItem('Show ID');
    const focusable = item.querySelectorAll('[tabindex]:not([tabindex="-1"]), button:not([tabindex="-1"]), input');
    for (const element of focusable) expect(element).toHaveAttribute('tabindex', '-1');
  });

  it('toggles with a click, reports the change, and keeps the menu open by default', async () => {
    const onCheckedChange = vi.fn();
    await renderOpenMenu(<MenuCheckboxItem onCheckedChange={onCheckedChange}>Show ID</MenuCheckboxItem>);
    const item = getItem('Show ID');
    expect(item).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item);
    expect(onCheckedChange).toHaveBeenCalledWith(true, { event: expect.any(Object) });
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(getIndicatorBox(item)).toHaveAttribute('aria-checked', 'true');
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
    expect(item).toHaveAttribute('data-highlighted');
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

  it('renders the Checkbox registered in ComponentsProvider', async () => {
    const CustomCheckbox = forwardRef<HTMLElement, CheckboxProps>(function CustomCheckbox({ checked }, ref) {
      return <span ref={ref} data-testid="custom-checkbox" data-on={checked ? '' : undefined} />;
    });
    render(
      <ComponentsProvider components={{ ...defaultComponents, Checkbox: CustomCheckbox }} icons={defaultIcons}>
        <Menu trigger={trigger}>
          <MenuCheckboxItem defaultChecked>Show ID</MenuCheckboxItem>
        </Menu>
      </ComponentsProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const item = await screen.findByRole('menuitemcheckbox', { name: 'Show ID' });
    const custom = screen.getByTestId('custom-checkbox');
    expect(item).toContainElement(custom);
    expect(custom).toHaveAttribute('data-on');
    await userEvent.click(item);
    expect(custom).not.toHaveAttribute('data-on');
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
    expect(getItem('Show ID')).toHaveAttribute('data-highlighted');
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
    expect(getIndicatorBox(item)).toHaveAttribute('aria-labelledby', 'show-id');
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
