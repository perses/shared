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

import type { Story } from '@ladle/react';
import { forwardRef, useState } from 'react';
import type { AnchorHTMLAttributes, CSSProperties, ReactElement } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { Chip } from '../Chip';
import { BookOpenIcon, CogIcon, EarthIcon, ViewColumnIcon } from '../Icon';
import { TextField } from '../TextField';
import { Tab } from './Tab';
import { TabList } from './TabList';
import type { TabListProps, TabListSlotProps } from './TabList';
import { TabPanel } from './TabPanel';
import { Tabs } from './Tabs';
import type { TabsProps, TabStyle, TabsValue } from './Tabs';

const narrow: CSSProperties = { width: '20rem' };
const indicatorSlots: TabListSlotProps = {
  indicator: { style: { height: 'var(--perses-spacing-xs)', borderRadius: 'var(--perses-radius-full)' } },
  scrollButton: { style: { color: 'var(--perses-status-text-primary)' } },
};

const compactTab: TabStyle = { '--perses-tab-min-height': '2.25rem' };

const sections = ['Overview', 'Dashboards', 'Datasources', 'Variables', 'Secrets', 'Roles', 'Role bindings'];

function Section({ name }: { name: string }): ReactElement {
  return (
    <TabPanel value={name} p="md">
      {name} content
    </TabPanel>
  );
}

const basicCode = `<Tabs defaultValue="overview">
  <TabList aria-label="Project">
    <Tab value="overview">Overview</Tab>
    <Tab value="dashboards">Dashboards</Tab>
    <Tab value="settings">Settings</Tab>
  </TabList>
  <TabPanel value="overview" p="md">…</TabPanel>
  <TabPanel value="dashboards" p="md">…</TabPanel>
  <TabPanel value="settings" p="md">…</TabPanel>
</Tabs>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Tabs</code> switches between panels of content. Put <code>Tab</code>s inside a <code>TabList</code> and one{' '}
      <code>TabPanel</code> per value; the active tab, keyboard navigation and ARIA wiring are handled for you. Inactive
      panels are unmounted unless you set <code>keepMounted</code>. Style props on every part behave exactly as
      documented on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Tabs defaultValue="Overview">
        <TabList aria-label="Project">
          <Tab value="Overview">Overview</Tab>
          <Tab value="Dashboards">Dashboards</Tab>
          <Tab value="Settings">Settings</Tab>
        </TabList>
        <Section name="Overview" />
        <Section name="Dashboards" />
        <Section name="Settings" />
      </Tabs>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const orientationCode = `// orientation: 'horizontal' (default) | 'vertical' | { default: 'horizontal', md: 'vertical' }
<Tabs defaultValue="overview" orientation="vertical">…</Tabs>
<Tabs defaultValue="overview" orientation={{ default: 'horizontal', md: 'vertical' }}>…</Tabs>`;
const scrollableCode = `// variant: 'standard' (default) | 'scrollable' | 'fullWidth'
<TabList aria-label="Project" variant="scrollable" scrollButtons>
  …many tabs…
</TabList>
<TabList aria-label="Project" variant="fullWidth">…</TabList>`;
const contentCode = `<Tab value="overview" startElement={<BookOpenIcon />}>Overview</Tab>
<Tab value="datasources" endElement={<Chip size="xs">3</Chip>}>Datasources</Tab>`;

type ProjectTabsProps = Pick<TabsProps, 'orientation'> &
  Pick<TabListProps, 'variant' | 'scrollButtons' | 'slotProps'> & { tabStyle?: TabStyle };

function ProjectTabs({ orientation, tabStyle, ...listProps }: ProjectTabsProps): ReactElement {
  return (
    <Tabs defaultValue={sections[0]} orientation={orientation}>
      <TabList aria-label="Project" {...listProps}>
        {sections.map((name) => (
          <Tab key={name} value={name} style={tabStyle}>
            {name}
          </Tab>
        ))}
      </TabList>
      {sections.map((name) => (
        <Section key={name} name={name} />
      ))}
    </Tabs>
  );
}

export const Variants: Story = () => (
  <Stack>
    <Sample title="Orientation — vertical and responsive (resize the window)" code={orientationCode}>
      <Stack>
        <ProjectTabs orientation="vertical" />
        <ProjectTabs orientation={{ default: 'horizontal', md: 'vertical' }} />
      </Stack>
    </Sample>

    <Sample title="Scrollable with scroll buttons, and fullWidth" code={scrollableCode}>
      <Stack>
        <div style={narrow}>
          <ProjectTabs variant="scrollable" scrollButtons />
        </div>
        <Tabs defaultValue="Overview">
          <TabList aria-label="Project" variant="fullWidth">
            <Tab value="Overview">Overview</Tab>
            <Tab value="Dashboards">Dashboards</Tab>
            <Tab value="Settings">Settings</Tab>
          </TabList>
          <Section name="Overview" />
          <Section name="Dashboards" />
          <Section name="Settings" />
        </Tabs>
      </Stack>
    </Sample>

    <Sample title="startElement and endElement" code={contentCode}>
      <Tabs defaultValue="Overview">
        <TabList aria-label="Project">
          <Tab value="Overview" startElement={<BookOpenIcon />}>
            Overview
          </Tab>
          <Tab value="Dashboards" startElement={<ViewColumnIcon />}>
            Dashboards
          </Tab>
          <Tab value="Datasources" startElement={<EarthIcon />} endElement={<Chip size="xs">3</Chip>}>
            Datasources
          </Tab>
          <Tab value="Settings" startElement={<CogIcon />}>
            Settings
          </Tab>
        </TabList>
        <Section name="Overview" />
        <Section name="Dashboards" />
        <Section name="Datasources" />
        <Section name="Settings" />
      </Tabs>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const statesCode = `// value is TabsValue | null — null means no tab is active.
