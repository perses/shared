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

import { Field } from '@base-ui/react/field';
import type { Story } from '@ladle/react';
import type { CSSProperties } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { Checkbox } from '../Checkbox';
import { Switch } from '../Switch';
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

const basicCode = `// FormLabel gets htmlFor and FormHelperText is linked via aria-describedby automatically.
<FormControl>
  <FormLabel>Name</FormLabel>
  <Field.Control placeholder="Type here" />
  <FormHelperText>Shown to other members of your team</FormHelperText>
</FormControl>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      The <code>FormControl</code> family wraps a control that has no label of its own. <code>TextField</code>,{' '}
      <code>Select</code>, <code>Checkbox</code> and <code>Switch</code> already own their label; do not nest them
      inside a <code>FormControl</code>. Responsive spacing, sizing, flexbox and <code>display</code> style props apply
      to <code>FormControl</code> and <code>FormGroup</code>; spacing props apply to the other parts.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <FormControl>
        <FormLabel>Name</FormLabel>
        <Field.Control placeholder="Type here" />
        <FormHelperText>Shown to other members of your team</FormHelperText>
      </FormControl>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const controlLabelCode = `// Clicking the text toggles the wrapped control. Use this for controls without a label prop.
<FormControlLabel label="Allow header sorting"><Switch /></FormControlLabel>
<FormControlLabel label="Text first" labelPlacement="start"><Switch /></FormControlLabel>`;
const groupCode = `<FormGroup legend="Columns" direction="row">
  <Checkbox label="Name" />
  <Checkbox label="Value" />
  <Checkbox label="Timestamp" />
</FormGroup>`;
const horizontalCode = `// Label on the left, control on the right (PatternFly "isHorizontal" / OptionsEditorControl layout).
<FormControl display="flex" alignItems="center" gap="md">
  <FormLabel mb={0} style={{ minWidth: 120 }}>Unit</FormLabel>
  <Field.Control placeholder="Bytes" />
</FormControl>`;

export const Variants: Story = () => (
  <Stack>
    <Sample title="FormControlLabel" code={controlLabelCode}>
      <div style={columnStyle}>
        <FormControlLabel label="Allow header sorting">
          <Switch />
        </FormControlLabel>
        <FormControlLabel label="Text first" labelPlacement="start">
          <Switch />
        </FormControlLabel>
      </div>
    </Sample>

    <Sample title="FormGroup with legend" code={groupCode}>
      <div style={columnStyle}>
        <FormGroup legend="Columns" direction="row">
          <Checkbox label="Name" />
          <Checkbox label="Value" />
          <Checkbox label="Timestamp" />
        </FormGroup>
        <FormGroup legend="Notifications">
          <FormControlLabel label="Email">
            <Switch defaultChecked />
          </FormControlLabel>
          <FormControlLabel label="Slack">
            <Switch />
          </FormControlLabel>
        </FormGroup>
      </div>
    </Sample>

    <Sample title="Horizontal label" code={horizontalCode}>
      <FormControl display="flex" alignItems="center" gap="md">
        <FormLabel mb={0} style={{ minWidth: 120 }}>
          Unit
        </FormLabel>
        <Field.Control placeholder="Bytes" />
      </FormControl>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const statesCode = `<FormControl status="error">
  <FormLabel>Email</FormLabel>
  <Field.Control defaultValue="not-an-email" />
  <FormHelperText>Enter a valid email address</FormHelperText>
</FormControl>
<FormControl required>…</FormControl>
<FormControl disabled>…</FormControl>
<FormGroup legend="Disabled group" disabled>…</FormGroup>`;

export const States: Story = () => (
  <Stack>
    <Sample title="Error, required, disabled" code={statesCode}>
      <div style={columnStyle}>
        <FormControl status="error">
          <FormLabel>Email</FormLabel>
          <Field.Control defaultValue="not-an-email" />
          <FormHelperText>Enter a valid email address</FormHelperText>
        </FormControl>
        <FormControl status="warning">
          <FormLabel>Threshold</FormLabel>
          <Field.Control defaultValue="95" />
          <FormHelperText>Values above 90 may hide short spikes</FormHelperText>
        </FormControl>
        <FormControl required>
          <FormLabel>Name</FormLabel>
          <Field.Control required />
          <FormHelperText>The indicator comes from FormControl; validation comes from the control</FormHelperText>
        </FormControl>
        <FormControl disabled>
          <FormLabel>Disabled</FormLabel>
          <Field.Control defaultValue="Cannot be edited" />
          <FormHelperText>This field is disabled</FormHelperText>
        </FormControl>
        <FormGroup legend="Disabled group" disabled>
          <FormControlLabel label="Email">
            <Switch defaultChecked />
          </FormControlLabel>
          <FormControl>
            <FormLabel>Address</FormLabel>
            <Field.Control defaultValue="Inherited from the group" />
          </FormControl>
        </FormGroup>
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const spacingCode = `// Spacing tokens, raw numbers and responsive objects, as on Box.
<FormControl mb="lg">…</FormControl>
<FormControl mt={{ default: 'sm', md: 'xl' }}>…</FormControl>
<FormGroup legend="Options" p="md" gap="xs">…</FormGroup>`;

export const Spacing: Story = () => (
  <Stack>
    <Sample title="Spacing props" code={spacingCode}>
      <div style={{ outline: '1px dashed var(--perses-color-border-default)' }}>
        <FormControl mb="lg">
          <FormLabel>Margin bottom lg</FormLabel>
          <Field.Control />
        </FormControl>
        <FormControl mt={{ default: 'sm', md: 'xl' }}>
          <FormLabel>Responsive margin top</FormLabel>
          <Field.Control />
        </FormControl>
        <FormGroup legend="Options" p="md" gap="xs">
          <FormControlLabel label="One">
            <Switch />
          </FormControlLabel>
          <FormControlLabel label="Two">
            <Switch />
          </FormControlLabel>
        </FormGroup>
      </div>
    </Sample>
  </Stack>
);
Spacing.storyName = 'Spacing';

const sizingCode = `// A FormControl fills its column by default; constrain it in a row with width/minWidth.
<div style={{ display: 'flex', gap: '1rem' }}>
  <FormControl width={180}>…</FormControl>
  <FormControl minWidth={120} flex={1}>…</FormControl>
</div>`;

export const Sizing: Story = () => (
  <Stack>
    <Sample title="Width in a row" code={sizingCode}>
      <div style={rowStyle}>
        <FormControl width={180}>
          <FormLabel>Fixed 180px</FormLabel>
          <Field.Control />
        </FormControl>
        <FormControl minWidth={120} flex={1}>
          <FormLabel>Min 120px, grows</FormLabel>
          <Field.Control />
        </FormControl>
      </div>
    </Sample>
  </Stack>
);
Sizing.storyName = 'Sizing';
