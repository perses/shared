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

import { Stack } from './Stack';

export const Direction: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <div>
      <h3>Direction: column (default)</h3>
      <Stack spacing="md" style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <div style={{ background: '#eee', padding: '0.5rem' }}>Item 1</div>
        <div style={{ background: '#eee', padding: '0.5rem' }}>Item 2</div>
        <div style={{ background: '#eee', padding: '0.5rem' }}>Item 3</div>
      </Stack>
    </div>

    <div>
      <h3>Direction: row</h3>
      <Stack direction="row" spacing="md" style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <div style={{ background: '#eee', padding: '0.5rem' }}>Item 1</div>
        <div style={{ background: '#eee', padding: '0.5rem' }}>Item 2</div>
        <div style={{ background: '#eee', padding: '0.5rem' }}>Item 3</div>
      </Stack>
    </div>
  </div>
);
Direction.storyName = 'Direction';

export const SpacingTokens: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((token) => (
      <div key={token}>
        <h3>spacing={'{token}'}: {token}</h3>
        <Stack direction="row" spacing={token} style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
          <div style={{ background: '#eee', padding: '0.5rem' }}>A</div>
          <div style={{ background: '#eee', padding: '0.5rem' }}>B</div>
          <div style={{ background: '#eee', padding: '0.5rem' }}>C</div>
        </Stack>
      </div>
    ))}
  </div>
);
SpacingTokens.storyName = 'Spacing Tokens';

export const AlignAndJustify: Story = () => (
  <Stack
    direction="row"
    spacing="md"
    alignItems="center"
    justifyContent="space-between"
    style={{ border: '1px solid #ccc', padding: '1rem', minHeight: '100px' }}
  >
    <div style={{ background: '#eee', padding: '0.5rem' }}>Short</div>
    <div style={{ background: '#eee', padding: '1rem' }}>
      Taller
      <br />
      content
    </div>
    <div style={{ background: '#eee', padding: '0.5rem' }}>End</div>
  </Stack>
);
AlignAndJustify.storyName = 'Align and Justify';
