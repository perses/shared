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
import type { ColorVariant, Size, Status } from '../types';
import { Checkbox } from './Checkbox';

const colors: Array<Status | ColorVariant> = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const ROW_STYLE: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' };
const COLUMN_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' };
const NARROW_STYLE: CSSProperties = { width: '20rem' };

function ControlledCheckbox(): ReactElement {
  const [checked, setChecked] = useState(false);

  return <Checkbox checked={checked} onCheckedChange={setChecked} label="Enable notifications" />;
}

const basicCode = `const [checked, setChecked] = useState(false);

<Checkbox checked={checked} onCheckedChange={setChecked} label="Enable notifications" />`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Checkbox</code> toggles a boolean option. Without a visible <code>label</code> it needs an{' '}
      <code>aria-label</code>. Style props behave exactly as documented on <code>Box</code>; they apply to the outermost
      element (the label wrapper when a label is rendered, otherwise the control).
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <ControlledCheckbox />
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `// size:  'xs' | 'sm' | 'md' | 'lg'
// color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
<Checkbox size="lg" color="error" defaultChecked label="Delete" />`;
const positionCode = `// labelPosition: 'end' (default) | 'start'
<Checkbox labelPosition="start" label="Label before the control" />`;

export const AllVariantsAndColors: Story = () => (
  <Stack>
    <Sample title="Sizes and colors" code={variantsCode}>
      <div style={COLUMN_STYLE}>
        <div style={ROW_STYLE}>
          {sizes.map((size) => (
            <Checkbox key={size} size={size} defaultChecked label={size} />
          ))}
        </div>
        <div style={ROW_STYLE}>
          {colors.map((color) => (
            <Checkbox key={color} color={color} defaultChecked label={color} />
          ))}
        </div>
      </div>
    </Sample>

    <Sample title="Label position" code={positionCode}>
      <Checkbox label="Label before the control" labelPosition="start" />
    </Sample>
  </Stack>
);
AllVariantsAndColors.storyName = 'Variants';

const statesCode = `<Checkbox label="Unchecked" />
<Checkbox label="Checked" defaultChecked />
<Checkbox label="Partially selected" indeterminate />
<Checkbox label="Disabled" disabled />
<Checkbox label="Read only" readOnly checked />
<Checkbox label="Required" required />
<Checkbox label="Invalid" invalid />`;
const composedCode = `// label accepts any content: compose links, icons or stacks yourself
<Checkbox label={<>Share usage data (<a href="#privacy">privacy policy</a>)</>} />`;
const standaloneCode = `// Without a label, pass aria-label
<Checkbox aria-label="Select all rows" indeterminate />`;
const longCode = `<div style={{ width: '20rem' }}>
  <Checkbox label="Use this option for every dashboard in the current project, including dashboards added later" />
</div>`;

export const States: Story = () => (
  <Stack>
    <Sample title="States" code={statesCode}>
      <div style={COLUMN_STYLE}>
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Partially selected" indeterminate />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled and checked" disabled checked />
        <Checkbox label="Read only" readOnly checked />
        <Checkbox label="Required" required />
        <Checkbox label="Invalid" invalid />
      </div>
    </Sample>

    <Sample title="Composed label" code={composedCode}>
      <Checkbox
        label={
          <>
            Share usage data (<a href="#privacy">privacy policy</a>)
          </>
        }
      />
    </Sample>

    <Sample title="Standalone" code={standaloneCode}>
      <Checkbox aria-label="Select all rows" indeterminate />
    </Sample>

    <Sample title="Long content" code={longCode}>
      <div style={NARROW_STYLE}>
        <Checkbox label="Use this option for every dashboard in the current project, including dashboards added later" />
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';
