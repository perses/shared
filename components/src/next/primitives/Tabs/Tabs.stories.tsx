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
import { BookOpenIcon, ViewColumnIcon } from '../Icon';
import { TextField } from '../TextField';
import { Tab } from './Tab';
import { TabList } from './TabList';
import type { TabListProps, TabListSlotProps } from './TabList';
import { TabPanel } from './TabPanel';
import { Tabs } from './Tabs';
import type { TabsProps, TabStyle, TabsValue, TabsVariant } from './Tabs';

const narrow: CSSProperties = { width: '20rem' };
const compactTab: TabStyle = { '--perses-tab-min-height': '2.25rem' };
const sections = ['Overview', 'Dashboards', 'Settings'];
const overflowSections = ['Overview', 'Dashboards', 'Datasources', 'Variables', 'Secrets', 'Roles', 'Role bindings'];
const customSlots: TabListSlotProps = {
  indicator: {
    style: { display: 'block', height: 'var(--perses-spacing-xs)', borderRadius: 'var(--perses-radius-full)' },
  },
  scrollButton: { style: { color: 'var(--perses-status-text-primary)' } },
};

function Section({ name }: { name: string }): ReactElement {
  return (
    <TabPanel value={name} p="md">
      {name} content
    </TabPanel>
  );
}

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

const basicCode = `<Tabs defaultValue="Overview">
  <TabList aria-label="Project">
    <Tab value="Overview">Overview</Tab>
    <Tab value="Dashboards">Dashboards</Tab>
    <Tab value="Settings">Settings</Tab>
  </TabList>
  <TabPanel value="Overview" p="md">Overview content</TabPanel>
  <TabPanel value="Dashboards" p="md">Dashboards content</TabPanel>
  <TabPanel value="Settings" p="md">Settings content</TabPanel>
</Tabs>`;

const contentCode = `const DemoLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ children, ...props }, ref) => <a ref={ref} {...props}>{children}</a>,
);

<Tabs defaultValue="Overview">
  <TabList aria-label="Project links">
    <Tab value="Overview" render={<DemoLink href="#overview" />} startElement={<BookOpenIcon />}>
      Overview
    </Tab>
    <Tab value="Dashboards" render={<DemoLink href="#dashboards" />}
      startElement={<ViewColumnIcon />} endElement={<Chip size="xs">3</Chip>}>
      Dashboards
    </Tab>
  </TabList>
  <TabPanel value="Overview" p="md">Overview content</TabPanel>
  <TabPanel value="Dashboards" p="md">Dashboards content</TabPanel>
</Tabs>`;

