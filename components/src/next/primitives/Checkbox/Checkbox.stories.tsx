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
import type { ReactElement } from 'react';

import { Checkbox } from './Checkbox';
import type { CheckboxColor, CheckboxSize } from './Checkbox';

const colors: CheckboxColor[] = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: CheckboxSize[] = ['sm', 'md', 'lg'];
const ROW_STYLE = { display: 'flex', alignItems: 'center', gap: '1rem' } as const;
const COLUMN_STYLE = { display: 'flex', flexDirection: 'column', gap: '0.75rem' } as const;
const NARROW_STYLE = { width: '20rem' } as const;
const PRIVACY_LINK = <a href="#privacy">Review the privacy policy</a>;

function ControlledCheckbox(): ReactElement {
  const [checked, setChecked] = useState(false);

  return <Checkbox checked={checked} onCheckedChange={setChecked} label="Enable notifications" />;
}

export const Default: Story = () => <ControlledCheckbox />;

export const Sizes: Story = () => (
  <div style={ROW_STYLE}>
    {sizes.map((size) => (
      <Checkbox key={size} size={size} defaultChecked label={size} />
    ))}
  </div>
);

export const Colors: Story = () => (
  <div style={COLUMN_STYLE}>
    {colors.map((color) => (
      <Checkbox key={color} color={color} defaultChecked label={color} />
    ))}
  </div>
);

export const States: Story = () => (
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
);

export const SupportingContent: Story = () => (
  <Checkbox
    label="Share usage data"
    description="Help improve Perses by sending anonymous usage information."
    body={PRIVACY_LINK}
  />
);

export const Reversed: Story = () => <Checkbox label="Label before the control" labelPosition="start" />;

export const Standalone: Story = () => <Checkbox aria-label="Select all rows" indeterminate />;

export const LongContent: Story = () => (
  <div style={NARROW_STYLE}>
    <Checkbox
      label="Use this option for every dashboard in the current project, including dashboards added later"
      description="You can change this setting at any time from project preferences."
    />
  </div>
);
