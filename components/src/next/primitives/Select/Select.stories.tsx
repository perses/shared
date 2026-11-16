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
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { EarthIcon, UnfoldMoreIcon } from '../Icon';
import type { Size, Status } from '../types';
import { Select } from './Select';
import type { SelectItemData, SelectSlotProps } from './Select';
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

const timeZones = (
  <>
    <SelectItem value="utc">UTC</SelectItem>
    <SelectItem value="new-york">New York</SelectItem>
    <SelectItem value="paris">Paris</SelectItem>
  </>
);

const metricItems: SelectItemData[] = [
  { value: 'up', label: 'up' },
  { value: 'node_cpu_seconds_total', label: 'node_cpu_seconds_total' },
  { value: 'node_memory_MemFree_bytes', label: 'node_memory_MemFree_bytes' },
  { value: 'http_requests_total', label: 'http_requests_total' },
  { value: 'http_request_duration_seconds', label: 'http_request_duration_seconds' },
  { value: 'process_resident_memory_bytes', label: 'process_resident_memory_bytes' },
  { value: 'go_goroutines', label: 'go_goroutines' },
  { value: 'go_gc_duration_seconds', label: 'go_gc_duration_seconds', disabled: true },
];

function code(attrs: string, children = '…'): string {
  return `<Select ${attrs}>${children}</Select>`;
}

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
      <code>Box</code>; radius props apply to the wrapper. Add <code>searchable</code>, <code>multiple</code>,{' '}
      <code>chips</code> and <code>clearable</code> for the patterns in the stories below.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <ControlledSelect />
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const sizeCode = `// size: 'xs' | 'sm' | 'md' | 'lg'. The popup text and row height follow the trigger.
${code('label="Unit" size="lg" defaultValue="bytes"')}`;
const statusCode = `// status: 'error' | 'warning' | 'success' | 'info'. status="error" also sets aria-invalid.
${code('label="Unit" status="error" defaultValue="bytes"')}`;
const fullWidthCode = `// fullWidth stretches the root and trigger to the container.
${code('label="Dashboard" fullWidth defaultValue="overview"')}`;
const iconCode = `// icon replaces the chevron. Only the default chevron flips while the list is open; a custom icon stays still.
${code('label="Unit" icon={<UnfoldMoreIcon />} defaultValue="bytes"')}`;
const adornmentsCode = `// startElement and endElement sit inside the trigger, around the value.
${code('label="Time zone" startElement={<EarthIcon aria-hidden="true" />} endElement={<Chip size="xs">+00:00</Chip>} defaultValue="utc"')}`;

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
  </Stack>
);
Variants.storyName = 'Variants';

const placeholderCode = `// placeholder shows while nothing is selected. "" also means "nothing selected", so never pair a
// placeholder with <SelectItem value="">; use a value such as "all" or "none" instead (Select warns otherwise).
${code('label="Unit" placeholder="Choose a unit"')}`;
const helperTextCode = `// helperText is linked to the trigger via aria-describedby.
${code('label="Unit" helperText="Shown on every axis" defaultValue="bytes"')}`;
const readOnlyCode = `// readOnly locks the value, not the interaction: the list still opens from the trigger, but nothing can be changed.
${code('label="Unit" readOnly defaultValue="bytes"')}`;
const disabledCode = `// The whole control fades once; adornments inherit the fade instead of stacking their own.
${code('label="Time zone" disabled startElement={<EarthIcon aria-hidden="true" />} endElement={<Chip size="xs">+00:00</Chip>} defaultValue="utc"')}`;
const ariaLabelCode = `// Without a visible label, aria-label provides the accessible name.
${code('aria-label="Unit" placeholder="Unit"')}`;
const loadingCode = `// loading shows a spinner and sets aria-busy. Items stay usable; the spinner only signals that more may arrive.
// While there are no items the list shows loadingText. Open the lists to see the messages.
<Select label="Metric (no items)" loading items={[]} placeholder="Loading metrics" />
<Select label="Metric (with items)" loading defaultValue="up" items={metricItems} />`;
const emptyTextCode = `// emptyText replaces "No results" when there are no items and nothing is loading.
<Select label="Metric" items={[]} emptyText="No metrics found" placeholder="Nothing to pick" />`;

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

    <Sample title="aria-label" code={ariaLabelCode}>
      <div style={rowStyle}>
        <Select aria-label="Unit" placeholder="Unit">
          {units}
        </Select>
      </div>
    </Sample>

    <Sample title="loading" code={loadingCode}>
      <div style={rowStyle}>
        <Select label="Metric (no items)" loading items={[]} placeholder="Loading metrics" />
        <Select label="Metric (with items)" loading defaultValue="up" items={metricItems} />
      </div>
    </Sample>

    <Sample title="emptyText" code={emptyTextCode}>
      <div style={rowStyle}>
        <Select label="Metric" items={[]} emptyText="No metrics found" placeholder="Nothing to pick" />
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const unitItems: SelectItemData[] = [
  { value: 'bytes', label: 'Bytes' },
  { value: 'seconds', label: 'Seconds' },
  { value: 'percent', label: 'Percent', disabled: true },
];