const nestedCode = `<Tabs variant="enclosed" defaultValue="Overview">
  <TabList aria-label="Project sections">
    <Tab value="Overview">Overview</Tab>
    <Tab value="Settings">Settings</Tab>
  </TabList>
  <TabPanel value="Overview" p="md">
    <Tabs defaultValue="Summary">
      <TabList aria-label="Overview details">
        <Tab value="Summary">Summary</Tab>
        <Tab value="Activity">Activity</Tab>
      </TabList>
      <TabPanel value="Summary" p="md">Summary content</TabPanel>
      <TabPanel value="Activity" p="md">Activity content</TabPanel>
    </Tabs>
  </TabPanel>
  <TabPanel value="Settings" p="md">Settings content</TabPanel>
</Tabs>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      Compose <code>Tab</code>s inside a named <code>TabList</code> with one <code>TabPanel</code> per value. Selection,
      keyboard navigation and ARIA are automatic; style props follow <code>Box</code>.
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
    <Sample title="Custom content and rendering" code={contentCode}>
      <p>
        Add icons or badges with <code>startElement</code>/<code>endElement</code>. Custom renderers must forward props
        and the ref; set <code>nativeButton</code> for custom button components, not links.
      </p>
      <Tabs defaultValue="Overview">
        <TabList aria-label="Project links">
          <Tab value="Overview" render={<DemoLink href="#overview" />} startElement={<BookOpenIcon />}>
            Overview
          </Tab>
          <Tab
            value="Dashboards"
            render={<DemoLink href="#dashboards" />}
            startElement={<ViewColumnIcon />}
            endElement={<Chip size="xs">3</Chip>}
          >
            Dashboards
          </Tab>
        </TabList>
        <Section name="Overview" />
        <Section name="Dashboards" />
      </Tabs>
    </Sample>
    <Sample title="Nested tabs" code={nestedCode}>
      <p>
        Nest a complete tab set inside a panel. Each root owns its selection and appearance; the inner tabs default to{' '}
        <code>line</code>.
      </p>
      <Tabs variant="enclosed" defaultValue="Overview">
        <TabList aria-label="Project sections">
          <Tab value="Overview">Overview</Tab>
          <Tab value="Settings">Settings</Tab>
        </TabList>
        <TabPanel value="Overview" p="md">
          <Tabs defaultValue="Summary">
            <TabList aria-label="Overview details">
              <Tab value="Summary">Summary</Tab>
              <Tab value="Activity">Activity</Tab>
            </TabList>
            <TabPanel value="Summary" p="md">
              Summary content
            </TabPanel>
            <TabPanel value="Activity" p="md">
              Activity content
            </TabPanel>
          </Tabs>
        </TabPanel>
        <TabPanel value="Settings" p="md">
          Settings content
        </TabPanel>
      </Tabs>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const appearances: Array<{ variant: TabsVariant; description: string }> = [
  { variant: 'line', description: 'Baseline and sliding underline (default).' },
  { variant: 'subtle', description: 'Soft, rounded selected fill; no baseline.' },
  { variant: 'enclosed', description: 'Muted, padded rail with a distinct selected surface.' },
  { variant: 'outline', description: 'Baseline around the selection, open toward the panel.' },
  { variant: 'plain', description: 'No built-in active cue; shown with a consumer-provided indicator. See Slots.' },
];

function appearanceCode(variant: TabsVariant): string {
  const indicator =
    variant === 'plain'
      ? ` slotProps={{ indicator: { style: {
    display: 'block', height: 'var(--perses-spacing-xs)', borderRadius: 'var(--perses-radius-full)',
  } } }}`
      : '';
  return `<Tabs variant="${variant}" defaultValue="Overview">
  <TabList aria-label="${variant} appearance"${indicator}>
    <Tab value="Overview">Overview</Tab>
    <Tab value="Dashboards">Dashboards</Tab>
    <Tab value="Settings" disabled>Settings</Tab>
  </TabList>
  <TabPanel value="Overview" p="md">Overview content</TabPanel>
  <TabPanel value="Dashboards" p="md">Dashboards content</TabPanel>
  <TabPanel value="Settings" p="md">Settings content</TabPanel>
</Tabs>`;
}

const colorsCode = `<Tabs variant="subtle" color="secondary" defaultValue="Overview">
  <TabList aria-label="Project colors">
    <Tab value="Overview">Overview</Tab>
    <Tab value="Errors" color="error">Errors</Tab>
    <Tab value="Settings" color="default">Settings</Tab>
  </TabList>
  <TabPanel value="Overview" p="md">Overview content</TabPanel>
  <TabPanel value="Errors" p="md">Errors content</TabPanel>
  <TabPanel value="Settings" p="md">Settings content</TabPanel>
