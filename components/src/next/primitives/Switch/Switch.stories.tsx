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
const noop = (): void => {};
const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1.5rem',
};
const rowLabel: CSSProperties = { width: '2rem', fontSize: '0.75rem' };
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

// Starts on so the color is visible, but stays toggleable to show the off state.
function ToggleableSwitch({ color }: { color: ColorVariant | Status }): ReactElement {
  const [checked, setChecked] = useState(true);
  return <Switch color={color} checked={checked} onCheckedChange={setChecked} label={color} />;
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
<Switch size="lg" checked onCheckedChange={setChecked} label="lg" />
<Switch color="success" checked onCheckedChange={setChecked} label="success" />`;

export const Variants: Story = () => (
  <Stack>
    <Sample title="Sizes — off, on, and without a visible label" code={variantsCode}>
      <div style={grid}>
        {sizes.map((size) => (
          <div key={size} style={row}>
            <span style={rowLabel}>{size}</span>
            <Switch size={size} checked={false} onCheckedChange={noop} label="Off" />
            <Switch size={size} checked onCheckedChange={noop} label="On" />
            <Switch size={size} checked aria-label={`${size} switch without label`} onCheckedChange={noop} />
          </div>
        ))}
      </div>
    </Sample>
    <Sample title="Colors — toggle to compare the on and off track">
      <div style={row}>
        {colors.map((color) => (
          <ToggleableSwitch key={color} color={color} />
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
