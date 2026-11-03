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
import { useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { EarthIcon, MagnifyIcon, UnfoldMoreIcon } from '../Icon';
import type { Size, Status } from '../types';
import { Select } from './Select';
import type { SelectSlotProps } from './Select';
import { SelectGroup } from './SelectGroup';
import { SelectItem } from './SelectItem';
import type { SelectValue } from './SelectItem';

const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const statuses: Array<Status | undefined> = [undefined, 'error', 'warning', 'success', 'info'];

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--perses-spacing-lg)',
  alignItems: 'flex-start',
};
const rowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--perses-spacing-lg)',
  alignItems: 'flex-start',
};
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${sizes.length}, max-content)`,
  gap: 'var(--perses-spacing-lg)',
};
const wideStyle: CSSProperties = { width: '24rem' };

const earthIcon = <EarthIcon aria-hidden="true" />;
const magnifyIcon = <MagnifyIcon aria-hidden="true" />;
const unfoldIcon = <UnfoldMoreIcon />;

const units = (
  <>
    <SelectItem value="bytes">Bytes</SelectItem>
    <SelectItem value="seconds">Seconds</SelectItem>
    <SelectItem value="percent">Percent</SelectItem>
  </>
);

function ControlledSelect(): ReactElement {
  const [unit, setUnit] = useState<SelectValue | null>('bytes');

  return (
    <Select label="Unit" value={unit} onValueChange={setUnit}>
      {units}
    </Select>
  );
}

const basicCode = `const [unit, setUnit] = useState<SelectValue | null>('bytes');

<Select label="Unit" value={unit} onValueChange={setUnit}>
  <SelectItem value="bytes">Bytes</SelectItem>
  <SelectItem value="seconds">Seconds</SelectItem>
  <SelectItem value="percent">Percent</SelectItem>
</Select>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Select</code> picks one or more <code>SelectItem</code>s from a dropdown list. It carries its own{' '}
      <code>label</code>, <code>helperText</code> and <code>status</code> exactly like <code>TextField</code>, so a{' '}
      <code>{'<TextField select>'}</code> migrates by renaming. The trigger shows the selected item&apos;s content, and
      values can be strings or numbers. Native button attributes and <code>ref</code> go to the trigger. Responsive
      spacing, sizing and <code>overflow</code> style props apply to the root element and behave as documented on{' '}
      <code>Box</code>; radius props apply to the trigger.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <ControlledSelect />
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `// size:   'xs' | 'sm' | 'md' | 'lg'
// status: 'error' | 'warning' | 'success' | 'info'
// status="error" also sets aria-invalid; helperText is linked via aria-describedby.
<Select label="Unit" size="lg" status="error" helperText="Pick a unit" defaultValue="bytes">…</Select>`;
const multipleCode = `// multiple: value is an array; the trigger joins the selected labels.
<Select label="Columns" multiple defaultValue={['alertname', 'severity']}>
  <SelectItem value="alertname">alertname</SelectItem>
  <SelectItem value="severity">severity</SelectItem>
  <SelectItem value="instance">instance</SelectItem>
</Select>`;
const groupsCode = `<Select label="Time zone" defaultValue="utc" startElement={<EarthIcon aria-hidden="true" />}>
  <SelectGroup label="Universal">
    <SelectItem value="utc">UTC</SelectItem>
  </SelectGroup>
  <SelectGroup label="Americas">
    <SelectItem value="new-york" startElement={<EarthIcon aria-hidden="true" />}>New York</SelectItem>
    <SelectItem value="los-angeles" startElement={<EarthIcon aria-hidden="true" />}>Los Angeles</SelectItem>
  </SelectGroup>
  <SelectGroup label="Europe">
    <SelectItem value="paris" startElement={<EarthIcon aria-hidden="true" />}>Paris</SelectItem>
    <SelectItem value="berlin" startElement={<EarthIcon aria-hidden="true" />}>Berlin</SelectItem>
  </SelectGroup>
</Select>`;
const renderValueCode = `// renderValue replaces the trigger content; numeric values stay numbers.
<Select label="Refresh" defaultValue={30} renderValue={(value) => \`Every \${value}s\`}>
  <SelectItem value={5}>5 seconds</SelectItem>
  <SelectItem value={30}>30 seconds</SelectItem>
  <SelectItem value={60}>60 seconds</SelectItem>
</Select>

// icon replaces the chevron; fullWidth stretches to the container.
<Select label="Dashboard" placeholder="Choose…" icon={<UnfoldMoreIcon />} fullWidth>…</Select>`;

