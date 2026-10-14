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
import { Tooltip } from './Tooltip';

const placementsRow: CSSProperties = {
  display: 'flex',
  gap: '2rem',
  justifyContent: 'center',
  padding: '2rem',
};
const column: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  alignItems: 'flex-start',
};

const richTitle = (
  <span>
    <strong>Bold text</strong> and <em>italic text</em>
  </span>
);

const basicCode = `<Tooltip title="Helpful text">
  <button>Hover me</button>
</Tooltip>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Tooltip</code> shows a short popup when its child is hovered or focused. The child is the trigger, so style
      it directly; use <code>className</code> to style the popup. The popup is linked to the trigger with{' '}
      <code>aria-describedby</code>, opens on hover and keyboard focus, and closes with Escape. Tooltip wraps a trigger
      instead of rendering its own box, so it takes no style props; style props on other components behave exactly as
      documented on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Tooltip title="Helpful text">
        <button>Hover me</button>
      </Tooltip>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const placementsCode = `// placement: 'top' (default) | 'bottom' | 'left' | 'right'
<Tooltip title="Top tooltip" placement="top"><button>Top</button></Tooltip>
<Tooltip title="Bottom tooltip" placement="bottom"><button>Bottom</button></Tooltip>
<Tooltip title="Left tooltip" placement="left"><button>Left</button></Tooltip>
<Tooltip title="Right tooltip" placement="right"><button>Right</button></Tooltip>`;
const richCode = `<Tooltip title={<span><strong>Bold text</strong> and <em>italic text</em></span>}>
  <button>Rich tooltip</button>
</Tooltip>`;

export const Placements: Story = () => (
  <Stack>
    <Sample title="Placements" code={placementsCode}>
      <div style={placementsRow}>
        <Tooltip title="Top tooltip" placement="top">
          <button>Top</button>
        </Tooltip>
        <Tooltip title="Bottom tooltip" placement="bottom">
          <button>Bottom</button>
        </Tooltip>
        <Tooltip title="Left tooltip" placement="left">
          <button>Left</button>
        </Tooltip>
        <Tooltip title="Right tooltip" placement="right">
          <button>Right</button>
        </Tooltip>
      </div>
    </Sample>

    <Sample title="Rich content" code={richCode}>
      <Tooltip title={richTitle}>
        <button>Rich tooltip</button>
      </Tooltip>
    </Sample>
  </Stack>
);
Placements.storyName = 'Variants';

const noDelayCode = `// delay is in milliseconds (default 400)
<Tooltip title="Instant tooltip" delay={0}><button>No delay</button></Tooltip>`;
const emptyCode = `// An empty title renders only the child, with no popup
<Tooltip title=""><button>No tooltip rendered</button></Tooltip>`;

export const Behavior: Story = () => (
  <Stack>
    <Sample title="No delay" code={noDelayCode}>
      <div style={column}>
        <Tooltip title="Instant tooltip" delay={0}>
          <button>No delay</button>
        </Tooltip>
      </div>
    </Sample>

    <Sample title="Empty title" code={emptyCode}>
      <Tooltip title="">
        <button>No tooltip rendered</button>
      </Tooltip>
    </Sample>
  </Stack>
);
Behavior.storyName = 'Behavior';
