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
import { Alert } from './Alert';
import type { AlertSeverity } from './Alert';

const column: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };

const severities: AlertSeverity[] = ['error', 'warning', 'success', 'info'];

const SmileyIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <path d="M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM241.3 383.4C256.3 399 282.4 416 320 416C357.6 416 383.7 399 398.7 383.4C407.9 373.8 423.1 373.5 432.6 382.7C442.1 391.9 442.5 407.1 433.3 416.6C411.2 439.6 373.3 464 320 464C266.7 464 228.8 439.6 206.7 416.6C197.5 407 197.8 391.8 207.4 382.7C217 373.6 232.2 373.8 241.3 383.4zM208 272C208 254.3 222.3 240 240 240C257.7 240 272 254.3 272 272C272 289.7 257.7 304 240 304C222.3 304 208 289.7 208 272zM400 240C417.7 240 432 254.3 432 272C432 289.7 417.7 304 400 304C382.3 304 368 289.7 368 272C368 254.3 382.3 240 400 240z" />
  </svg>
);

const basicCode = `<Alert severity="info" icon="info">This is an info alert.</Alert>`;
const customIconCode = `<Alert icon={<svg viewBox="0 0 640 640">…</svg>}>This alert uses a custom icon.</Alert>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Alert</code> shows a status message. It accepts responsive style props — spacing (<code>p</code>,{' '}
      <code>m</code>, <code>gap</code>), sizing (<code>width</code>…) and display (<code>display</code>,{' '}
      <code>overflow</code>) — plus any native <code>div</code> attribute. Those style props behave exactly as
      documented on <code>Box</code>. Pass a custom icon via <code>icon</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Alert severity="info" icon="info">
        This is an info alert.
      </Alert>
    </Sample>

    <Sample title="Custom icon" code={customIconCode}>
      <Alert icon={SmileyIcon}>This alert uses a custom icon.</Alert>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const allSeveritiesCode = `<Alert severity="error" icon="error">This is a error alert.</Alert>
<Alert severity="warning" icon="warning">This is a warning alert.</Alert>
<Alert severity="success" icon="success">This is a success alert.</Alert>
<Alert severity="info" icon="info">This is a info alert.</Alert>`;
const noIconCode = `// icon is omitted by default
<Alert severity="error">No icon by default for a error alert.</Alert>`;

export const AllSeverities: Story = () => (
  <Stack>
    <Sample title="Severities with their default icons" code={allSeveritiesCode}>
      <div style={column}>
        {severities.map((severity) => (
          <Alert key={severity} severity={severity} icon={severity}>
            This is a {severity} alert.
          </Alert>
        ))}
      </div>
    </Sample>

    <Sample title="No icon (default)" code={noIconCode}>
      <div style={column}>
        {severities.map((severity) => (
          <Alert key={severity} severity={severity}>
            No icon by default for a {severity} alert.
          </Alert>
        ))}
      </div>
    </Sample>
  </Stack>
);
AllSeverities.storyName = 'Variants';
