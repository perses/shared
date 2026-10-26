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
import { Button } from '../Button';
import { TextField } from '../TextField';
import { TextHelper } from './TextHelper';

const controlStyle: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  gap: 'var(--perses-spacing-xs)',
  alignSelf: 'flex-start',
};
const narrowStyle: CSSProperties = { width: '14rem' };
const buttonCode = `<div style={{ display: 'inline-flex', flexDirection: 'column' }}>
  <Button aria-describedby="publish-help">Publish dashboard</Button>
  <TextHelper id="publish-help">
    Publishing makes this dashboard visible to everyone on your team.
  </TextHelper>
</div>`;
const fieldCode = `<TextField
  label="Name"
  helperText="Shown to the other members of your team."
/>
// TextField associates its TextHelper with the input automatically.`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>TextHelper</code> is a small paragraph built on <code>Text</code>. It wraps within its parent without
      increasing the intrinsic width of its parent. The control or container must establish the available width. Use{' '}
      <code>id</code> and <code>aria-describedby</code> for standalone controls; status changes color only, not
      live-announcement or validation behavior.
    </p>
    <Sample title="Button description" code={buttonCode}>
      <div style={controlStyle}>
        <Button aria-describedby="publish-help">Publish dashboard</Button>
        <TextHelper id="publish-help">Publishing makes this dashboard visible to everyone on your team.</TextHelper>
      </div>
    </Sample>
    <Sample title="Status messages and long content">
      <div style={narrowStyle}>
        <TextHelper>Default supporting text</TextHelper>
        <TextHelper disabled status="error">
          Disabled supporting text takes precedence over status.
        </TextHelper>
        <TextHelper status="error">Please provide a valid value before continuing.</TextHelper>
        <TextHelper status="warning">This action affects other members of your team.</TextHelper>
        <TextHelper status="success">Changes saved successfully.</TextHelper>
        <TextHelper status="info">https://example.com/a-long-path-without-spaces-for-a-control-description</TextHelper>
      </div>
    </Sample>
    <Sample title="TextField composition" code={fieldCode}>
      <TextField label="Name" helperText="Shown to the other members of your team." />
      <TextField label="Disabled name" disabled helperText="The helper inherits the disabled control state." />
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';
