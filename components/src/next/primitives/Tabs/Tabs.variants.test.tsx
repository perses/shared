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

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Tab, TabList, TabPanel, Tabs } from './index';
import type { TabListSlotProps, TabListVariant, TabProps, TabsProps, TabsVariant } from './index';

const variants = ['line', 'subtle', 'enclosed', 'outline', 'plain'] as const satisfies readonly TabsVariant[];
const customIndicator: TabListSlotProps = {
  indicator: {
    className: 'consumer-indicator',
    style: { display: 'block', borderRadius: 'var(--perses-radius-full)' },
  },
};

interface ExampleTabsProps {
  color?: TabsProps['color'];
  secondTabColor?: TabProps['color'];
  variant?: TabsVariant;
  listVariant?: TabListVariant;
  onValueChange?: TabsProps['onValueChange'];
  slotProps?: TabListSlotProps;
}

function ExampleTabs({
  color,
  secondTabColor,
  variant,
  listVariant,
  onValueChange,
  slotProps,
}: ExampleTabsProps): ReactElement {
  return (
    <Tabs color={color} variant={variant} defaultValue="one" onValueChange={onValueChange}>
      <TabList aria-label="Example" variant={listVariant} slotProps={slotProps}>
        <Tab value="one">One</Tab>
        <Tab value="two" color={secondTabColor}>
          Two
        </Tab>
        <Tab value="three" disabled>
          Three
        </Tab>
      </TabList>
      <TabPanel value="one">Panel one</TabPanel>
      <TabPanel value="two">
        <label>
          Panel note
          <input />
        </label>
      </TabPanel>
    </Tabs>
  );
}

describe('Tabs colors', () => {
  it('defaults the group to primary and leaves tabs without overrides inheriting', () => {
    render(<ExampleTabs />);

    const root = screen.getByRole('tablist', { name: 'Example' }).closest('.ps-Tabs');
    expect(root).toHaveAttribute('data-color', 'primary');
    expect(root).not.toHaveAttribute('color');
    expect(screen.getByRole('tab', { name: 'One' })).not.toHaveAttribute('data-color');
  });

  it.each(['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'] as const)(
    'supports %s as a group palette and explicit tab override',
    (color) => {
      render(<ExampleTabs color={color} secondTabColor={color} />);

      const root = screen.getByRole('tablist', { name: 'Example' }).closest('.ps-Tabs');
      const tab = screen.getByRole('tab', { name: 'Two' });
      expect(root).toHaveAttribute('data-color', color);
      expect(root).not.toHaveAttribute('color');
      expect(tab).toHaveAttribute('data-color', color);
      expect(tab).not.toHaveAttribute('color');
      expect(screen.getByRole('tab', { name: 'One' })).not.toHaveAttribute('data-color');
    },
  );

  it('gives nested roots their own palette and resolves subtle appearance at each tab', () => {
    render(
      <Tabs color="error" variant="subtle" defaultValue="outer">
        <TabList aria-label="Outer">
          <Tab value="outer" color="success">
            Outer tab
          </Tab>
        </TabList>
        <TabPanel value="outer">
          <Tabs defaultValue="inner">
            <TabList aria-label="Inner">
              <Tab value="inner">Inner tab</Tab>
            </TabList>
            <TabPanel value="inner">Inner panel</TabPanel>
          </Tabs>
        </TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole('tablist', { name: 'Outer' }).closest('.ps-Tabs')).toHaveAttribute('data-color', 'error');
    expect(screen.getByRole('tab', { name: 'Outer tab' })).toHaveAttribute('data-variant', 'subtle');
    expect(screen.getByRole('tablist', { name: 'Inner' }).closest('.ps-Tabs')).toHaveAttribute('data-color', 'primary');
    expect(screen.getByRole('tab', { name: 'Inner tab' })).toHaveAttribute('data-variant', 'line');
  });

  it('preserves selection, panel state and focus when palettes change or an override is removed', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <ExampleTabs variant="subtle" color="secondary" secondTabColor="error" onValueChange={onValueChange} />,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    const selected = screen.getByRole('tab', { name: 'Two' });
    const panel = screen.getByRole('tabpanel', { name: 'Two' });
    const input = screen.getByRole('textbox', { name: 'Panel note' });
    await userEvent.type(input, 'Keep this note');

    rerender(<ExampleTabs variant="subtle" color="success" onValueChange={onValueChange} />);

    expect(screen.getByRole('tab', { name: 'Two' })).toBe(selected);
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).not.toHaveAttribute('data-color');
    expect(screen.getByRole('tablist', { name: 'Example' }).closest('.ps-Tabs')).toHaveAttribute(
      'data-color',
      'success',
    );
    expect(screen.getByRole('tabpanel', { name: 'Two' })).toBe(panel);
    expect(input).toHaveValue('Keep this note');
    expect(input).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});

