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
import type { SpacingScale } from '@perses-dev/design-tokens';
import type { CSSProperties } from 'react';

import { Sample, Stack as Page } from '../../stories/Sample';
import { Checkbox } from '../Checkbox';
import { Select, SelectItem } from '../Select';
import { Stack } from '../Stack';
import { Switch } from '../Switch';
import { TextField } from '../TextField';
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from './index';

const basicCode = `<FormControl>
  <FormLabel>Name</FormLabel>
  <TextField labelledByFormControl placeholder="Type here" />
  <FormHelperText>Displayed dashboard name</FormHelperText>
</FormControl>

<FormControl>
  <FormLabel>Unit</FormLabel>
  <Select labelledByFormControl defaultValue="bytes">…</Select>
</FormControl>

// Toggles: FormControlLabel puts the text beside the control and makes it clickable.
<FormControlLabel label="Allow header sorting"><Switch labelledByFormControl /></FormControlLabel>
`;

export const Basic: Story = () => (
  <Page>
    <p>
      The <code>FormControl</code> family provides the label, helper text and shared state for a control.{' '}
      <code>TextField</code>, <code>Select</code>, <code>Checkbox</code> and <code>Switch</code> opt in with{' '}
      <code>labelledByFormControl</code> and then inherit <code>size</code>, <code>disabled</code>,{' '}
      <code>required</code> and <code>status</code>. Responsive spacing, sizing, flexbox and <code>display</code> style
      props apply to <code>FormControl</code> and <code>FormGroup</code>; spacing props apply to the other parts.
    </p>
    <Sample title="One wrapper for every control" code={basicCode}>
      <Stack spacing="lg">
        <FormControl>
          <FormLabel>Name</FormLabel>
          <TextField labelledByFormControl placeholder="Type here" />
          <FormHelperText>Displayed name of dashboard</FormHelperText>
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
      </Stack>
    </Sample>
  </Page>
);
Basic.storyName = 'Basic';

const groupCode = `// Elements are stacked vertically by default, to change orientation add 'direction="row"'
 <FormGroup legend="Row" direction="row">
  <Checkbox label="Name" />
  <Checkbox label="Value" />
  <Checkbox label="Timestamp" />
</FormGroup>`;
const formControlLabel = `// Clicking the text toggles the wrapped control. Typically, used with switch and checkbox
<FormControlLabel label="Text second"><Switch labelledByFormControl /></FormControlLabel>
<FormControlLabel label="Text first" labelPlacement="start"><Switch labelledByFormControl /></FormControlLabel>`;

const settingsRowsCode = `// To create columns use the 'Stack' component
<Stack direction="row" spacing="3xl" alignItems="flex-start">
  {['Column 1', 'Column 2', 'Column 3'].map((legend) => (
    <FormGroup key={legend} legend={legend} width={360}>
      <FormControl display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
        <FormLabel>Show</FormLabel>
        <Switch labelledByFormControl defaultChecked />
      </FormControl>
      <FormControl display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
        <FormLabel>Position</FormLabel>
        <Select labelledByFormControl defaultValue="bottom">…</Select>
      </FormControl>
    </FormGroup>
  ))}
</Stack>`;

const sizingCode = `// Constrain row using width, minWidth, and flex
<FormGroup legend="Row" direction="row">
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
</FormGroup>`;