const itemsCode = `// \`items\` replaces SelectItem children. label is the text shown in the list, the field and chips, and what search
// matches. Use either \`items\` or children, never both.
const items: SelectItemData[] = [
  { value: 'bytes', label: 'Bytes' },
  { value: 'seconds', label: 'Seconds' },
  { value: 'percent', label: 'Percent', disabled: true },
];

<Select label="Unit" items={items} defaultValue="bytes" />`;
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
const disabledItemCode = `// A disabled item cannot be selected, but arrow keys still reach it so screen readers announce it.
<Select label="Unit" placeholder="Seconds cannot be picked">
  <SelectItem value="bytes">Bytes</SelectItem>
  <SelectItem value="seconds" disabled startElement={<EarthIcon aria-hidden="true" />}>Seconds</SelectItem>
  <SelectItem value="percent">Percent</SelectItem>
</Select>`;

const metricTypes: Record<string, string> = {
  up: 'gauge',
  node_cpu_seconds_total: 'counter',
  node_memory_MemFree_bytes: 'gauge',
  http_requests_total: 'counter',
  http_request_duration_seconds: 'histogram',
  process_resident_memory_bytes: 'gauge',
  go_goroutines: 'gauge',
  go_gc_duration_seconds: 'summary',
};
const metricRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--perses-spacing-sm)',
};

function renderMetric(item: SelectItemData): ReactElement {
  return (
    <span style={metricRowStyle}>
      {item.label}
      <Chip size="xs">{metricTypes[String(item.value)]}</Chip>
    </span>
  );
}

const renderItemCode = `// renderItem customizes each data item's row; look up extra data by item.value. label stays the text for search,
// typeahead and the search input. Like SelectItem children, the content also shows in the trigger and chips.
// Define the function outside the component (or memoize it): a new function renders every item again.
function renderMetric(item: SelectItemData) {
  return (
    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--perses-spacing-sm)' }}>
      {item.label}
      <Chip size="xs">{metricTypes[item.value]}</Chip>
    </span>
  );
}

<Select label="Metric" items={metricItems} renderItem={renderMetric} defaultValue="up" />`;

export const Options: Story = () => (
  <Stack>
    <p>
      Options come from <code>SelectItem</code> children, or from <code>items</code> when they come from data. Each item
      has a <code>value</code>, a plain-text <code>label</code> and an optional <code>disabled</code>.
    </p>
    <Sample title="items" code={itemsCode}>
      <div style={rowStyle}>
        <Select label="Unit" items={unitItems} defaultValue="bytes" />
      </div>
    </Sample>

    <Sample title="renderItem" code={renderItemCode}>
      <div style={wideStyle}>
        <Select label="Metric" items={metricItems} renderItem={renderMetric} defaultValue="up" fullWidth />
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
  </Stack>
);
Options.storyName = 'Options';

const manyMetrics = [
  'up',
  'node_cpu_seconds_total',
  'http_requests_total',
  'go_goroutines',
  'process_resident_memory_bytes',
];

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
const chipsCode = `// chips shows the selection as removable chips. limitChips collapses them to "+N" while the list is closed and
// focus is not in the chips or the search input.
<Select label="Metrics" multiple chips limitChips={3} defaultValue={[...]} items={metricItems} />`;
const chipLabelsCode = `// Customize the screen-reader text of the remove buttons and of "+N".
<Select
  label="Metrics"
  multiple
  chips
  limitChips={1}
  defaultValue={['up', 'go_goroutines', 'http_requests_total']}
  items={metricItems}
  chipRemoveAriaLabel={(label) => \`Deselect \${label}\`}
  moreChipsLabel={(count) => \`\${count} more metrics\`}
/>`;
const clearableCode = `// clearable shows a button while something is selected. Single mode reports null, multiple mode reports [].
<Select label="Unit" clearable defaultValue="bytes" placeholder="Choose a unit">…</Select>
<Select label="Metrics" clearable multiple defaultValue={['up', 'go_goroutines']} items={metricItems} />`;

