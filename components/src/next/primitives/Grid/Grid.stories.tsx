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

import { Sample, Stack as Layout } from '../../stories/Sample';
import { Grid } from './Grid';
import { GridItem } from './GridItem';

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
      <Grid spacing="lg" p="sm" className="story-grid-outline">
        <GridItem size={12} className="story-grid-cell">
          Title (12)
        </GridItem>
        <GridItem size={4} className="story-grid-cell">
          Label (4)
        </GridItem>
        <GridItem size={8} className="story-grid-cell">
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

{/* fractional MUI spans (9.5 / 2.5) → integer spans on a 24-column grid */}
<Grid columns={24} spacing="sm">
  <GridItem size={{ default: 19, md: 9 }}>19 → 9</GridItem>
  <GridItem size={{ default: 5, md: 3 }}>5 → 3</GridItem>
</Grid>`;

export const Columns: Story = () => (
  <Layout>
    <Sample title="Spans wrap onto new rows when they exceed 12" code={columnsCode}>
      <Layout>
        <Grid spacing="sm" p="sm" className="story-grid-outline">
          {SPAN_CELLS.map(({ id, span }) => (
            <GridItem key={id} size={span} className="story-grid-cell">
              {span}
            </GridItem>
          ))}
        </Grid>
        <Grid columns={24} spacing="sm" p="sm" className="story-grid-outline">
          <GridItem size={WIDE_SPAN} className="story-grid-cell">
            19 → 9 of 24
          </GridItem>
          <GridItem size={NARROW_SPAN} className="story-grid-cell">
            5 → 3 of 24
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
      <Grid spacing="lg" p="sm" className="story-grid-outline">
        <GridItem size={4} className="story-grid-cell">
          Variable (4)
        </GridItem>
        <GridItem size={8}>
          <Grid spacing="sm" p="sm" className="story-grid-outline">
            <GridItem size={6} className="story-grid-cell">
              Name (6)
            </GridItem>
            <GridItem size={6} className="story-grid-cell">
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
    <Sample title="Form rows align without padding hacks" code={formCode}>
      <Grid spacing="lg" p="sm" className="story-grid-outline">
        <GridItem size={8} className="story-grid-field">
          Header name
        </GridItem>
        <GridItem size={3} className="story-grid-field">
          Header value
        </GridItem>
        <GridItem size={1} className="story-grid-cell">
          ×
        </GridItem>
        <GridItem size={4} className="story-grid-field">
          Label
        </GridItem>
        <GridItem size={12} className="story-grid-field">
          Input
        </GridItem>
      </Grid>
    </Sample>
  </Layout>
);
FormLayout.storyName = 'Form layout';
