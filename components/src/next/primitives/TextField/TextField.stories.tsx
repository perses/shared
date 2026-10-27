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
import type { CSSProperties } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import type { Size, Status } from '../types';
import { TextField } from './TextField';
import type { TextFieldSlotProps } from './TextField';

const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const statuses: Array<Status | undefined> = [undefined, 'error', 'warning', 'success', 'info'];

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${sizes.length}, max-content)`,
  gap: '1rem',
};

const searchIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
    <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const dollar = <span>$</span>;
const percent = <span>%</span>;

const basicCode = `<TextField label="Name" placeholder="Type here" />`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>TextField</code> is a text input with a label and helper text. Native input attributes go to the input.
      Responsive spacing, sizing and <code>overflow</code> style props apply to the root element; they are not repeated
      here, see the <code>Box</code> story for how they behave.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <TextField label="Name" placeholder="Type here" />
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `// size:   'xs' | 'sm' | 'md' | 'lg'
// status: 'error' | 'warning' | 'success' | 'info'
// status="error" also sets aria-invalid; helperText is linked via aria-describedby.
<TextField label="Email" size="lg" status="error" helperText="This field has error status with a long helper text" />`;

export const Variants: Story = () => (
  <Stack>
    <Sample title="Sizes and statuses" code={variantsCode}>
      <div style={gridStyle}>
        {statuses.map((status) =>
          sizes.map((size) => (
            <TextField
              key={`${status ?? 'default'}-${size}`}
              label={`${status ?? 'default'} / ${size}`}
              status={status}
              size={size}
              helperText={status ? `This field has ${status} status with a long helper text` : undefined}
              placeholder="Type here"
            />
          )),
        )}
      </div>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const stateCode = `<TextField label="Name" helperText="Shown to other members of your team" />
<TextField label="Disabled" disabled defaultValue="Cannot be edited" helperText="This field is disabled" />
<TextField label="Read only" readOnly defaultValue="Can be focused, not edited" />
<TextField label="Required" required />`;

export const States: Story = () => (
  <Stack>
    <Sample title="Helper text, disabled, read-only and required" code={stateCode}>
      <div style={columnStyle}>
        <TextField label="Name" helperText="Shown to other members of your team" />
        <TextField label="Disabled" disabled defaultValue="Cannot be edited" helperText="This field is disabled" />
        <TextField label="Read only" readOnly defaultValue="Can be focused, not edited" />
        <TextField label="Required" required />
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const adornmentsCode = `// Decorative icons should be aria-hidden; adornments are not part of the accessible name.
<TextField label="Search" placeholder="Search..." startAdornment={<SearchIcon aria-hidden="true" />} />
<TextField label="Amount" placeholder="0" startAdornment={<span>$</span>} endAdornment={<span>%</span>} />`;
const multilineCode = `<TextField label="Comment" multiline rows={4} placeholder="Write a longer response..." fullWidth />`;
const noLabelCode = `// Without a visible label, aria-label provides the accessible name.
<TextField aria-label="Search dashboards" placeholder="Search..." />`;

export const AdornmentsAndMultiline: Story = () => (
  <Stack>
    <Sample title="Adornments" code={adornmentsCode}>
      <div style={columnStyle}>
        <TextField label="Search" placeholder="Search..." startAdornment={searchIcon} />
        <TextField label="Amount" placeholder="0" startAdornment={dollar} endAdornment={percent} />
      </div>
    </Sample>

    <Sample title="Multiline" code={multilineCode}>
      <TextField label="Comment" multiline rows={4} placeholder="Write a longer response..." fullWidth />
    </Sample>

    <Sample title="Without a visible label" code={noLabelCode}>
      <TextField aria-label="Search dashboards" placeholder="Search..." />
    </Sample>
  </Stack>
);
AdornmentsAndMultiline.storyName = 'Adornments and multiline';

const querySlots: TextFieldSlotProps = {
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  wrapper: { style: { borderRadius: 0 } },
  input: { className: 'query-input', style: { fontFamily: 'monospace' } },
  helper: { style: { fontStyle: 'italic' } },
};
const slotStylingCode = `const querySlots: TextFieldSlotProps = {
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  wrapper: { style: { borderRadius: 0 } },
  input: { className: 'query-input', style: { fontFamily: 'monospace' } },
  helper: { style: { fontStyle: 'italic' } },
};

<TextField
  label="Query"
  defaultValue="up"
  helperText="Enter a PromQL expression"
  slotProps={querySlots}
/>`;

export const Slots: Story = () => (
  <Stack>
    <p>
      Use <code>slotProps</code> to style internal parts with <code>className</code> or <code>style</code>, without
      changing structure or behavior.
    </p>
    <div>
      <h3>Available slots</h3>
      <ul>
        <li>
          <code>label</code> — Visible label, when provided.
        </li>
        <li>
          <code>wrapper</code> — Bordered control and adornment container.
        </li>
        <li>
          <code>input</code> — Input or multiline textarea.
        </li>
        <li>
          <code>helper</code> — Helper text, when provided.
        </li>
      </ul>
    </div>
    <Sample title="Styling slots" code={slotStylingCode}>
      <TextField label="Query" defaultValue="up" helperText="Enter a PromQL expression" slotProps={querySlots} />
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