export const Selection: Story = () => (
  <Stack>
    <p>
      How the selection shows in the field and how it is cleared. With <code>multiple chips</code> the selection shows
      as removable chips; in the basic (button) mode the chip <code>×</code> is a pointer shortcut only and is not a tab
      stop, so keyboard users deselect items in the list. <code>clearable</code> is hidden while <code>disabled</code>{' '}
      or <code>readOnly</code>, and focus returns to the field after clearing.
    </p>
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

    <Sample title="chips and limitChips" code={chipsCode}>
      <div style={wideStyle}>
        <Select
          label="Metrics"
          multiple
          chips
          limitChips={3}
          defaultValue={manyMetrics}
          items={metricItems}
          fullWidth
        />
      </div>
    </Sample>

    <Sample title="chipRemoveAriaLabel and moreChipsLabel" code={chipLabelsCode}>
      <div style={wideStyle}>
        <Select
          label="Metrics"
          multiple
          chips
          limitChips={1}
          defaultValue={['up', 'go_goroutines', 'http_requests_total']}
          items={metricItems}
          chipRemoveAriaLabel={(label) => `Deselect ${label}`}
          moreChipsLabel={(count) => `${String(count)} more metrics`}
          fullWidth
        />
      </div>
    </Sample>

    <Sample title="clearable" code={clearableCode}>
      <div style={rowStyle}>
        <Select label="Unit" clearable defaultValue="bytes" placeholder="Choose a unit">
          {units}
        </Select>
        <Select label="Metrics" clearable multiple defaultValue={['up', 'go_goroutines']} items={metricItems} />
      </div>
    </Sample>
  </Stack>
);
Selection.storyName = 'Selection';

const SEARCH_DELAY_MS = 400;

function searchMetrics(query: string): SelectItemData[] {
  const needle = query.toLowerCase();
  return metricItems.filter((item) => item.label.toLowerCase().includes(needle));
}

function AsyncSearchSelect(): ReactElement {
  const [query, setQuery] = useState('');
  const [resolvedQuery, setResolvedQuery] = useState('');
  const [items, setItems] = useState<SelectItemData[]>(() => searchMetrics(''));
  const [value, setValue] = useState<SelectValue | null>(null);
  // Loading until the results for the current query arrive. Deriving it (rather than a flag set on input) cannot get
  // stuck when the text is set to the value it already has, which Base UI does when an item is picked.
  const loading = resolvedQuery !== query;
  // Picking an item puts its label in the field, which also becomes the query. Search with '' then, so reopening the
  // list shows every result instead of only the match for the selected label.
  const selectedLabel = metricItems.find((item) => item.value === value)?.label;
  const searchText = query === selectedLabel ? '' : query;

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(searchMetrics(searchText));
      setResolvedQuery(query);
    }, SEARCH_DELAY_MS);
    return (): void => clearTimeout(timer);
  }, [query, searchText]);

  return (
    <Select
      label="Metric"
      searchable
      filter={null}
      items={items}
      loading={loading}
      value={value}
      onValueChange={setValue}
      onInputValueChange={setQuery}
      placeholder="Search metrics"
      helperText="Results come from a simulated server after each keystroke"
    />
  );
}

const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

function ListHeaderSelect(): ReactElement {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SelectValue[]>(['up']);
  const matching = metricItems.filter(
    (item) => !item.disabled && item.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Select
      label="Metrics"
      searchable
      multiple
      items={metricItems}
      value={selected}
      onValueChange={setSelected}
      inputValue={query}
      onInputValueChange={setQuery}
      listHeader={
        <div style={headerStyle}>
          <Button
            size="xs"
            variant="ghost"
            disabled={matching.length === 0}
            onClick={() => setSelected([...new Set([...selected, ...matching.map((item) => item.value)])])}
          >
            Select all ({matching.length})
          </Button>
          <span>{selected.length} selected</span>
        </div>
      }
    />
  );
}

