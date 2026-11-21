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
import { Checkbox } from '../Checkbox';
import { Select, SelectItem } from '../Select';
import { Switch } from '../Switch';
import { TextField } from '../TextField';
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from './index';

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};
const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
};

const basicCode = `<FormControl>
  <FormLabel>Name</FormLabel>
  <TextField labelledByFormControl placeholder="Type here" />
  <FormHelperText>Shown to other members of your team</FormHelperText>
</FormControl>

<FormControl>
  <FormLabel>Unit</FormLabel>
  <Select labelledByFormControl defaultValue="bytes">…</Select>
</FormControl>

// Toggles: FormControlLabel puts the text beside the control and makes it clickable.
<FormControlLabel label="Show legend"><Checkbox labelledByFormControl /></FormControlLabel>
<FormControlLabel label="Allow header sorting"><Switch labelledByFormControl /></FormControlLabel>
`;

export const Basic: Story = () => (
  <Stack>
    <p>
      The <code>FormControl</code> family provides the label, helper text and shared state for a control.{' '}
      <code>TextField</code>, <code>Select</code> and <code>Checkbox</code> opt in with{' '}
      <code>labelledByFormControl</code> and then inherit <code>size</code>, <code>disabled</code>,{' '}
      <code>required</code> and <code>status</code>; <code>Switch</code> inherits them without an opt-in because it does
      not require a name. Responsive spacing, sizing, flexbox and <code>display</code> style props apply to{' '}
      <code>FormControl</code> and <code>FormGroup</code>; spacing props apply to the other parts.
    </p>
    <Sample title="One wrapper for every control" code={basicCode}>
      <div style={columnStyle}>
        <FormControl>
          <FormLabel>Name</FormLabel>
          <TextField labelledByFormControl placeholder="Type here" />
          <FormHelperText>Shown to other members of your team</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Unit</FormLabel>
          <Select labelledByFormControl defaultValue="bytes">
            <SelectItem value="bytes">Bytes</SelectItem>
            <SelectItem value="seconds">Seconds</SelectItem>
          </Select>
          <FormHelperText>Applied to every series in the panel</FormHelperText>
        </FormControl>
        <FormControlLabel label="Show legend">
          <Checkbox labelledByFormControl defaultChecked />
        </FormControlLabel>
        <FormControlLabel label="Allow header sorting">
          <Switch labelledByFormControl />
        </FormControlLabel>
      </div>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const groupCode = `// Elements are stacked vertically by default, to change orientation add 'direction="row"'
 <FormGroup legend="Columns" direction="row">
  <Checkbox label="Name" />
  <Checkbox label="Value" />
  <Checkbox label="Timestamp" />
</FormGroup>`;
const formControlLabel = `// Clicking the text toggles the wrapped control. Typically, used with switch and checkbox
<FormControlLabel label="Allow header sorting"><Switch labelledByFormControl /></FormControlLabel>
<FormControlLabel label="Show legend"><Checkbox labelledByFormControl /></FormControlLabel>
<FormControlLabel label="Text first" labelPlacement="start"><Switch labelledByFormControl /></FormControlLabel>`;
const formLabelCode = `// Plain text label use typically above a TextField or Select
<FormControl display="flex" alignItems="center" gap="md">
  <FormLabel mb={0} style={{ minWidth: 120 }}>Unit</FormLabel>
  <TextField labelledByFormControl placeholder="Bytes" />
</FormControl>`;

export const Variants: Story = () => (
  <Stack>
    <Sample title="FormGroup Row" code={groupCode}>
      <div>
        <FormGroup legend="Row" direction="row">
          <Checkbox label="Name" />
          <Checkbox label="Value" />
          <Checkbox label="Timestamp" />
        </FormGroup>
      </div>
    </Sample>
    <Sample title="FormControlLabel (clickable label beside the control)" code={formControlLabel}>
      <div style={columnStyle}>
        <FormControlLabel label="Allow header sorting">
          <Switch labelledByFormControl />
        </FormControlLabel>
        <FormControlLabel label="Show legend">
          <Checkbox labelledByFormControl />
        </FormControlLabel>
        <FormControlLabel label="Text first" labelPlacement="start">
          <Switch labelledByFormControl />
        </FormControlLabel>
      </div>
    </Sample>
    <Sample title="FormLabel (label above the control)" code={formLabelCode}>
      <FormControl display="flex" gap="md">
        <FormLabel>Unit</FormLabel>
        <TextField labelledByFormControl placeholder="Bytes" />
      </FormControl>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const errorCode = `<FormControl status="error">
  <FormLabel>Email</FormLabel>
  <TextField labelledByFormControl defaultValue="not-an-email" />
  <FormHelperText>Enter a valid email address</FormHelperText>
</FormControl>`;

const warningCode = `<FormControl status="warning">
  <FormLabel>Threshold</FormLabel>
  <TextField labelledByFormControl defaultValue="95" />
  <FormHelperText>Values above 90 may hide short spikes</FormHelperText>
</FormControl>`;

const requiredCode = `<FormControl required>
  <FormLabel>Name</FormLabel>
  <TextField labelledByFormControl />
  <FormHelperText>The indicator and the required flag on the input both come from FormControl</FormHelperText>
</FormControl>`;

const disabledCode = `<FormControl disabled>
  <FormLabel>Disabled</FormLabel>
  <TextField labelledByFormControl defaultValue="Cannot be edited" />
  <FormHelperText>This field is disabled</FormHelperText>
</FormControl>`;

const disabledGroupCode = `<FormGroup legend="Disabled group" disabled>
  <FormControlLabel label="Email">
    <Switch labelledByFormControl defaultChecked />
  </FormControlLabel>
  <FormControl>
    <FormLabel>Address</FormLabel>
    <TextField labelledByFormControl defaultValue="Inherited from the group" />
  </FormControl>
</FormGroup>`;

export const States: Story = () => (
  <Stack>
    <p>
      <code>size</code>, <code>disabled</code>, <code>required</code> and <code>status</code> flow from{' '}
      <code>FormControl</code> (or <code>FormGroup</code>) into the nested control.
    </p>
    <Sample title="Error" code={errorCode}>
      <div style={columnStyle}>
        <FormControl status="error">
          <FormLabel>Email</FormLabel>
          <TextField labelledByFormControl defaultValue="not-an-email" />
          <FormHelperText>Enter a valid email address</FormHelperText>
        </FormControl>
      </div>
    </Sample>
    <Sample title="Warning" code={warningCode}>
      <div style={columnStyle}>
        <FormControl status="warning">
          <FormLabel>Threshold</FormLabel>
          <TextField labelledByFormControl defaultValue="95" />
          <FormHelperText>Values above 90 may hide short spikes</FormHelperText>
        </FormControl>
      </div>
    </Sample>
    <Sample title="Required" code={requiredCode}>
      <div style={columnStyle}>
        <FormControl required>
          <FormLabel>Name</FormLabel>
          <TextField labelledByFormControl />
          <FormHelperText>The indicator and the required flag on the input both come from FormControl</FormHelperText>
        </FormControl>
      </div>
    </Sample>
    <Sample title="Disabled" code={disabledCode}>
      <div style={columnStyle}>
        <FormControl disabled>
          <FormLabel>Disabled</FormLabel>
          <TextField labelledByFormControl defaultValue="Cannot be edited" />
          <FormHelperText>This field is disabled</FormHelperText>
        </FormControl>
      </div>
    </Sample>
    <Sample title="Disabled group" code={disabledGroupCode}>
      <div style={columnStyle}>
        <FormGroup legend="Disabled group" disabled>
          <FormControlLabel label="Email">
            <Switch labelledByFormControl defaultChecked />
          </FormControlLabel>
          <FormControl>
            <FormLabel>Address</FormLabel>
            <TextField labelledByFormControl defaultValue="Inherited from the group" />
          </FormControl>
        </FormGroup>
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const spacingCode = `// Spacing tokens and responsive objects
  <Stack>
    <FormControl mb="lg">
      <FormLabel>Margin bottom lg</FormLabel>
      <TextField labelledByFormControl />
    </FormControl>
    <FormControl
      mb={{ default: "xs", md: "2xl" }}
      mt={{ default: "xs", md: "2xl" }}
      >
      <FormLabel>Responsive margin top and bottom</FormLabel>
      <TextField labelledByFormControl />
    </FormControl>
    <FormGroup legend="Gap medium" gap="md">
      <FormControlLabel label="One">
        <Switch labelledByFormControl />
      </FormControlLabel>
      <FormControlLabel label="Two">
        <Switch labelledByFormControl />
      </FormControlLabel>
    </FormGroup>
  </Stack>`;

export const Spacing: Story = () => (
  <Stack>
    <Sample title="Spacing props" code={spacingCode}>
      <div style={{ outline: '1px dashed var(--perses-color-border-default)' }}>
        <FormControl mb="lg">
          <FormLabel>Margin bottom lg</FormLabel>
          <TextField labelledByFormControl />
        </FormControl>
        <FormControl mb={{ default: 'xs', md: '2xl' }} mt={{ default: 'xs', md: '2xl' }}>
          <FormLabel>Responsive margin top and bottom</FormLabel>
          <TextField labelledByFormControl />
        </FormControl>
        <FormGroup legend="Gap medium" gap="md">
          <FormControlLabel label="One">
            <Switch labelledByFormControl />
          </FormControlLabel>
          <FormControlLabel label="Two">
            <Switch labelledByFormControl />
          </FormControlLabel>
        </FormGroup>
      </div>
    </Sample>
  </Stack>
);
Spacing.storyName = 'Spacing';

const sizingCode = `// A FormControl fills its column by default; constrain it in a row with width/minWidth.
<FormControl width={180}>
  <FormLabel>Fixed 180px</FormLabel>
  <TextField labelledByFormControl />
</FormControl>
<FormControl minWidth={120} flex={1}>
  <FormLabel>Min 120px, grows</FormLabel>
  <Select labelledByFormControl defaultValue="a">
    <SelectItem value="a">Option A</SelectItem>
  </Select>
</FormControl>
`;

export const Sizing: Story = () => (
  <Stack>
    <Sample title="Width in a row" code={sizingCode}>
      <div style={rowStyle}>
        <FormControl width={180}>
          <FormLabel>Fixed 180px</FormLabel>
          <TextField labelledByFormControl />
        </FormControl>
        <FormControl minWidth={120} flex={1}>
          <FormLabel>Min 120px, grows</FormLabel>
          <Select labelledByFormControl defaultValue="a">
            <SelectItem value="a">Option A</SelectItem>
          </Select>
        </FormControl>
      </div>
    </Sample>
  </Stack>
);
Sizing.storyName = 'Sizing';
