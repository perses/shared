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

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Tab, TabList, TabPanel, Tabs } from './index';
import type { TabListProps, TabsProps } from './index';

function Example({
  listProps,
  ...props
}: Partial<TabsProps> & { listProps?: Pick<TabListProps, 'dir' | 'style'> }): React.JSX.Element {
  return (
    <Tabs defaultValue="one" {...props}>
      <TabList aria-label="Direction" {...listProps}>
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
        <Tab value="three">Three</Tab>
      </TabList>
      <TabPanel value="one">Panel one</TabPanel>
      <TabPanel value="two">Panel two</TabPanel>
    </Tabs>
  );
}

async function pressKey(key: string): Promise<void> {
  await act(async () => {
    await userEvent.keyboard(key);
  });
}

const originalDocumentDirection = document.documentElement.getAttribute('dir');

describe('Tabs direction', () => {
  afterEach(() => {
    if (originalDocumentDirection === null) document.documentElement.removeAttribute('dir');
    else document.documentElement.setAttribute('dir', originalDocumentDirection);
  });

  it.each([
    { name: 'dir', props: { dir: 'rtl' } },
    { name: 'CSS direction', props: { style: { direction: 'rtl' as const } } },
  ])('moves visually left with ArrowLeft for root $name', async ({ props }) => {
    render(<Example {...props} />);
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    await pressKey('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    await pressKey(' ');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel two');
    await pressKey('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });

  it('inherits document direction and responds when it changes', async () => {
    document.documentElement.dir = 'rtl';
    render(<Example />);
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    await pressKey('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();

    await act(async () => {
      document.documentElement.dir = 'ltr';
    });
    await pressKey('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus();
  });

  it('inherits the nearest ancestor direction and honors a local override', async () => {
    const { rerender } = render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    await pressKey('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();

    await act(async () => {
      rerender(
        <div dir="rtl">
          <Example dir="ltr" />
        </div>,
      );
    });
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    await pressKey('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
  });

  it.each([
    { name: 'dir', listProps: { dir: 'rtl' } },
    { name: 'CSS direction', listProps: { style: { direction: 'rtl' as const } } },
  ])('honors a list-level $name override', async ({ listProps }) => {
    render(<Example dir="ltr" listProps={listProps} />);
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    await pressKey('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
  });

  it('keeps vertical keyboard navigation independent of RTL', async () => {
    render(<Example dir="rtl" orientation="vertical" />);
    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    await pressKey('{ArrowDown}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    await pressKey('{ArrowUp}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });
});