const searchableCode = `// searchable renders an input that filters the options. Single mode shows the selected label in the input.
<Select label="Metric" searchable defaultValue="up">
  <SelectItem value="up">up</SelectItem>
  <SelectItem value="node_cpu_seconds_total">node_cpu_seconds_total</SelectItem>
  <SelectItem value="http_requests_total">http_requests_total</SelectItem>
</Select>`;
const searchableMultipleCode = `// Without chips, the joined labels appear before the input. With chips, the chips and the input share the field;
// Backspace and the arrow keys move between them. The typed filter survives each pick.
<Select label="Metrics" searchable multiple defaultValue={['up', 'go_goroutines']} items={metricItems} />
<Select label="Metrics (chips)" searchable multiple chips defaultValue={['up', 'go_goroutines']} items={metricItems} />`;
const searchableFilterCode = `// filter replaces the default case- and accent-insensitive match on the label.
<Select
  label="Metric (starts with)"
  searchable
  items={metricItems}
  filter={(item, query) => item.label.toLowerCase().startsWith(query.toLowerCase())}
/>`;
const searchableGroupsCode = `// Groups with no matching option are hidden while searching.
<Select label="Time zone" searchable placeholder="Search time zones">
  <SelectGroup label="Universal">…</SelectGroup>
  <SelectGroup label="Americas">…</SelectGroup>
</Select>`;
const searchableClearableCode = `// With searchable, clearing also empties the typed text. clearAriaLabel names the button.
<Select label="Metric" clearable searchable clearAriaLabel="Reset metric" defaultValue="up" items={metricItems} />`;
const seriesItems: SelectItemData[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: index,
  label: `series_${String(index)}`,
}));
const virtualizedCode = `// virtualized mounts only the options in view, for lists of thousands of items. It needs searchable and items
// (no SelectItem children or SelectGroup). Rows should share one height: rows not yet rendered are sized like the first.
const seriesItems = Array.from({ length: 10_000 }, (_, index) => ({ value: index, label: \`series_\${index}\` }));

<Select label="Series" searchable virtualized items={seriesItems} placeholder="Search 10,000 series" />`;
const asyncSearchCode = `// filter={null} turns off local filtering: listen to onInputValueChange and replace \`items\` for each query.
// A selected value that drops out of \`items\` keeps its label.
function AsyncSearchSelect() {
  const [query, setQuery] = useState('');
  const [resolvedQuery, setResolvedQuery] = useState('');
  const [items, setItems] = useState(() => searchMetrics(''));
  const [value, setValue] = useState<SelectValue | null>(null);
  // Loading until the results for the current query arrive; it cannot get stuck on an unchanged query.
  const loading = resolvedQuery !== query;
  // Picking an item puts its label in the field, which also becomes the query. Search with '' then, so reopening the
  // list shows every result instead of only the match for the selected label.
  const selectedLabel = metricItems.find((item) => item.value === value)?.label;
  const searchText = query === selectedLabel ? '' : query;

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(searchMetrics(searchText));
      setResolvedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searchText]);

  return (
    <Select
      label="Metric"
      searchable
      filter={null}
      items={items}
      loading={loading}
      value={value}
      onValueChange={setValue}
      onInputValueChange={setQuery}
    />
  );
}`;
const listHeaderCode = `// listHeader renders non-option content above the options, outside the listbox, in either mode. Select only places
// it, so the story owns the controls. Here the search text is controlled so "Select all" can act on the filtered
// items. The header is pointer-only (Tab from the field closes the list), so offer a keyboard equivalent as well,
// such as a keyboard-reachable "select all" item or a control elsewhere on the page.
function ListHeaderSelect() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SelectValue[]>(['up']);
  const matching = metricItems.filter(
    (item) => !item.disabled && item.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Select
      label="Metrics"
      searchable
      multiple
      items={metricItems}
      value={selected}
      onValueChange={setSelected}
      inputValue={query}
      onInputValueChange={setQuery}
      listHeader={
        <div style={headerStyle}>
          <Button
            size="xs"
            variant="ghost"
            disabled={matching.length === 0}
            onClick={() => setSelected([...new Set([...selected, ...matching.map((item) => item.value)])])}
          >
            Select all ({matching.length})
          </Button>
          <span>{selected.length} selected</span>
        </div>
      }
    />
  );
}`;

