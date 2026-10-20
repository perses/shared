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
import { Card, CardContent, CardHeader } from './Card';

const row: CSSProperties = { display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' };
const title: CSSProperties = { margin: 0, fontSize: '1rem', fontWeight: 600 };
const text: CSSProperties = { margin: 0 };
const chartPlaceholder: CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'repeating-linear-gradient(135deg, transparent 0 10px, var(--perses-bg-sunken) 10px 20px)',
};

const basicCode = `<Card width={320}>
  <CardContent>A card is a surface for related content.</CardContent>
</Card>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Card</code> is a themed surface that stacks <code>CardHeader</code> and <code>CardContent</code> vertically.
      It accepts responsive spacing and sizing style props (<code>p</code>, <code>m</code>, <code>width</code>,{' '}
      <code>height</code>…) plus any native <code>div</code> attribute; those style props behave exactly as documented
      on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Card width={320}>
        <CardContent>A card is a surface for related content.</CardContent>
      </Card>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `<Card variant="elevated" width={320}>
  <CardHeader endElement={<Button size="sm" variant="outline">Edit</Button>}>
    <h4>Elevated</h4>
  </CardHeader>
  <CardContent>Default variant; uses the overlay shadow token.</CardContent>
</Card>

<Card variant="outlined" width={320}>
  <CardHeader endElement={<Button size="sm" variant="outline">Edit</Button>}>
    <h4>Outlined</h4>
  </CardHeader>
  <CardContent>Border instead of shadow; used by dashboard panels.</CardContent>
</Card>`;

const EditButton = (
  <Button size="sm" variant="outline">
    Edit
  </Button>
);

export const AllVariants: Story = () => (
  <Stack>
    <Sample title="elevated and outlined" code={variantsCode}>
      <div style={row}>
        <Card variant="elevated" width={320}>
          <CardHeader endElement={EditButton}>
            <h4 style={title}>Elevated</h4>
          </CardHeader>
          <CardContent>
            <p style={text}>Default variant; uses the overlay shadow token.</p>
          </CardContent>
        </Card>
        <Card variant="outlined" width={320}>
          <CardHeader endElement={EditButton}>
            <h4 style={title}>Outlined</h4>
          </CardHeader>
          <CardContent>
            <p style={text}>Border instead of shadow; used by dashboard panels.</p>
          </CardContent>
        </Card>
      </div>
    </Sample>
  </Stack>
);
AllVariants.storyName = 'Variants';

const panelCode = `<Card role="region" aria-labelledby="cpu-title" variant="outlined" width={420} height={260}>
  <CardHeader py="sm" endElement={<Button size="sm" variant="ghost">⋯</Button>}>
    <h4 id="cpu-title">CPU usage</h4>
  </CardHeader>
  <CardContent role="figure" p="0" height="100%">
    {chart}
  </CardContent>
</Card>`;

const MenuButton = (
  <Button size="sm" variant="ghost" aria-label="Panel actions">
    ⋯
  </Button>
);
const panelContent: CSSProperties = { flexGrow: 1 };

export const Panel: Story = () => (
  <Stack>
    <p>
      A dashboard panel: the consumer supplies semantics (<code>role=&quot;region&quot;</code>,{' '}
      <code>aria-labelledby</code>, <code>role=&quot;figure&quot;</code>) and removes the content padding so the chart
      fills the card.
    </p>
    <Sample title="Panel composition" code={panelCode}>
      {/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Card is not polymorphic (§3b); role carries the semantics */}
      <Card role="region" aria-labelledby="cpu-title" variant="outlined" width={420} height={260}>
        <CardHeader py="sm" endElement={MenuButton}>
          <h4 id="cpu-title" style={title}>
            CPU usage
          </h4>
        </CardHeader>
        <CardContent role="figure" p="0" style={panelContent}>
          <div style={chartPlaceholder}>chart</div>
        </CardContent>
      </Card>
      {/* oxlint-enable jsx-a11y/prefer-tag-over-role */}
    </Sample>
  </Stack>
);
Panel.storyName = 'Panel';