</Tabs>`;

export const Variants: Story = () => (
  <Stack>
    <p>
      <code>Tabs.variant</code> controls appearance; <code>TabList.variant</code> controls sizing. Nested tabs default
      independently to <code>line</code>.
    </p>
    {appearances.map(({ variant, description }) => (
      <Sample key={variant} title={variant} code={appearanceCode(variant)}>
        <p>{description}</p>
        <Tabs variant={variant} defaultValue="Overview">
          <TabList aria-label={`${variant} appearance`} slotProps={variant === 'plain' ? customSlots : undefined}>
            <Tab value="Overview">Overview</Tab>
            <Tab value="Dashboards">Dashboards</Tab>
            <Tab value="Settings" disabled>
              Settings
            </Tab>
          </TabList>
          <Section name="Overview" />
          <Section name="Dashboards" />
          <Section name="Settings" />
        </Tabs>
      </Sample>
    ))}
    <Sample title="Group color and per-tab overrides" code={colorsCode}>
      <p>
        <code>Tabs.color</code> defaults to <code>primary</code>. Override individual selected tabs with{' '}
        <code>Tab.color</code>; <code>default</code> selects neutral. Borders stay neutral.
      </p>
      <Tabs variant="subtle" color="secondary" defaultValue="Overview">
        <TabList aria-label="Project colors">
          <Tab value="Overview">Overview</Tab>
          <Tab value="Errors" color="error">
            Errors
          </Tab>
          <Tab value="Settings" color="default">
            Settings
          </Tab>
        </TabList>
        <Section name="Overview" />
        <Section name="Errors" />
        <Section name="Settings" />
      </Tabs>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const orientationCode = `<Tabs defaultValue="Overview" orientation={{ default: 'horizontal', md: 'vertical' }}>
  <TabList aria-label="Project">
    <Tab value="Overview">Overview</Tab>
    <Tab value="Dashboards">Dashboards</Tab>
    <Tab value="Settings">Settings</Tab>
  </TabList>
  <TabPanel value="Overview" p="md">Overview content</TabPanel>
  <TabPanel value="Dashboards" p="md">Dashboards content</TabPanel>
  <TabPanel value="Settings" p="md">Settings content</TabPanel>
</Tabs>`;

const scrollableCode = `const sections = ['Overview', 'Dashboards', 'Datasources', 'Variables', 'Secrets', 'Roles', 'Role bindings'];

<div style={{ width: '20rem' }}>
  <Tabs defaultValue={sections[0]}>
    <TabList aria-label="Project" scrollButtons>
      {sections.map((name) => <Tab key={name} value={name}>{name}</Tab>)}
    </TabList>
    {sections.map((name) => <TabPanel key={name} value={name} p="md">{name} content</TabPanel>)}
  </Tabs>
</div>`;

const fullWidthCode = `<Tabs defaultValue="Overview">
  <TabList aria-label="Project" variant="fullWidth">
    <Tab value="Overview">Overview</Tab>
    <Tab value="Dashboards">Dashboards</Tab>
    <Tab value="Settings">Settings</Tab>
  </TabList>
  <TabPanel value="Overview" p="md">Overview content</TabPanel>
  <TabPanel value="Dashboards" p="md">Dashboards content</TabPanel>
  <TabPanel value="Settings" p="md">Settings content</TabPanel>
</Tabs>`;

type ProjectTabsProps = Pick<TabsProps, 'orientation'> &
  Pick<TabListProps, 'variant' | 'scrollButtons'> & { items?: string[] };

function ProjectTabs({ orientation, items = sections, ...listProps }: ProjectTabsProps): ReactElement {
  return (
    <Tabs defaultValue={items[0]} orientation={orientation}>
      <TabList aria-label="Project" {...listProps}>
        {items.map((name) => (
          <Tab key={name} value={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      {items.map((name) => (
        <Section key={name} name={name} />
      ))}
    </Tabs>
  );
}

export const Layout: Story = () => (
  <Stack>
    <Sample title="Responsive orientation (resize the window)" code={orientationCode}>
      <p>
        <code>orientation</code> changes layout and navigation keys. This example becomes vertical at <code>md</code>;
        use <code>vertical</code> for a fixed vertical layout.
      </p>
      <ProjectTabs orientation={{ default: 'horizontal', md: 'vertical' }} />
    </Sample>
    <Sample title="Overflow with scroll buttons" code={scrollableCode}>
      <p>
        All lists scroll on overflow. <code>scrollButtons</code> adds mouse controls; keyboard navigation reveals
        focused tabs. Vertical lists use up/down chevrons.
      </p>
      <div style={narrow}>
        <ProjectTabs items={overflowSections} scrollButtons />
      </div>
    </Sample>
    <Sample title="Full-width sizing" code={fullWidthCode}>
      <p>
        Set <code>TabList.variant</code> to <code>fullWidth</code> to share space evenly; <code>standard</code> keeps
        natural widths.
      </p>
      <ProjectTabs variant="fullWidth" />
    </Sample>
  </Stack>
);
Layout.storyName = 'Layout';

const statesCode = `const [value, setValue] = useState<TabsValue | null>('Overview');

