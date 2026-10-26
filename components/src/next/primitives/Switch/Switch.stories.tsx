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
import { Switch } from './Switch';

const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const colors: Array<ColorVariant | Status> = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
const states = ['off', 'on'] as const;
const noop = (): void => {};
const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.5rem',
};
const rowLabel: CSSProperties = { width: '4rem', fontSize: '0.75rem' };
const sizeGroups: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const stateRows: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const sizeHeading: CSSProperties = { marginBottom: '0.5rem' };
const stateDivider: CSSProperties = {
  borderLeft: '1px solid var(--perses-border-default)',
  marginLeft: '0.25rem',
  paddingLeft: '0.75rem',
};
const grid: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const basicCode = `const [checked, setChecked] = useState(false);

<Switch checked={checked} onCheckedChange={setChecked} label="Enable feature" />`;

function ControlledSwitch(): ReactElement {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onCheckedChange={setChecked} label="Enable feature" />;
}

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Switch</code> toggles a setting on or off. Pass <code>label</code> to render a clickable label, or{' '}
      <code>aria-label</code> when there is no visible text. Its style props behave exactly as documented on{' '}
      <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <ControlledSwitch />
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `// size:  'xs' | 'sm' | 'md' | 'lg'
// color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info' (applies to the on track)
// Rows start off or on; enabled examples remain toggleable.
<Switch size="lg" color="success" label="Off" />
<Switch size="lg" color="success" defaultChecked label="On" />

// The trailing column shows the disabled state.
<Switch size="lg" color="primary" disabled defaultChecked label="disabled" />`;
const standaloneCode = `<Switch defaultChecked aria-label="Enable feature" />`;

export const Variants: Story = () => (
  <Stack>
    <Sample title="Colors and sizes — the last column shows the disabled state" code={variantsCode}>
      <div style={sizeGroups}>
        {sizes.map((size) => (
          <div key={size}>
            <h3 style={sizeHeading}>Size: {size}</h3>
            <div style={stateRows}>
              {states.map((state) => (
                <div key={state} style={row}>
                  <span style={rowLabel}>{state}</span>
                  {colors.map((color) => (
                    <Switch
                      key={color}
                      size={size}
                      color={color}
                      defaultChecked={state === 'on'}
                      label={color}
                      aria-label={`${size} ${state} ${color}`}
                    />
                  ))}
                  <span style={stateDivider}>
                    <Switch
                      size={size}
                      color="primary"
                      defaultChecked={state === 'on'}
                      disabled
                      label="disabled"
                      aria-label={`${size} ${state} disabled`}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sample>
    <Sample title="Without a visible label" code={standaloneCode}>
      <div style={grid}>
        {sizes.map((size) => (
          <div key={size} style={row}>
            <span style={rowLabel}>{size}</span>
            <Switch size={size} defaultChecked aria-label={`${size} switch without label`} />
          </div>
        ))}
      </div>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const statesCode = `<Switch checked={false} disabled label="Disabled, off" />
<Switch checked disabled label="Disabled, on" />

// readOnly stays focusable but cannot be toggled
<Switch checked readOnly label="Read-only, on" />
<Switch checked={false} readOnly label="Read-only, off" />`;

export const States: Story = () => (
  <Stack>
    <Sample title="Disabled and read only" code={statesCode}>
      <div style={grid}>
        <Switch checked={false} onCheckedChange={noop} disabled label="Disabled, off" />
        <Switch checked onCheckedChange={noop} disabled label="Disabled, on" />
        <Switch checked readOnly onCheckedChange={noop} label="Read-only, on" />
        <Switch checked={false} readOnly onCheckedChange={noop} label="Read-only, off" />
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';