export const Variants: Story = () => (
  <Stack>
    <Sample title="Sizes and statuses" code={variantsCode}>
      <div style={gridStyle}>
        {statuses.map((status) =>
          sizes.map((size) => (
            <Select
              key={`${status ?? 'default'}-${size}`}
              label={`${status ?? 'default'} / ${size}`}
              status={status}
              size={size}
              helperText={status ? `This select has ${status} status` : undefined}
              defaultValue="bytes"
            >
              {units}
            </Select>
          )),
        )}
      </div>
    </Sample>

    <Sample title="Multiple selection" code={multipleCode}>
      <Select label="Columns" multiple defaultValue={['alertname', 'severity']}>
        <SelectItem value="alertname">alertname</SelectItem>
        <SelectItem value="severity">severity</SelectItem>
        <SelectItem value="instance">instance</SelectItem>
      </Select>
    </Sample>

    <Sample title="Groups, start elements and item icons" code={groupsCode}>
      <Select label="Time zone" defaultValue="utc" startElement={earthIcon}>
        <SelectGroup label="Universal">
          <SelectItem value="utc">UTC</SelectItem>
        </SelectGroup>
        <SelectGroup label="Americas">
          <SelectItem value="new-york" startElement={earthIcon}>
            New York
          </SelectItem>
          <SelectItem value="los-angeles" startElement={earthIcon}>
            Los Angeles
          </SelectItem>
        </SelectGroup>
        <SelectGroup label="Europe">
          <SelectItem value="paris" startElement={earthIcon}>
            Paris
          </SelectItem>
          <SelectItem value="berlin" startElement={earthIcon}>
            Berlin
          </SelectItem>
        </SelectGroup>
      </Select>
    </Sample>

    <Sample title="renderValue, custom icon and fullWidth" code={renderValueCode}>
      <div style={rowStyle}>
        <Select label="Refresh" defaultValue={30} renderValue={(value) => `Every ${String(value)}s`}>
          <SelectItem value={5}>5 seconds</SelectItem>
          <SelectItem value={30}>30 seconds</SelectItem>
          <SelectItem value={60}>60 seconds</SelectItem>
        </Select>
        <div style={wideStyle}>
          <Select label="Dashboard" placeholder="Choose…" icon={unfoldIcon} fullWidth>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="latency">Latency</SelectItem>
          </Select>
        </div>
      </div>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const statesCode = `<Select label="Unit" helperText="Shown on every axis" placeholder="Choose a unit">…</Select>
<Select label="Read only" readOnly defaultValue="bytes">…</Select>
<Select label="Disabled" disabled defaultValue="bytes" helperText="This select is disabled">…</Select>
<Select label="Disabled item" placeholder="Seconds cannot be picked">
  <SelectItem value="bytes">Bytes</SelectItem>
  <SelectItem value="seconds" disabled>Seconds</SelectItem>
  <SelectItem value="percent">Percent</SelectItem>
</Select>

// Without a visible label, aria-label provides the accessible name.
<Select aria-label="Unit" placeholder="Unit" startElement={<MagnifyIcon aria-hidden="true" />}>…</Select>`;

export const States: Story = () => (
  <Stack>
    <Sample title="Helper text, read-only, disabled and unlabeled" code={statesCode}>
      <div style={columnStyle}>
        <Select label="Unit" helperText="Shown on every axis" placeholder="Choose a unit">
          {units}
        </Select>
        <Select label="Read only" readOnly defaultValue="bytes">
          {units}
        </Select>
        <Select label="Disabled" disabled defaultValue="bytes" helperText="This select is disabled">
          {units}
        </Select>
        <Select label="Disabled item" placeholder="Seconds cannot be picked">
          <SelectItem value="bytes">Bytes</SelectItem>
          <SelectItem value="seconds" disabled>
            Seconds
          </SelectItem>
          <SelectItem value="percent">Percent</SelectItem>
        </Select>
        <Select aria-label="Unit" placeholder="Unit" startElement={magnifyIcon}>
          {units}
        </Select>
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const querySlots: SelectSlotProps = {
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  trigger: { className: 'query-trigger', style: { fontFamily: 'monospace' } },
  popup: { style: { maxHeight: '8rem', fontFamily: 'monospace' } },
  helper: { style: { fontStyle: 'italic' } },
};
const slotStylingCode = `const querySlots: SelectSlotProps = {
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  trigger: { className: 'query-trigger', style: { fontFamily: 'monospace' } },
  popup: { style: { maxHeight: '8rem', fontFamily: 'monospace' } },
  helper: { style: { fontStyle: 'italic' } },
};

<Select label="Metric" defaultValue="up" helperText="Pick a metric name" slotProps={querySlots}>…</Select>`;

export const Slots: Story = () => (
  <Stack>
    <p>
      Use <code>slotProps</code> to style internal parts with <code>className</code> or <code>style</code>, without
      changing structure or behavior. The popup is portaled to <code>document.body</code>, so it does not inherit
      ancestor-scoped styles; use the <code>popup</code> slot to style it.
    </p>
    <div>
      <h3>Available slots</h3>
      <ul>
        <li>
          <code>label</code> — Visible label, when provided.
        </li>
        <li>
          <code>trigger</code> — Button that shows the value and opens the list.
        </li>
        <li>
          <code>popup</code> — Floating list that holds the items.
        </li>
        <li>
          <code>helper</code> — Helper text, when provided.
        </li>
      </ul>
    </div>
    <Sample title="Styling slots" code={slotStylingCode}>
      <Select label="Metric" defaultValue="up" helperText="Pick a metric name" slotProps={querySlots}>
        <SelectItem value="up">up</SelectItem>
        <SelectItem value="node_cpu_seconds_total">node_cpu_seconds_total</SelectItem>
        <SelectItem value="http_requests_total">http_requests_total</SelectItem>
        <SelectItem value="process_resident_memory_bytes">process_resident_memory_bytes</SelectItem>
        <SelectItem value="go_goroutines">go_goroutines</SelectItem>
      </Select>
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