<>
  <Tabs value={value} onValueChange={setValue}>
    <TabList aria-label="Project">
      <Tab value="Overview">Overview</Tab>
      <Tab value="Dashboards">Dashboards</Tab>
      <Tab value="Secrets" disabled>Secrets</Tab>
    </TabList>
    <TabPanel value="Overview" p="md" keepMounted>
      <TextField label="Kept while hidden (keepMounted)" placeholder="Type, switch tab, come back" />
    </TabPanel>
    <TabPanel value="Dashboards" p="md">
      <TextField label="Reset when hidden" placeholder="Type, switch tab, come back" />
    </TabPanel>
    <TabPanel value="Secrets" p="md">Secrets content</TabPanel>
  </Tabs>
  <p>Active value: <code>{String(value)}</code></p>
</>`;

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
        <Section name="Secrets" />
      </Tabs>
      <p>
        Active value: <code>{String(value)}</code>
      </p>
    </Stack>
  );
}

export const States: Story = () => (
  <Stack>
    <p>
      Control selection with <code>value</code>/<code>onValueChange</code>; <code>null</code> means no selection.
      Disabled tabs remain arrow-key focusable but cannot activate. Inactive panels unmount unless{' '}
      <code>keepMounted</code> is set.
    </p>
    <Sample title="Controlled selection and panel state" code={statesCode}>
      <ControlledTabs />
    </Sample>
  </Stack>
);
States.storyName = 'States';

const slotsCode = `const sections = ['Overview', 'Dashboards', 'Datasources', 'Variables', 'Secrets', 'Roles', 'Role bindings'];
const customSlots: TabListSlotProps = {
  indicator: {
    style: { display: 'block', height: 'var(--perses-spacing-xs)', borderRadius: 'var(--perses-radius-full)' },
  },
  scrollButton: { style: { color: 'var(--perses-status-text-primary)' } },
};

<div style={{ width: '20rem' }}>
  <Tabs variant="plain" defaultValue={sections[0]} style={{ '--perses-tab-min-height': '2.25rem' }}>
    <TabList aria-label="Project" scrollButtons slotProps={customSlots}>
      {sections.map((name) => <Tab key={name} value={name}>{name}</Tab>)}
    </TabList>
    {sections.map((name) => <TabPanel key={name} value={name} p="md">{name} content</TabPanel>)}
  </Tabs>
</div>`;

export const Slots: Story = () => (
  <Stack>
    <p>
      <code>plain</code> retains active text color, ARIA, focus and disabled behavior, but requires a visible active cue
      beyond color. Use <code>data-active</code> CSS or enable the indicator with{' '}
      <code>slotProps.indicator.style.display</code> set to <code>block</code>.
    </p>
    <Sample title="Custom indicator, scroll buttons and tab height" code={slotsCode}>
      <div style={narrow}>
        <Tabs variant="plain" defaultValue={overflowSections[0]} style={compactTab}>
          <TabList aria-label="Project" scrollButtons slotProps={customSlots}>
            {overflowSections.map((name) => (
              <Tab key={name} value={name}>
                {name}
              </Tab>
            ))}
          </TabList>
          {overflowSections.map((name) => (
            <Section key={name} name={name} />
          ))}
        </Tabs>
      </div>
    </Sample>
    <p>
      <code>indicator</code> styles the active cue; <code>scrollButton</code> styles both overflow buttons. Preserve
      Base UI geometry (<code>--active-tab-*</code>) and use Perses tokens. Set <code>--perses-tab-min-height</code> on
      the root to size every tab.
    </p>
  </Stack>
);
Slots.storyName = 'Slots';
