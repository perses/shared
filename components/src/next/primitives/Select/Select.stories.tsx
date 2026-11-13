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
import { Chip } from '../Chip';
import { EarthIcon, UnfoldMoreIcon } from '../Icon';
import type { Size, Status } from '../types';
import { Select } from './Select';
import type { SelectSlotProps } from './Select';
import { SelectGroup } from './SelectGroup';
import { SelectItem } from './SelectItem';
import type { SelectValue } from './SelectItem';

const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const statuses: Status[] = ['error', 'warning', 'success', 'info'];

const rowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--perses-spacing-lg)',
  alignItems: 'flex-start',
};
const wideStyle: CSSProperties = { width: '24rem' };

const earthIcon = <EarthIcon aria-hidden="true" />;
const unfoldIcon = <UnfoldMoreIcon />;
const offsetChip = <Chip size="xs">+00:00</Chip>;

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

function code(attrs: string, children = '…'): string {
  return `<Select ${attrs}>${children}</Select>`;
}

const sizeCode = `// size: 'xs' | 'sm' | 'md' | 'lg'. The popup text and row height follow the trigger.
${code('label="Unit" size="lg" defaultValue="bytes"')}`;
const statusCode = `// status: 'error' | 'warning' | 'success' | 'info'. status="error" also sets aria-invalid.
${code('label="Unit" status="error" defaultValue="bytes"')}`;
const fullWidthCode = `// fullWidth stretches the root and trigger to the container.
${code('label="Dashboard" fullWidth defaultValue="overview"')}`;
const multipleCode = `// multiple: value is an array; the trigger joins the selected labels.
<Select label="Columns" multiple defaultValue={['alertname', 'severity']}>
  <SelectItem value="alertname">alertname</SelectItem>
  <SelectItem value="severity">severity</SelectItem>
  <SelectItem value="instance">instance</SelectItem>
</Select>`;
const renderValueCode = `// renderValue replaces the trigger content; numeric values stay numbers.
<Select label="Refresh" defaultValue={30} renderValue={(value) => \`Every \${value}s\`}>
  <SelectItem value={5}>5 seconds</SelectItem>
  <SelectItem value={30}>30 seconds</SelectItem>
  <SelectItem value={60}>60 seconds</SelectItem>
</Select>`;
const iconCode = `// icon replaces the chevron. Only the default chevron flips while the list is open; a custom icon stays still.
${code('label="Unit" icon={<UnfoldMoreIcon />} defaultValue="bytes"')}`;
const adornmentsCode = `// startElement and endElement sit inside the trigger, around the value.
${code('label="Time zone" startElement={<EarthIcon aria-hidden="true" />} endElement={<Chip size="xs">+00:00</Chip>} defaultValue="utc"')}`;
const groupsCode = `<Select label="Time zone" defaultValue="utc">
  <SelectGroup label="Universal">
    <SelectItem value="utc">UTC</SelectItem>
  </SelectGroup>
  <SelectGroup label="Americas">
    <SelectItem value="new-york">New York</SelectItem>
    <SelectItem value="los-angeles">Los Angeles</SelectItem>
  </SelectGroup>
</Select>`;
const itemStartCode = `<Select label="Region" defaultValue="eu">
  <SelectItem value="eu" startElement={<EarthIcon aria-hidden="true" />}>Europe</SelectItem>
  <SelectItem value="us" startElement={<EarthIcon aria-hidden="true" />}>Americas</SelectItem>
</Select>`;

const timeZones = (
  <>
    <SelectItem value="utc">UTC</SelectItem>
    <SelectItem value="new-york">New York</SelectItem>
    <SelectItem value="paris">Paris</SelectItem>
  </>
);

