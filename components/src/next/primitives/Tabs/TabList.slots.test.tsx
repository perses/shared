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

import { Tab, TabList, Tabs } from './index';
import type { TabListSlotProps } from './index';

const slots: TabListSlotProps = {
  indicator: { className: 'custom-indicator', style: { height: 4, '--consumer-indicator': 'indicator' } },
};

function getIndicator(): HTMLElement {
  const indicator = screen.getByRole('tablist').querySelector('.ps-TabList__indicator');
  expect(indicator).not.toBeNull();
  return indicator as HTMLElement;
}

describe('TabList slots', () => {
  it('styles the indicator while preserving list root styles, native attributes and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tabs defaultValue="a">
        <TabList
          ref={ref}
          aria-label="Sections"
          data-consumer="list"
          className="consumer-list"
          style={{ '--consumer-list': 'list' }}
          gap="sm"
          slotProps={slots}
        >
          <Tab value="a">A</Tab>
        </TabList>
      </Tabs>,
    );

    const list = screen.getByRole('tablist', { name: 'Sections' });
    expect(ref.current).toBe(list);
    expect(list).toHaveAttribute('data-consumer', 'list');
    expect(list).toHaveClass('ps-TabList', 'ps-gap', 'consumer-list');
    expect(list.style.getPropertyValue('--consumer-list')).toBe('list');

    const indicator = getIndicator();
    expect(indicator).toHaveClass('ps-TabList__indicator', 'custom-indicator');
    expect(indicator.style.getPropertyValue('--consumer-indicator')).toBe('indicator');
    expect(indicator).toHaveStyle({ height: '4px' });
  });

  it('renders the indicator after the tabs so it does not shift tab order', () => {
    render(
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
      </Tabs>,
    );
    const list = screen.getByRole('tablist');
    expect(list.lastElementChild).toBe(getIndicator());
    expect(getIndicator()).toHaveAttribute('role', 'presentation');
  });
});
