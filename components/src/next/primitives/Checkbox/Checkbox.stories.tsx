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
import type { CheckboxSlotProps, CheckboxVariant } from './Checkbox';

const colors: Array<Status | ColorVariant> = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const variants: CheckboxVariant[] = ['subtle', 'solid', 'outline'];
const ROW_STYLE: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' };
const COLUMN_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' };
const NARROW_STYLE: CSSProperties = { width: '20rem' };
const VARIANT_ROW_STYLE: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' };
const VARIANT_LABEL_STYLE: CSSProperties = { width: '4rem', fontSize: '0.75rem' };
const SIZE_GROUPS_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const VARIANT_ROWS_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const SIZE_HEADING_STYLE: CSSProperties = { marginBottom: '0.5rem' };
const STATE_DIVIDER_STYLE: CSSProperties = {
  borderLeft: '1px solid var(--perses-border-default)',
  marginLeft: '0.25rem',
  paddingLeft: '0.75rem',
};

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

const variantsCode = `// variant: 'subtle' | 'solid' (default) | 'outline'
// size:    'xs' | 'sm' | 'md' | 'lg'
// color:   'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
<Checkbox variant="subtle" size="lg" color="error" defaultChecked label="Delete" />
<Checkbox variant="outline" color="success" indeterminate label="Partially selected" />

// The trailing column shows the disabled state.
<Checkbox variant="subtle" color="primary" disabled defaultChecked label="disabled" />`;
const positionCode = `// labelPosition: 'end' (default) | 'start'
<Checkbox labelPosition="start" label="Label before the control" />`;

export const AllVariantsAndColors: Story = () => (
  <Stack>
    <Sample title="Variants, colors and sizes — the last column shows the disabled state" code={variantsCode}>
      <div style={SIZE_GROUPS_STYLE}>
        {sizes.map((size) => (
          <div key={size}>
            <h3 style={SIZE_HEADING_STYLE}>Size: {size}</h3>
            <div style={VARIANT_ROWS_STYLE}>
              {variants.map((variant) => (
                <div key={variant} style={VARIANT_ROW_STYLE}>
                  <span style={VARIANT_LABEL_STYLE}>{variant}</span>
                  {colors.map((color) => (
                    <Checkbox
                      key={color}
                      variant={variant}
                      size={size}
                      color={color}
                      defaultChecked
                      label={color}
                      aria-label={`${size} ${variant} ${color}`}
                    />
                  ))}
                  <span style={STATE_DIVIDER_STYLE}>
                    <Checkbox
                      variant={variant}
                      size={size}
                      color="primary"
                      disabled
                      defaultChecked
                      label="disabled"
                      aria-label={`${size} ${variant} disabled`}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
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
      <div style={ROW_STYLE}>
        {variants.map((variant) => (
          <div key={variant} style={COLUMN_STYLE}>
            <h3>{variant}</h3>
            <Checkbox variant={variant} label="Unchecked" />
            <Checkbox variant={variant} label="Checked" defaultChecked />
            <Checkbox variant={variant} label="Partially selected" indeterminate />
            <Checkbox variant={variant} label="Disabled" disabled />
            <Checkbox variant={variant} label="Disabled and checked" disabled checked />
            <Checkbox variant={variant} label="Read only" readOnly checked />
            <Checkbox variant={variant} label="Required" required />
            <Checkbox variant={variant} label="Invalid" invalid />
          </div>
        ))}
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

const notificationSlots: CheckboxSlotProps = {
  control: { className: 'notification-control', style: { borderRadius: 0 } },
  indicator: { style: { opacity: 0.9 } },
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
};
const slotStylingCode = `const notificationSlots: CheckboxSlotProps = {
  control: { className: 'notification-control', style: { borderRadius: 0 } },
  indicator: { style: { opacity: 0.9 } },
  label: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
};

<Checkbox label="Enable notifications" defaultChecked slotProps={notificationSlots} />`;

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
          <code>control</code> — Checkbox control.
        </li>
        <li>
          <code>indicator</code> — Checked or indeterminate mark container.
        </li>
        <li>
          <code>label</code> — Visible label, when provided.
        </li>
      </ul>
    </div>
    <Sample title="Styling slots" code={slotStylingCode}>
      <Checkbox label="Enable notifications" defaultChecked slotProps={notificationSlots} />
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
