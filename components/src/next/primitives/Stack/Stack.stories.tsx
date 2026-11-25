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

import { Sample, Stack as Layout } from '../../stories/Sample';
import { Stack } from './Stack';

const outline: CSSProperties = {
  border: '1px solid var(--perses-border-default)',
  background: 'var(--perses-bg-surface)',
};
const item: CSSProperties = {
  background: 'var(--perses-bg-sunken)',
  padding: '0.5rem',
};
const tallItem: CSSProperties = { ...item, padding: '1rem' };

const basicCode = `<Stack spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>`;

export const Basic: Story = () => (
  <Layout>
    <p>
      <code>Stack</code> lays out its children in a flex row or column with consistent spacing, using{' '}
      <code>direction</code> and <code>spacing</code>. Its style props behave exactly as documented on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Stack spacing="md" p="sm" style={outline}>
        <div style={item}>Item 1</div>
        <div style={item}>Item 2</div>
        <div style={item}>Item 3</div>
      </Stack>
    </Sample>
  </Layout>
);
Basic.storyName = 'Basic';

const directionCode = `<Stack direction="column" spacing="md">…</Stack>

<Stack direction="row" spacing="md">…</Stack>`;

export const Direction: Story = () => (
  <Layout>
    <Sample title="Column (default) and row" code={directionCode}>
      <Layout>
        <Stack spacing="md" p="sm" style={outline}>
          <div style={item}>Item 1</div>
          <div style={item}>Item 2</div>
          <div style={item}>Item 3</div>
        </Stack>
        <Stack direction="row" spacing="md" p="sm" style={outline}>
          <div style={item}>Item 1</div>
          <div style={item}>Item 2</div>
          <div style={item}>Item 3</div>
        </Stack>
      </Layout>
    </Sample>
  </Layout>
);
Direction.storyName = 'Direction';

const alignCode = `<Stack direction="row" spacing="md" alignItems="center" justifyContent="space-between" minHeight={100}>
  <div>Short</div>
  <div>Taller content</div>
  <div>End</div>
</Stack>`;

export const AlignAndJustify: Story = () => (
  <Layout>
    <Sample title="alignItems and justifyContent" code={alignCode}>
      <Stack
        direction="row"
        spacing="md"
        alignItems="center"
        justifyContent="space-between"
        minHeight={100}
        p="md"
        style={outline}
      >
        <div style={item}>Short</div>
        <div style={tallItem}>
          Taller
          <br />
          content
        </div>
        <div style={item}>End</div>
      </Stack>
    </Sample>
  </Layout>
);
AlignAndJustify.storyName = 'Align and Justify';
