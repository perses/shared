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

import { Sample, Stack } from '../../stories/Sample';
import { Button } from '../Button';
import { Card, CardContent, CardHeader } from './Card';
import type { CardHeaderSlotProps } from './Card';

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
  <CardContent>Uses the overlay shadow token.</CardContent>
</Card>

<Card variant="outline" width={320}>
  <CardHeader endElement={<Button size="sm" variant="outline">Edit</Button>}>
    <h4>Outline</h4>
  </CardHeader>
  <CardContent>Default variant; border instead of shadow; used by dashboard panels.</CardContent>
</Card>

<Card variant="subtle" width={320}>
  <CardHeader endElement={<Button size="sm" variant="outline">Edit</Button>}>
    <h4>Subtle</h4>
  </CardHeader>
  <CardContent>A flat surface with no border or shadow.</CardContent>
</Card>`;

const EditButton = (
  <Button size="sm" variant="outline">
    Edit
  </Button>
);

export const AllVariants: Story = () => (
  <Stack>
    <Sample title="elevated, outline, and subtle" code={variantsCode}>
      <div className="story-card-row">
        <Card variant="elevated" width={320}>
          <CardHeader endElement={EditButton}>
            <h4 className="story-card-title">Elevated</h4>
          </CardHeader>
          <CardContent>
            <p className="story-card-text">Uses the overlay shadow token.</p>
          </CardContent>
        </Card>
        <Card variant="outline" width={320}>
          <CardHeader endElement={EditButton}>
            <h4 className="story-card-title">Outline</h4>
          </CardHeader>
          <CardContent>
            <p className="story-card-text">Default variant; border instead of shadow; used by dashboard panels.</p>
          </CardContent>
        </Card>
        <Card variant="subtle" width={320}>
          <CardHeader endElement={EditButton}>
            <h4 className="story-card-title">Subtle</h4>
          </CardHeader>
          <CardContent>
            <p className="story-card-text">A flat surface with no border or shadow.</p>
          </CardContent>
        </Card>
      </div>
    </Sample>
  </Stack>
);
AllVariants.storyName = 'Variants';

const panelCode = `<Card as="section" aria-labelledby="cpu-title" variant="outline" width={420} height={260}>
  <CardHeader as="header" py="sm" endElement={<Button size="sm" variant="ghost">⋯</Button>}>
    <h4 id="cpu-title">CPU usage</h4>
  </CardHeader>
  <CardContent as="figure" p="0" height="100%">
    {chart}
  </CardContent>
</Card>`;

const MenuButton = (
  <Button size="sm" variant="ghost" aria-label="Panel actions">
    ⋯
  </Button>
);

export const Panel: Story = () => (
  <Stack>
    <p>
      A dashboard panel: the consumer picks semantic elements with <code>as</code> (<code>section</code>,{' '}
      <code>header</code>, <code>figure</code>), labels the region with <code>aria-labelledby</code>, and removes the
      content padding so the chart fills the card.
    </p>
    <Sample title="Panel composition" code={panelCode}>
      <Card as="section" aria-labelledby="cpu-title" variant="outline" width={420} height={260}>
        <CardHeader as="header" py="sm" endElement={MenuButton}>
          <h4 id="cpu-title" className="story-card-title">
            CPU usage
          </h4>
        </CardHeader>
        <CardContent as="figure" p="0" className="story-card-panel-content">
          <div className="story-card-chart">chart</div>
        </CardContent>
      </Card>
    </Sample>
  </Stack>
);
Panel.storyName = 'Panel';

const headerSlots: CardHeaderSlotProps = {
  content: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  end: { className: 'header-actions', style: { gap: 'var(--perses-spacing-xs)' } },
};
const slotStylingCode = `const headerSlots: CardHeaderSlotProps = {
  content: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  end: { className: 'header-actions', style: { gap: 'var(--perses-spacing-xs)' } },
};

<Card width={320}>
  <CardHeader endElement={<Button size="sm" variant="ghost">⋯</Button>} slotProps={headerSlots}>
    Alerts
  </CardHeader>
  <CardContent>Three firing, two pending.</CardContent>
</Card>`;

export const Slots: Story = () => (
  <Stack>
    <p>
      Use <code>slotProps</code> on <code>CardHeader</code> to style its internal parts with <code>className</code> or{' '}
      <code>style</code>, without changing structure or behavior.
    </p>
    <div>
      <h3>Available slots</h3>
      <ul>
        <li>
          <code>content</code> — Wrapper around the title children.
        </li>
        <li>
          <code>end</code> — Wrapper around <code>endElement</code>, when one is rendered.
        </li>
      </ul>
    </div>
    <Sample title="Styling slots" code={slotStylingCode}>
      <Card width={320}>
        <CardHeader endElement={MenuButton} slotProps={headerSlots}>
          Alerts
        </CardHeader>
        <CardContent>Three firing, two pending.</CardContent>
      </Card>
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