// Type in both fields, switch tabs and come back: the keepMounted panel keeps its text, the other resets.
<Tabs value={value} onValueChange={setValue}>
  <TabList aria-label="Project">
    <Tab value="overview">Overview</Tab>
    <Tab value="dashboards">Dashboards</Tab>
    <Tab value="secrets" disabled>Secrets</Tab>
  </TabList>
  <TabPanel value="overview" keepMounted><TextField label="Kept while hidden" /></TabPanel>
  <TabPanel value="dashboards"><TextField label="Reset when hidden" /></TabPanel>
</Tabs>`;

function ControlledTabs(): ReactElement {
  const [value, setValue] = useState<TabsValue | null>('Overview');
  return (
    <Stack>
      <Tabs value={value} onValueChange={setValue}>
        <TabList aria-label="Project">
          <Tab value="Overview">Overview</Tab>
          <Tab value="Dashboards">Dashboards</Tab>
          <Tab value="Secrets" disabled>
            Secrets
          </Tab>
        </TabList>
        <TabPanel value="Overview" p="md" keepMounted>
          <TextField label="Kept while hidden (keepMounted)" placeholder="Type, switch tab, come back" />
        </TabPanel>
        <TabPanel value="Dashboards" p="md">
          <TextField label="Reset when hidden" placeholder="Type, switch tab, come back" />
        </TabPanel>
      </Tabs>
      <p>
        Active value: <code>{String(value)}</code>
      </p>
    </Stack>
  );
}

export const States: Story = () => (
  <Stack>
    <Sample title="Controlled, disabled and keepMounted" code={statesCode}>
      <ControlledTabs />
    </Sample>
  </Stack>
);
States.storyName = 'States';

const linkCode = `// Any anchor-like element that forwards its ref (e.g. a router Link) keeps role="tab",
// keyboard activation and the indicator
<Tab value="dashboards" render={<Link to="/projects/demo/dashboards" />}>Dashboards</Tab>`;

/** Stand-in for a router `Link`: forwards the ref and everything Base UI injects onto a plain anchor. */
const DemoLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function DemoLink(
  { children, ...props },
  ref,
) {
  return (
    <a ref={ref} {...props}>
      {children}
    </a>
  );
});

export const LinkTabs: Story = () => (
  <Stack>
    <Sample title="Tabs that navigate" code={linkCode}>
      <Tabs defaultValue="Overview">
        <TabList aria-label="Project">
          <Tab value="Overview" render={<DemoLink href="#overview" />}>
            Overview
          </Tab>
          <Tab value="Dashboards" render={<DemoLink href="#dashboards" />}>
            Dashboards
          </Tab>
        </TabList>
        <Section name="Overview" />
        <Section name="Dashboards" />
      </Tabs>
    </Sample>
  </Stack>
);
LinkTabs.storyName = 'Link tabs';

const slotsCode = `<TabList
  aria-label="Project"
  variant="scrollable"
  scrollButtons
  slotProps={{
    indicator: { style: { height: 'var(--perses-spacing-xs)', borderRadius: 'var(--perses-radius-full)' } },
    scrollButton: { style: { color: 'var(--perses-status-text-primary)' } },
  }}
>
<Tab value="overview" style={{ '--perses-tab-min-height': '2.25rem' }}>Overview</Tab>`;

export const Slots: Story = () => (
  <Stack>
    <Sample title="slotProps.indicator, slotProps.scrollButton and TabStyle" code={slotsCode}>
      <div style={narrow}>
        <ProjectTabs variant="scrollable" scrollButtons slotProps={indicatorSlots} tabStyle={compactTab} />
      </div>
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