export const Variants: Story = () => (
  <Stack>
    <Sample title="size" code={sizeCode}>
      <div style={rowStyle}>
        {sizes.map((size) => (
          <Select key={size} label={size} size={size} defaultValue="bytes">
            {units}
          </Select>
        ))}
      </div>
    </Sample>

    <Sample title="status" code={statusCode}>
      <div style={rowStyle}>
        {statuses.map((status) => (
          <Select key={status} label={status} status={status} defaultValue="bytes">
            {units}
          </Select>
        ))}
      </div>
    </Sample>

    <Sample title="fullWidth" code={fullWidthCode}>
      <div style={wideStyle}>
        <Select label="Dashboard" fullWidth defaultValue="overview">
          <SelectItem value="overview">Overview</SelectItem>
          <SelectItem value="latency">Latency</SelectItem>
        </Select>
      </div>
    </Sample>

    <Sample title="multiple" code={multipleCode}>
      <div style={rowStyle}>
        <Select label="Columns" multiple defaultValue={['alertname', 'severity']}>
          <SelectItem value="alertname">alertname</SelectItem>
          <SelectItem value="severity">severity</SelectItem>
          <SelectItem value="instance">instance</SelectItem>
        </Select>
      </div>
    </Sample>

    <Sample title="renderValue" code={renderValueCode}>
      <div style={rowStyle}>
        <Select label="Refresh" defaultValue={30} renderValue={(value) => `Every ${String(value)}s`}>
          <SelectItem value={5}>5 seconds</SelectItem>
          <SelectItem value={30}>30 seconds</SelectItem>
          <SelectItem value={60}>60 seconds</SelectItem>
        </Select>
      </div>
    </Sample>

    <Sample title="icon" code={iconCode}>
      <div style={rowStyle}>
        <Select label="Unit" icon={unfoldIcon} defaultValue="bytes">
          {units}
        </Select>
      </div>
    </Sample>

    <Sample title="startElement and endElement" code={adornmentsCode}>
      <div style={rowStyle}>
        <Select label="Time zone" startElement={earthIcon} endElement={offsetChip} defaultValue="utc">
          {timeZones}
        </Select>
      </div>
    </Sample>

    <Sample title="SelectGroup" code={groupsCode}>
      <div style={rowStyle}>
        <Select label="Time zone" defaultValue="utc">
          <SelectGroup label="Universal">
            <SelectItem value="utc">UTC</SelectItem>
          </SelectGroup>
          <SelectGroup label="Americas">
            <SelectItem value="new-york">New York</SelectItem>
            <SelectItem value="los-angeles">Los Angeles</SelectItem>
          </SelectGroup>
        </Select>
      </div>
    </Sample>

    <Sample title="SelectItem startElement" code={itemStartCode}>
      <div style={rowStyle}>
        <Select label="Region" defaultValue="eu">
          <SelectItem value="eu" startElement={earthIcon}>
            Europe
          </SelectItem>
          <SelectItem value="us" startElement={earthIcon}>
            Americas
          </SelectItem>
        </Select>
      </div>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const placeholderCode = `// placeholder shows while nothing is selected. "" also means "nothing selected", so never pair a
// placeholder with <SelectItem value="">; use a value such as "all" or "none" instead (Select warns otherwise).
${code('label="Unit" placeholder="Choose a unit"')}`;
const helperTextCode = `// helperText is linked to the trigger via aria-describedby.
${code('label="Unit" helperText="Shown on every axis" defaultValue="bytes"')}`;
const readOnlyCode = code('label="Unit" readOnly defaultValue="bytes"');
const disabledCode = `// The whole control fades once; adornments inherit the fade instead of stacking their own.
${code('label="Time zone" disabled startElement={<EarthIcon aria-hidden="true" />} endElement={<Chip size="xs">+00:00</Chip>} defaultValue="utc"')}`;
const disabledItemCode = `// A disabled item cannot be selected, but arrow keys still reach it so screen readers announce it.
<Select label="Unit" placeholder="Seconds cannot be picked">
  <SelectItem value="bytes">Bytes</SelectItem>
  <SelectItem value="seconds" disabled startElement={<EarthIcon aria-hidden="true" />}>Seconds</SelectItem>
  <SelectItem value="percent">Percent</SelectItem>
</Select>`;
const ariaLabelCode = `// Without a visible label, aria-label provides the accessible name.
${code('aria-label="Unit" placeholder="Unit"')}`;

export const States: Story = () => (
  <Stack>
    <Sample title="placeholder" code={placeholderCode}>
      <div style={rowStyle}>
        <Select label="Unit" placeholder="Choose a unit">
          {units}
        </Select>
      </div>
    </Sample>

    <Sample title="helperText" code={helperTextCode}>
      <div style={rowStyle}>
        <Select label="Unit" helperText="Shown on every axis" defaultValue="bytes">
          {units}
        </Select>
      </div>
    </Sample>

    <Sample title="readOnly" code={readOnlyCode}>
      <div style={rowStyle}>
        <Select label="Unit" readOnly defaultValue="bytes">
          {units}
        </Select>
      </div>
    </Sample>

    <Sample title="disabled" code={disabledCode}>
      <div style={rowStyle}>
        <Select label="Time zone" disabled startElement={earthIcon} endElement={offsetChip} defaultValue="utc">
          {timeZones}
        </Select>
      </div>
    </Sample>

    <Sample title="SelectItem disabled" code={disabledItemCode}>
      <div style={rowStyle}>
        <Select label="Unit" placeholder="Seconds cannot be picked">
          <SelectItem value="bytes">Bytes</SelectItem>
          <SelectItem value="seconds" disabled startElement={earthIcon}>
            Seconds
          </SelectItem>
          <SelectItem value="percent">Percent</SelectItem>
        </Select>
      </div>
    </Sample>

    <Sample title="aria-label" code={ariaLabelCode}>
      <div style={rowStyle}>
        <Select aria-label="Unit" placeholder="Unit">
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
      <div style={rowStyle}>
        <Select label="Metric" defaultValue="up" helperText="Pick a metric name" slotProps={querySlots}>
          <SelectItem value="up">up</SelectItem>
          <SelectItem value="node_cpu_seconds_total">node_cpu_seconds_total</SelectItem>
          <SelectItem value="http_requests_total">http_requests_total</SelectItem>
          <SelectItem value="process_resident_memory_bytes">process_resident_memory_bytes</SelectItem>
          <SelectItem value="go_goroutines">go_goroutines</SelectItem>
        </Select>
      </div>
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
