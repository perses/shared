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
import { Grid } from './Grid';
import { GridItem } from './GridItem';

const outline: CSSProperties = {
  border: 'var(--perses-border-width-sm) solid var(--perses-border-default)',
  background: 'var(--perses-bg-surface)',
};
const cell: CSSProperties = {
  background: 'var(--perses-bg-sunken)',
  padding: 'var(--perses-spacing-sm)',
  textAlign: 'center',
};
const field: CSSProperties = {
  ...outline,
  background: 'var(--perses-bg-sunken)',
  padding: 'var(--perses-spacing-sm)',
};

const WIDE_SPAN = { default: 19, md: 9 } as const;
const NARROW_SPAN = { default: 5, md: 3 } as const;
// Every span that divides 12 evenly, repeated to fill its row: 1×12, 2×6, 3×4, 4×3, 6×2, 12×1.
const SPAN_CELLS = [12, 6, 4, 3, 2, 1].flatMap((span) =>
  Array.from({ length: 12 / span }, (_, position) => ({ id: `${span}-${position}`, span })),
);

const basicCode = `<Grid spacing="lg">
  <GridItem size={12}>Title</GridItem>
  <GridItem size={4}>Label</GridItem>
  <GridItem size={8}>Field</GridItem>
</Grid>`;

export const Basic: Story = () => (
  <Layout>
    <p>
      <code>Grid</code> is a 12-column CSS grid; each <code>GridItem</code> spans <code>size</code> columns.{' '}
      <code>spacing</code> is a CSS <code>gap</code>, so there are no negative margins to compensate for. Style props
      behave exactly as documented on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Grid spacing="lg" p="sm" style={outline}>
        <GridItem size={12} style={cell}>
          Title (12)
        </GridItem>
        <GridItem size={4} style={cell}>
          Label (4)
        </GridItem>
        <GridItem size={8} style={cell}>
          Field (8)
        </GridItem>
      </Grid>
    </Sample>
  </Layout>
);
Basic.storyName = 'Basic';

const columnsCode = `<Grid spacing="sm">
  <GridItem size={12}>12</GridItem>
  <GridItem size={6}>6</GridItem>
  <GridItem size={6}>6</GridItem>
  …
</Grid>

{/* A 24-column grid allows finer spans than 12 columns.
    default: the span used on all screen widths, unless a breakpoint below overrides it.
    md: the span used only on screens 900–1199px wide. */}
<Grid columns={24} spacing="sm">
  <GridItem size={{ default: 19, md: 9 }}>Wide: 19 columns, 9 at md</GridItem>
  <GridItem size={{ default: 5, md: 3 }}>Narrow: 5 columns, 3 at md</GridItem>
</Grid>`;

export const Columns: Story = () => (
  <Layout>
    <Sample title="Spans wrap onto new rows when they exceed 12" code={columnsCode}>
      <Layout>
        <Grid spacing="sm" p="sm" style={outline}>
          {SPAN_CELLS.map(({ id, span }) => (
            <GridItem key={id} size={span} style={cell}>
              {span}
            </GridItem>
          ))}
        </Grid>
        <Grid columns={24} spacing="sm" p="sm" style={outline}>
          <GridItem size={WIDE_SPAN} style={cell}>
            Wide: 19 of 24 columns; 9 columns at md (900–1199px)
          </GridItem>
          <GridItem size={NARROW_SPAN} style={cell}>
            Narrow: 5 of 24 columns; 3 columns at md (900–1199px)
          </GridItem>
        </Grid>
      </Layout>
    </Sample>
  </Layout>
);
Columns.storyName = 'Columns';

const nestedCode = `<Grid spacing="lg">
  <GridItem size={4}>Variable</GridItem>
  <GridItem size={8}>
    <Grid spacing="sm">
      <GridItem size={6}>Name</GridItem>
      <GridItem size={6}>Value</GridItem>
    </Grid>
  </GridItem>
</Grid>`;

export const Nested: Story = () => (
  <Layout>
    <Sample title="A GridItem can host another Grid" code={nestedCode}>
      <Grid spacing="lg" p="sm" style={outline}>
        <GridItem size={4} style={cell}>
          Variable (4)
        </GridItem>
        <GridItem size={8}>
          <Grid spacing="sm" p="sm" style={outline}>
            <GridItem size={6} style={cell}>
              Name (6)
            </GridItem>
            <GridItem size={6} style={cell}>
              Value (6)
            </GridItem>
          </Grid>
        </GridItem>
      </Grid>
    </Sample>
  </Layout>
);
Nested.storyName = 'Nested';

const formCode = `<Grid spacing="lg">
  <GridItem size={8}>Header name</GridItem>
  <GridItem size={3}>Header value</GridItem>
  <GridItem size={1}>×</GridItem>
  <GridItem size={4}>Label</GridItem>
  <GridItem size={12}>Input</GridItem>
</Grid>`;

export const FormLayout: Story = () => (
  <Layout>
    <Sample title="Form layout" code={formCode}>
      <Grid spacing="lg" p="sm" style={outline}>
        <GridItem size={8} style={field}>
          Header name
        </GridItem>
        <GridItem size={3} style={field}>
          Header value
        </GridItem>
        <GridItem size={1} style={cell}>
          ×
        </GridItem>
        <GridItem size={4} style={field}>
          Label
        </GridItem>
        <GridItem size={12} style={field}>
          Input
        </GridItem>
      </Grid>
    </Sample>
  </Layout>
);
FormLayout.storyName = 'Form layout';