export const Variants: Story = () => (
  <Page>
    <Sample title="Rows" code={groupCode}>
      <div>
        <FormGroup legend="Row" direction="row">
          <Checkbox label="Name" />
          <Checkbox label="Value" />
          <Checkbox label="Timestamp" />
        </FormGroup>
      </div>
    </Sample>
    <Sample title="Width in a row" code={sizingCode}>
      <FormGroup legend="Row" direction="row">
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
      </FormGroup>
    </Sample>
    <Sample title="Columns" code={settingsRowsCode}>
      <Stack direction="row" spacing="3xl" alignItems="flex-start">
        {['Column 1', 'Column 2', 'Column 3'].map((legend) => (
          <FormGroup key={legend} legend={legend} width={360}>
            <FormControl display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
              <FormLabel>Show</FormLabel>
              <Switch labelledByFormControl defaultChecked />
            </FormControl>
            <FormControl display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
              <FormLabel>Position</FormLabel>
              <Select labelledByFormControl defaultValue="bottom">
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </Select>
            </FormControl>
          </FormGroup>
        ))}
      </Stack>
    </Sample>
    <Sample title="Label Placement" code={formControlLabel}>
      <Stack spacing="lg">
        <FormControlLabel label="Text second">
          <Switch labelledByFormControl />
        </FormControlLabel>
        <FormControlLabel label="Text first" labelPlacement="start">
          <Switch labelledByFormControl />
        </FormControlLabel>
      </Stack>
    </Sample>
  </Page>
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
  <Page>
    <p>
      <code>size</code>, <code>disabled</code>, <code>required</code> and <code>status</code> flow from{' '}
      <code>FormControl</code> (or <code>FormGroup</code>) into the nested control.
    </p>
    <Sample title="Error" code={errorCode}>
      <Stack spacing="lg">
        <FormControl status="error">
          <FormLabel>Email</FormLabel>
          <TextField labelledByFormControl defaultValue="not-an-email" />
          <FormHelperText>Enter a valid email address</FormHelperText>
        </FormControl>
      </Stack>
    </Sample>
    <Sample title="Warning" code={warningCode}>
      <Stack spacing="lg">
        <FormControl status="warning">
          <FormLabel>Threshold</FormLabel>
          <TextField labelledByFormControl defaultValue="95" />
          <FormHelperText>Values above 90 may hide short spikes</FormHelperText>
        </FormControl>
      </Stack>
    </Sample>
    <Sample title="Required" code={requiredCode}>
      <Stack spacing="lg">
        <FormControl required>
          <FormLabel>Name</FormLabel>
          <TextField labelledByFormControl />
          <FormHelperText>The indicator and the required flag on the input both come from FormControl</FormHelperText>
        </FormControl>
      </Stack>
    </Sample>
    <Sample title="Disabled" code={disabledCode}>
      <Stack spacing="lg">
        <FormControl disabled>
          <FormLabel>Disabled</FormLabel>
          <TextField labelledByFormControl defaultValue="Cannot be edited" />
          <FormHelperText>This field is disabled</FormHelperText>
        </FormControl>
      </Stack>
    </Sample>
    <Sample title="Disabled group" code={disabledGroupCode}>
      <Stack spacing="lg">
        <FormGroup legend="Disabled group" disabled>
          <FormControlLabel label="Email">
            <Switch labelledByFormControl defaultChecked />
          </FormControlLabel>
          <FormControl>
            <FormLabel>Address</FormLabel>
            <TextField labelledByFormControl defaultValue="Inherited from the group" />
          </FormControl>
        </FormGroup>
      </Stack>
    </Sample>
  </Page>
);
States.storyName = 'States';

const spacingCode = `// Spacing tokens and responsive objects
<FormControl mb="lg">
  <FormLabel>Margin bottom lg</FormLabel>
  <TextField labelledByFormControl />
</FormControl>`;
const responsiveCode = `// Responsive objects pick a token per breakpoint
<FormControl mb={{ default: "0", lg: "4xl" }} mt={{ default: "0", lg: "4xl" }}>
  <FormLabel>Responsive margin top and bottom</FormLabel>
  <TextField labelledByFormControl />
</FormControl>`;
const gapCode = `// gap controls the space between the children of a FormGroup
<FormGroup legend="Gap medium" gap="md">
  <FormControlLabel label="One">
    <Switch labelledByFormControl />
  </FormControlLabel>
  <FormControlLabel label="Two">
    <Switch labelledByFormControl />
  </FormControlLabel>
</FormGroup>`;

const marginOutline: CSSProperties = {
  outline: 'var(--perses-border-width-sm) dashed var(--perses-border-default)',
};
const spacingTokens: SpacingScale[] = ['0', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

export const Spacing: Story = () => (
  <Page>
    <Sample title="Gap" code={gapCode}>
      <Stack direction="row" spacing="3xl" alignItems="flex-start" flexWrap="wrap">
        {spacingTokens.map((gap) => (
          <FormGroup key={gap} legend={`Gap ${gap}`} gap={gap}>
            <FormControlLabel label="One">
              <Switch labelledByFormControl />
            </FormControlLabel>
            <FormControlLabel label="Two">
              <Switch labelledByFormControl />
            </FormControlLabel>
          </FormGroup>
        ))}
      </Stack>
    </Sample>
    <Sample title="Responsive margin" code={responsiveCode}>
      <div style={marginOutline}>
        <FormControl mb={{ default: '0', lg: '4xl' }} mt={{ default: '0', lg: '4xl' }}>
          <FormLabel>Responsive margin top and bottom</FormLabel>
          <TextField labelledByFormControl />
        </FormControl>
      </div>
    </Sample>
    <Sample title="Margin size" code={spacingCode}>
      <div style={marginOutline}>
        {spacingTokens.map((mb) => (
          <FormControl key={mb} mb={mb}>
            <FormLabel>Margin bottom {mb}</FormLabel>
            <TextField labelledByFormControl />
          </FormControl>
        ))}
      </div>
    </Sample>
  </Page>
);
Spacing.storyName = 'Spacing';