export const Searchable: Story = () => (
  <Stack>
    <p>
      <code>searchable</code> replaces the button with an input that filters the list as you type. It is fixed for the
      component&apos;s lifetime: changing it remounts the <code>Select</code> and resets its uncontrolled state. In
      single mode the input shows the selected label, so <code>renderValue</code> is ignored; <code>placeholder</code>{' '}
      is used only when it is a string.
    </p>
    <Sample title="searchable" code={searchableCode}>
      <div style={rowStyle}>
        <Select label="Metric" searchable defaultValue="up">
          <SelectItem value="up">up</SelectItem>
          <SelectItem value="node_cpu_seconds_total">node_cpu_seconds_total</SelectItem>
          <SelectItem value="http_requests_total">http_requests_total</SelectItem>
          <SelectItem value="go_goroutines">go_goroutines</SelectItem>
        </Select>
      </div>
    </Sample>

    <Sample title="multiple and chips" code={searchableMultipleCode}>
      <div style={rowStyle}>
        <Select label="Metrics" searchable multiple defaultValue={['up', 'go_goroutines']} items={metricItems} />
        <div style={wideStyle}>
          <Select
            label="Metrics (chips)"
            searchable
            multiple
            chips
            defaultValue={['up', 'go_goroutines']}
            items={metricItems}
            fullWidth
          />
        </div>
      </div>
    </Sample>

    <Sample title="filter" code={searchableFilterCode}>
      <div style={rowStyle}>
        <Select
          label="Metric (starts with)"
          searchable
          items={metricItems}
          filter={(item, query) => item.label.toLowerCase().startsWith(query.toLowerCase())}
        />
      </div>
    </Sample>

    <Sample title="SelectGroup" code={searchableGroupsCode}>
      <div style={rowStyle}>
        <Select label="Time zone" searchable placeholder="Search time zones">
          <SelectGroup label="Universal">
            <SelectItem value="utc">UTC</SelectItem>
          </SelectGroup>
          <SelectGroup label="Americas">
            <SelectItem value="new-york">New York</SelectItem>
            <SelectItem value="los-angeles">Los Angeles</SelectItem>
          </SelectGroup>
          <SelectGroup label="Europe">
            <SelectItem value="paris">Paris</SelectItem>
            <SelectItem value="berlin">Berlin</SelectItem>
          </SelectGroup>
        </Select>
      </div>
    </Sample>

    <Sample title="clearable" code={searchableClearableCode}>
      <div style={rowStyle}>
        <Select
          label="Metric"
          clearable
          searchable
          clearAriaLabel="Reset metric"
          defaultValue="up"
          items={metricItems}
        />
      </div>
    </Sample>

    <Sample title="filter={null}" code={asyncSearchCode}>
      <div style={rowStyle}>
        <AsyncSearchSelect />
      </div>
    </Sample>

    <Sample title="listHeader" code={listHeaderCode}>
      <div style={rowStyle}>
        <ListHeaderSelect />
      </div>
    </Sample>

    <Sample title="virtualized" code={virtualizedCode}>
      <div style={rowStyle}>
        <Select label="Series" searchable virtualized items={seriesItems} placeholder="Search 10,000 series" />
      </div>
    </Sample>
  </Stack>
);
Searchable.storyName = 'Searchable';

const querySlots: SelectSlotProps = {
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  wrapper: { style: { borderStyle: 'dashed' } },
  trigger: { className: 'query-trigger', style: { fontFamily: 'monospace' } },
  popup: { style: { maxHeight: '8rem', fontFamily: 'monospace' } },
  helper: { style: { fontStyle: 'italic' } },
};
const slotStylingCode = `const querySlots: SelectSlotProps = {
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  wrapper: { style: { borderStyle: 'dashed' } },
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
          <code>wrapper</code> — Bordered field that holds the value, chips, input and buttons; also takes the{' '}
          <code>--perses-select-size-&lt;step&gt;</code> overrides.
        </li>
        <li>
          <code>trigger</code> — Focusable element: the button, or the search input when <code>searchable</code>.
        </li>
        <li>
          <code>chips</code> — Container of the selected-value chips, with <code>chips</code>.
        </li>
        <li>
          <code>clearButton</code> — Button that clears the selection, with <code>clearable</code>.
        </li>
        <li>
          <code>positioner</code> — Positions the popup and owns its <code>z-index</code>.
        </li>
        <li>
          <code>popup</code> — Floating list that holds the items.
        </li>
        <li>
          <code>list</code> — Listbox that holds the options inside the popup.
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
