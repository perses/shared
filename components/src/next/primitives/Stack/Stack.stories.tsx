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
import type { Responsive as ResponsiveValue } from '../system/responsive';
import type { SpacingToken } from '../system/spacing';
import { Stack } from './Stack';

const outline: CSSProperties = {
  border: '1px solid var(--perses-border-default)',
  background: 'var(--perses-bg-surface)',
};
const item: CSSProperties = { background: 'var(--perses-bg-sunken)', padding: '0.5rem' };
const tallItem: CSSProperties = { ...item, padding: '1rem' };

const spacingScale: SpacingToken[] = ['0', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

const basicCode = `<Stack spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>`;

export const Basic: Story = () => (
  <Layout>
    <p>
      <code>Stack</code> lays out its children in a flex row or column with consistent spacing. It accepts{' '}
      <code>direction</code> and <code>spacing</code>, plus responsive spacing (<code>p</code>, <code>m</code>), sizing
      (<code>width</code>…) and flexbox (<code>alignItems</code>, <code>justifyContent</code>…) props.
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

const spacingCode = `// spacing accepts any spacing token: 0, xs, sm, md, lg, xl, 2xl, 3xl, 4xl
<Stack direction="row" spacing="lg">…</Stack>`;

export const Spacing: Story = () => (
  <Layout>
    <Sample title="Spacing scale (0, xs … 4xl)" code={spacingCode}>
      <Layout>
        {spacingScale.map((token) => (
          <div key={token}>
            <code>spacing={token}</code>
            <Stack direction="row" spacing={token} p="sm" style={outline}>
              <div style={item}>A</div>
              <div style={item}>B</div>
              <div style={item}>C</div>
            </Stack>
          </div>
        ))}
      </Layout>
    </Sample>
  </Layout>
);
Spacing.storyName = 'Spacing';

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

const responsiveDirection: ResponsiveValue<'row' | 'column'> = { default: 'column', md: 'row' };
const responsiveSpacing: ResponsiveValue<SpacingToken> = { default: 'sm', md: 'lg', xl: '3xl' };

const respDirectionCode = `<Stack direction={{ default: 'column', md: 'row' }} spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>`;
const respSpacingCode = `<Stack spacing={{ default: 'sm', md: 'lg', xl: '3xl' }}>…</Stack>`;

export const Responsive: Story = () => (
  <Layout>
    <p>
      <code>direction</code>, <code>spacing</code> and every other style prop accept a responsive object (
      <code>default</code>, <code>xs</code>, <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>).
      Include <code>default</code>: a breakpoint with no value falls back to <code>default</code>.
    </p>
    <Sample title="Stack, then row" code={respDirectionCode}>
      <Stack direction={responsiveDirection} spacing="md" p="sm" style={outline}>
        <div style={item}>Item 1</div>
        <div style={item}>Item 2</div>
        <div style={item}>Item 3</div>
      </Stack>
    </Sample>

    <Sample title="Responsive spacing" code={respSpacingCode}>
      <Stack spacing={responsiveSpacing} p="sm" style={outline}>
        <div style={item}>Item 1</div>
        <div style={item}>Item 2</div>
        <div style={item}>Item 3</div>
      </Stack>
    </Sample>
  </Layout>
);
Responsive.storyName = 'Responsive';
