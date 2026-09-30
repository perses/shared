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
import type { CSSProperties } from 'react';

import type { Size } from '../types';
import { Switch } from './Switch';

const sizes: Size[] = ['sm', 'md', 'lg'];
const noop = (): void => {};
const columnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };

export const Default: Story = () => {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onCheckedChange={setChecked} />;
};

export const AllSizes: Story = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    {sizes.map((size) => (
      <Switch key={size} size={size} checked onCheckedChange={noop} label={size} />
    ))}
  </div>
);
AllSizes.storyName = 'All Sizes';

export const Disabled: Story = () => (
  <div style={columnStyle}>
    <Switch checked={false} onCheckedChange={noop} disabled label="Disabled, off" />
    <Switch checked onCheckedChange={noop} disabled label="Disabled, on" />
  </div>
);

export const ReadOnly: Story = () => (
  <div style={columnStyle}>
    <Switch checked readOnly onCheckedChange={noop} label="Read-only, on" />
    <Switch checked={false} readOnly onCheckedChange={noop} label="Read-only, off" />
  </div>
);
ReadOnly.storyName = 'Read Only';

export const WithLabel: Story = () => <Switch checked={false} onCheckedChange={noop} label="Enable feature" />;
WithLabel.storyName = 'With Label';

export const WithoutLabel: Story = () => <Switch checked={false} onCheckedChange={noop} />;
WithoutLabel.storyName = 'Without Label';

export const ControlledToggle: Story = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div style={columnStyle}>
      <Switch checked={checked} onCheckedChange={setChecked} label="Insecure Skip Verify" />
      <span>Current value: {String(checked)}</span>
    </div>
  );
};
ControlledToggle.storyName = 'Controlled Toggle';