describe('Tabs visual variants', () => {
  it('defaults the root to line without changing the list layout default', () => {
    render(<ExampleTabs />);

    const list = screen.getByRole('tablist', { name: 'Example' });
    expect(list.closest('.ps-Tabs')).toHaveAttribute('data-variant', 'line');
    expect(list.closest('.ps-Tabs')).not.toHaveAttribute('variant');
    expect(list).toHaveAttribute('data-variant', 'standard');
  });

  it.each(variants)('exposes %s on the root without leaking a native variant attribute', (variant) => {
    render(<ExampleTabs variant={variant} />);

    const root = screen.getByRole('tablist', { name: 'Example' }).closest('.ps-Tabs');
    expect(root).toHaveAttribute('data-variant', variant);
    expect(root).not.toHaveAttribute('variant');
  });

  describe.each(variants)('%s appearance', (variant) => {
    it.each(['standard', 'fullWidth'] as const)('keeps %s list sizing independent', (listVariant) => {
      render(<ExampleTabs variant={variant} listVariant={listVariant} />);

      const list = screen.getByRole('tablist', { name: 'Example' });
      expect(list.closest('.ps-Tabs')).toHaveAttribute('data-variant', variant);
      expect(list).toHaveAttribute('data-variant', listVariant);
      expect(list).not.toHaveAttribute('variant');
    });

    it('gives a nested root its own line default', () => {
      render(
        <Tabs variant={variant} defaultValue="outer">
          <TabList aria-label="Outer">
            <Tab value="outer">Outer tab</Tab>
          </TabList>
          <TabPanel value="outer">
            <Tabs>
              <TabList aria-label="Inner">
                <Tab value="inner">Inner tab</Tab>
              </TabList>
              <TabPanel value="inner">Inner panel</TabPanel>
            </Tabs>
          </TabPanel>
        </Tabs>,
      );

      const outerRoot = screen.getByRole('tablist', { name: 'Outer' }).closest('.ps-Tabs');
      const innerList = screen.getByRole('tablist', { name: 'Inner' });
      const innerRoot = innerList.closest('.ps-Tabs');
      expect(outerRoot).toHaveAttribute('data-variant', variant);
      expect(innerRoot).not.toBe(outerRoot);
      expect(innerRoot).toHaveAttribute('data-variant', 'line');
      expect(innerList).toHaveAttribute('data-variant', 'standard');
      expect(within(innerList).getByRole('tab', { name: 'Inner tab' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('preserves selection, panel state and focus when only the appearance changes', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<ExampleTabs variant="line" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    const selectedTab = screen.getByRole('tab', { name: 'Two' });
    const panel = screen.getByRole('tabpanel', { name: 'Two' });
    const input = screen.getByRole('textbox', { name: 'Panel note' });
    await userEvent.type(input, 'Keep this note');
    expect(onValueChange).toHaveBeenCalledTimes(1);

    for (const variant of ['subtle', 'enclosed', 'outline', 'plain', 'line'] as const) {
      rerender(<ExampleTabs variant={variant} onValueChange={onValueChange} />);

      expect(screen.getByRole('tablist', { name: 'Example' }).closest('.ps-Tabs')).toHaveAttribute(
        'data-variant',
        variant,
      );
      expect(screen.getByRole('tab', { name: 'Two' })).toBe(selectedTab);
      expect(selectedTab).toHaveAttribute('aria-selected', 'true');
      expect(selectedTab).toHaveAttribute('data-active');
      expect(screen.getByRole('tabpanel', { name: 'Two' })).toBe(panel);
      expect(input).toHaveValue('Keep this note');
      expect(input).toHaveFocus();
      expect(screen.queryByText('Panel one')).not.toBeInTheDocument();
      expect(onValueChange).toHaveBeenCalledTimes(1);
    }
  });

  it('keeps plain selected-state hooks and the indicator available for consumer styling', async () => {
    render(<ExampleTabs variant="plain" slotProps={customIndicator} />);
    const list = screen.getByRole('tablist', { name: 'Example' });
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });
    const indicator = within(list).getByRole('presentation', { hidden: true });

    expect(one).toHaveAttribute('data-active');
    expect(one).toHaveAttribute('aria-selected', 'true');
    expect(two).not.toHaveAttribute('data-active');
    expect(indicator).toHaveClass('ps-TabList__indicator', 'consumer-indicator');
    expect(indicator).toHaveStyle({ display: 'block', borderRadius: 'var(--perses-radius-full)' });

    await userEvent.click(two);
    expect(one).not.toHaveAttribute('data-active');
    expect(one).toHaveAttribute('aria-selected', 'false');
    expect(two).toHaveAttribute('data-active');
    expect(two).toHaveAttribute('aria-selected', 'true');
    expect(two).toHaveAttribute('aria-controls', screen.getByRole('tabpanel', { name: 'Two' }).id);
    expect(within(list).getByRole('presentation', { hidden: true })).toBe(indicator);
    expect(list.closest('.ps-Tabs')).toHaveAttribute('data-variant', 'plain');
  });

  it('preserves manual keyboard activation and disabled semantics in plain', async () => {
    render(<ExampleTabs variant="plain" />);
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });
    const disabled = screen.getByRole('tab', { name: 'Three' });
    await userEvent.click(one);
    await act(async () => userEvent.keyboard('{ArrowRight}'));
    expect(two).toHaveFocus();
    expect(one).toHaveAttribute('aria-selected', 'true');

    await act(async () => userEvent.keyboard('{Enter}'));
    expect(two).toHaveAttribute('aria-selected', 'true');
    await act(async () => userEvent.keyboard('{ArrowRight}{Enter}'));
    expect(disabled).toHaveFocus();
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).toHaveAttribute('data-disabled');
    expect(disabled).toHaveAttribute('aria-selected', 'false');
    expect(two).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Two' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Example' }).closest('.ps-Tabs')).toHaveAttribute(
      'data-variant',
      'plain',
    );
  });
});
