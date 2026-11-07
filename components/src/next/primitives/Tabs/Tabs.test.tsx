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

import { act, render, screen, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef, useState } from 'react';
import type { AnchorHTMLAttributes, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Tab, TabList, TabPanel, Tabs } from './index';
import type { TabsProps, TabsValue } from './index';

function renderTabs(props: Partial<TabsProps> = {}, listProps: Record<string, unknown> = {}): RenderResult {
  return render(
    <Tabs defaultValue="one" {...props}>
      <TabList aria-label="Example" {...listProps}>
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
        <Tab value="three" disabled>
          Three
        </Tab>
      </TabList>
      <TabPanel value="one">Panel one</TabPanel>
      <TabPanel value="two">Panel two</TabPanel>
      <TabPanel value="three">Panel three</TabPanel>
    </Tabs>,
  );
}

function tab(name: string): HTMLElement {
  return screen.getByRole('tab', { name });
}

async function pressKey(key: string): Promise<void> {
  await act(async () => {
    await userEvent.keyboard(key);
  });
}

const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(
  function RouterLink({ to, children, ...props }, ref) {
    return (
      <a ref={ref} href={to} data-router-link="" {...props}>
        {children}
      </a>
    );
  },
);

function ControlledTabs(): ReactElement {
  const [value, setValue] = useState<TabsValue | null>(0);
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabList aria-label="Numeric">
        <Tab value={0}>Zero</Tab>
        <Tab value={1}>One</Tab>
      </TabList>
      <TabPanel value={0}>Panel zero</TabPanel>
      <TabPanel value={1}>Panel one</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  describe('structure and selection', () => {
    it('renders the parts with their classes and roles', () => {
      renderTabs({ className: 'root' }, { className: 'list' });
      const list = screen.getByRole('tablist', { name: 'Example' });
      expect(list).toHaveClass('ps-TabList', 'list');
      expect(list).toHaveAttribute('data-variant', 'standard');
      expect(list.parentElement).toHaveClass('ps-Tabs', 'root');
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(tab('One')).toHaveClass('ps-Tab');
      expect(screen.getByRole('tabpanel')).toHaveClass('ps-TabPanel');
      expect(list.querySelector('.ps-TabList__indicator')).not.toBeNull();
    });

    it('shows only the active panel and unmounts the others', () => {
      renderTabs();
      expect(screen.getByText('Panel one')).toBeInTheDocument();
      expect(screen.queryByText('Panel two')).not.toBeInTheDocument();
    });

    it('keeps inactive panels mounted but hidden with keepMounted', () => {
      render(
        <Tabs defaultValue="a">
          <TabList aria-label="Example">
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
          <TabPanel value="a">Panel a</TabPanel>
          <TabPanel value="b" keepMounted>
            Panel b
          </TabPanel>
        </Tabs>,
      );
      expect(screen.getByText('Panel b')).not.toBeVisible();
    });

    it('keeps a keepMounted panel hidden when it has display styles, and restores them when active', async () => {
      render(
        <Tabs defaultValue="a">
          <TabList aria-label="Example">
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
          <TabPanel value="a">Panel a</TabPanel>
          <TabPanel value="b" keepMounted display="flex" style={{ display: 'grid' }}>
            Panel b
          </TabPanel>
        </Tabs>,
      );
      const panel = screen.getByText('Panel b');
      expect(panel).toHaveAttribute('hidden');
      expect(panel).toHaveStyle({ display: 'none' });

      await userEvent.click(screen.getByRole('tab', { name: 'B' }));
      expect(panel).not.toHaveAttribute('hidden');
      expect(panel).toHaveStyle({ display: 'grid' });
    });

    it('supports no active tab with value={null}', () => {
      render(
        <Tabs value={null} onValueChange={vi.fn()}>
          <TabList aria-label="Example">
            <Tab value="a">A</Tab>
          </TabList>
          <TabPanel value="a">Panel a</TabPanel>
        </Tabs>,
      );
      expect(tab('A')).not.toHaveAttribute('data-active');
      expect(screen.queryByText('Panel a')).not.toBeInTheDocument();
    });

    it('reports null when the active tab is removed and no enabled tabs remain', async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Tabs defaultValue="b" onValueChange={onValueChange}>
          <TabList aria-label="Example">
            <Tab value="a" disabled>
              A
            </Tab>
            <Tab value="b">B</Tab>
          </TabList>
          <TabPanel value="b">Panel b</TabPanel>
        </Tabs>,
      );
      expect(tab('B')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel b');
      expect(onValueChange).not.toHaveBeenCalled();

      rerender(
        <Tabs defaultValue="b" onValueChange={onValueChange}>
          <TabList aria-label="Example">
            <Tab value="a" disabled>
              A
            </Tab>
          </TabList>
        </Tabs>,
      );
      await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(null, expect.anything()));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(tab('A')).toHaveAttribute('aria-selected', 'false');
      expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    });

    it('switches panels on click and reports the value', async () => {
      const onValueChange = vi.fn();
      renderTabs({ onValueChange });
      await userEvent.click(tab('Two'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0]?.[0]).toBe('two');
      expect(screen.getByText('Panel two')).toBeInTheDocument();
      expect(tab('Two')).toHaveAttribute('aria-selected', 'true');
      expect(tab('Two')).toHaveAttribute('data-active');
      expect(tab('One')).toHaveAttribute('aria-selected', 'false');
    });

    it('supports numeric values and controlled updates', async () => {
      render(<ControlledTabs />);
      expect(screen.getByText('Panel zero')).toBeInTheDocument();
      await userEvent.click(tab('One'));
      expect(screen.getByText('Panel one')).toBeInTheDocument();
      expect(screen.queryByText('Panel zero')).not.toBeInTheDocument();
    });

    it('does not change on its own when controlled without a handler', async () => {
      renderTabs({ value: 'one', defaultValue: undefined });
      await userEvent.click(tab('Two'));
      expect(screen.getByText('Panel one')).toBeInTheDocument();
      expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    });

    it('exposes the variant as a data attribute', () => {
      renderTabs({}, { variant: 'fullWidth' });
      expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'fullWidth');
    });

    it('defaults to the first tab without defaultValue', () => {
      renderTabs({ defaultValue: undefined });
      expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    });

    it('selects the first enabled tab even when a later tab has value zero', () => {
      const onValueChange = vi.fn();
      render(
        <Tabs onValueChange={onValueChange}>
          <TabList aria-label="Numeric">
            <Tab value={3} disabled>
              Disabled
            </Tab>
            <Tab value={1}>First</Tab>
            <Tab value={0}>Second</Tab>
          </TabList>
          <TabPanel value={1}>Panel first</TabPanel>
          <TabPanel value={0}>Panel second</TabPanel>
        </Tabs>,
      );
      expect(tab('First')).toHaveAttribute('aria-selected', 'true');
      expect(tab('Second')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel first');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(1, expect.objectContaining({ reason: 'initial' }));
    });

    it.each([
      { name: 'zero', defaultValue: 0, firstDisabled: false, selected: 'Zero', panel: 'Panel zero' },
      { name: 'disabled', defaultValue: 1, firstDisabled: true, selected: 'First', panel: 'Panel first' },
      { name: 'null', defaultValue: null, firstDisabled: false, selected: undefined, panel: undefined },
    ])('honors an explicit $name default value', ({ defaultValue, firstDisabled, selected, panel }) => {
      const onValueChange = vi.fn();
      render(
        <Tabs defaultValue={defaultValue} onValueChange={onValueChange}>
          <TabList aria-label="Numeric">
            <Tab value={1} disabled={firstDisabled}>
              First
            </Tab>
            <Tab value={0}>Zero</Tab>
          </TabList>
          <TabPanel value={1}>Panel first</TabPanel>
          <TabPanel value={0}>Panel zero</TabPanel>
        </Tabs>,
      );
      expect(tab('First')).toHaveAttribute('aria-selected', String(selected === 'First'));
      expect(tab('Zero')).toHaveAttribute('aria-selected', String(selected === 'Zero'));
      if (panel === undefined) expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
      else expect(screen.getByRole('tabpanel')).toHaveTextContent(panel);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('starts with no selection when all tabs are disabled', () => {
      const onValueChange = vi.fn();
      render(
        <Tabs onValueChange={onValueChange}>
          <TabList aria-label="Disabled">
            <Tab value={1} disabled>
              First
            </Tab>
            <Tab value={0} disabled>
              Zero
            </Tab>
          </TabList>
          <TabPanel value={1}>Panel first</TabPanel>
          <TabPanel value={0}>Panel zero</TabPanel>
        </Tabs>,
      );
      expect(tab('First')).toHaveAttribute('aria-selected', 'false');
      expect(tab('Zero')).toHaveAttribute('aria-selected', 'false');
      expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null, expect.objectContaining({ reason: 'initial' }));
    });
  });

  describe('accessibility', () => {
    it('wires id, aria-controls and aria-labelledby between tabs and panels', () => {
      renderTabs();
      const panel = screen.getByRole('tabpanel');
      expect(tab('One')).toHaveAttribute('aria-controls', panel.id);
      expect(panel).toHaveAttribute('aria-labelledby', tab('One').id);
    });

    it('respects a consumer id on the tab', () => {
      render(
        <Tabs defaultValue="a">
          <TabList aria-label="Example">
            <Tab value="a" id="custom-tab">
              A
            </Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>,
      );
      expect(tab('A')).toHaveAttribute('id', 'custom-tab');
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'custom-tab');
    });

    it('marks disabled tabs and ignores their clicks', async () => {
      const onValueChange = vi.fn();
      renderTabs({ onValueChange });
      const disabled = tab('Three');
      expect(disabled).toHaveAttribute('data-disabled');
      expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(disabled);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByText('Panel one')).toBeInTheDocument();
    });

    it('still fires a consumer onClick on an enabled tab', async () => {
      const onClick = vi.fn();
      render(
        <Tabs defaultValue="a">
          <TabList aria-label="Example">
            <Tab value="a" onClick={onClick}>
              A
            </Tab>
          </TabList>
        </Tabs>,
      );
      await userEvent.click(tab('A'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard', () => {
    it('moves focus with ArrowRight/ArrowLeft and activates on Space (manual activation)', async () => {
      const onValueChange = vi.fn();
      renderTabs({ onValueChange });
      await userEvent.click(tab('One'));
      onValueChange.mockClear();
      await pressKey('{ArrowRight}');
      expect(tab('Two')).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
      await pressKey(' ');
      expect(onValueChange.mock.calls[0]?.[0]).toBe('two');
      await pressKey('{ArrowLeft}');
      expect(tab('One')).toHaveFocus();
    });

    it('activates on focus when activateOnFocus is set', async () => {
      const onValueChange = vi.fn();
      renderTabs({ onValueChange }, { activateOnFocus: true });
      await userEvent.click(tab('One'));
      await pressKey('{ArrowRight}');
      expect(onValueChange.mock.calls[0]?.[0]).toBe('two');
    });

    it('keeps disabled tabs focusable but not activatable, and jumps with Home/End', async () => {
      const onValueChange = vi.fn();
      renderTabs({ onValueChange });
      await userEvent.click(tab('One'));
      await pressKey('{End}');
      expect(tab('Three')).toHaveFocus();
      await pressKey(' ');
      expect(onValueChange).not.toHaveBeenCalled();
      await pressKey('{Home}');
      expect(tab('One')).toHaveFocus();
    });

    it('uses ArrowDown/ArrowUp when vertical and ignores ArrowRight', async () => {
      renderTabs({ orientation: 'vertical' });
      expect(screen.getByRole('tablist').parentElement).toHaveAttribute('data-orientation', 'vertical');
      await userEvent.click(tab('One'));
      await pressKey('{ArrowRight}');
      expect(tab('One')).toHaveFocus();
      await pressKey('{ArrowDown}');
      expect(tab('Two')).toHaveFocus();
      await pressKey('{ArrowUp}');
      expect(tab('One')).toHaveFocus();
    });

    it('resolves a responsive orientation to its default without matchMedia', () => {
      renderTabs({ orientation: { default: 'horizontal', md: 'vertical' } });
      expect(screen.getByRole('tablist').parentElement).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  describe('content', () => {
    it('renders startElement before and endElement after the label', () => {
      render(
        <Tabs defaultValue="a">
          <TabList aria-label="Example">
            <Tab value="a" startElement={<span data-testid="start" />} endElement={<span data-testid="end" />}>
              Label
            </Tab>
          </TabList>
        </Tabs>,
      );
      const element = tab('Label');
      const children = [...element.children];
      expect(children.map((child) => child.className)).toEqual(['ps-Tab__start', 'ps-Tab__content', 'ps-Tab__end']);
      expect(screen.getByTestId('start').parentElement).toHaveClass('ps-Tab__start');
    });

    it('omits empty start and end wrappers for falsy content', () => {
      render(
        <Tabs defaultValue="a">
          <TabList aria-label="Example">
            <Tab value="a" startElement={false} endElement={null}>
              Label
            </Tab>
            <Tab value="b" startElement="" endElement="">
              Other
            </Tab>
          </TabList>
        </Tabs>,
      );
      for (const name of ['Label', 'Other']) {
        expect(tab(name).querySelector('.ps-Tab__start')).toBeNull();
        expect(tab(name).querySelector('.ps-Tab__end')).toBeNull();
      }
    });

    it('omits the content wrapper for an icon-only tab so the flex gap does not add space', () => {
      render(
        <Tabs defaultValue="a">
          <TabList aria-label="Example">
            <Tab value="a" aria-label="Settings" startElement={<span data-testid="icon" />} />
          </TabList>
        </Tabs>,
      );
      const element = tab('Settings');
      expect(element.querySelector('.ps-Tab__content')).toBeNull();
      expect([...element.children].map((child) => child.className)).toEqual(['ps-Tab__start']);
    });

    it('renders a link tab through render while keeping the tab role and activation', async () => {
      const onValueChange = vi.fn();
      render(
        <Tabs defaultValue="a" onValueChange={onValueChange}>
          <TabList aria-label="Example">
            <Tab value="a" render={<RouterLink to="#a" />}>
              A
            </Tab>
            <Tab value="b" render={<RouterLink to="#b" />}>
              B
            </Tab>
          </TabList>
        </Tabs>,
      );
      const link = tab('B');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '#b');
      expect(link).toHaveAttribute('data-router-link');
      expect(link).not.toHaveAttribute('type');
      await userEvent.click(link);
      expect(onValueChange.mock.calls[0]?.[0]).toBe('b');
      await pressKey('{ArrowLeft}');
      expect(tab('A')).toHaveFocus();
    });
  });

  describe('style props and refs', () => {
    it('applies style props, className, style and ref on every part', () => {
      const rootRef = createRef<HTMLDivElement>();
      const listRef = createRef<HTMLDivElement>();
      const tabRef = createRef<HTMLElement>();
      const panelRef = createRef<HTMLDivElement>();
      render(
        <Tabs ref={rootRef} defaultValue="a" p="md" rounded="sm" className="root" style={{ color: 'red' }}>
          <TabList ref={listRef} aria-label="Example" gap="sm" className="list" style={{ '--consumer': 'list' }}>
            <Tab
              ref={tabRef}
              value="a"
              px="lg"
              className="tab"
              style={{ '--perses-tab-min-height': '54px', color: 'blue' }}
            >
              A
            </Tab>
          </TabList>
          <TabPanel ref={panelRef} value="a" mt="md" display="grid" className="panel">
            Panel
          </TabPanel>
        </Tabs>,
      );
      expect(rootRef.current).toHaveClass('ps-Tabs', 'ps-p', 'ps-rounded', 'root');
      expect(rootRef.current?.style.getPropertyValue('--ps-p')).toBe('var(--perses-spacing-md)');
      expect(rootRef.current).toHaveStyle({ color: 'rgb(255, 0, 0)' });
      expect(listRef.current).toHaveClass('ps-TabList', 'ps-gap', 'list');
      expect(listRef.current?.style.getPropertyValue('--consumer')).toBe('list');
      expect(tabRef.current).toHaveClass('ps-Tab', 'ps-px', 'tab');
      expect(tabRef.current?.style.getPropertyValue('--perses-tab-min-height')).toBe('54px');
      expect(tabRef.current).toHaveStyle({ color: 'rgb(0, 0, 255)' });
      expect(panelRef.current).toHaveClass('ps-TabPanel', 'ps-mt', 'ps-display', 'panel');
      expect(panelRef.current?.style.getPropertyValue('--ps-display')).toBe('grid');
    });

    it('does not leak style props to the DOM', () => {
      renderTabs({ p: 'md', minWidth: 200 });
      const root = screen.getByRole('tablist').parentElement;
      expect(root).not.toHaveAttribute('p');
      expect(root).not.toHaveAttribute('minwidth');
    });
  });
});
