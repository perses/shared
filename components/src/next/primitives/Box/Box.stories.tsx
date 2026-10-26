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
import type { SpacingScale } from '@perses-dev/design-tokens';
import type { CSSProperties } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import type { SampleFile } from '../../stories/Sample';
import { Box } from './Box';
import type { Responsive as ResponsiveValue, SpacingValue } from './Box';

// Box-demo chrome (not part of the Box API). Colors use Perses tokens so they follow Ladle's
// light/dark toggle; the Sample/Stack scaffolding lives in stories/Sample. Each Sample's `code`
// is the real Box markup (minus this demo styling) so readers can copy it verbatim.
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' };
const outline: CSSProperties = {
  border: '1px solid var(--perses-border-default)',
  background: 'var(--perses-bg-surface)',
};
const fill: CSSProperties = { background: 'var(--perses-bg-sunken)' };
const panel: CSSProperties = {
  border: '1px solid var(--perses-text-accent)',
  background: 'var(--perses-bg-surface)',
  borderRadius: 4,
};
const legend: CSSProperties = {
  background: 'var(--perses-bg-sunken)',
  color: 'var(--perses-text-primary)',
  borderRadius: 4,
  padding: '1rem',
  fontSize: '0.875rem',
  lineHeight: 1.6,
};
const sunken: CSSProperties = { background: 'var(--perses-bg-sunken)' };
const dashed: CSSProperties = { border: '1px dashed var(--perses-border-default)', padding: '1rem' };

const basicCode = `<Box p="md">A box with md padding.</Box>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Box</code> is a layout primitive. It accepts responsive style props grouped into categories — spacing (
      <code>p</code>, <code>m</code>, <code>gap</code>), sizing (<code>width</code>…), flexbox (
      <code>flexDirection</code>
      …) and display (<code>display</code>, <code>overflow</code>) — plus any native <code>div</code> attribute.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Box p="md" style={outline}>
        A box with md padding.
      </Box>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const spacingScale: SpacingScale[] = ['0', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

const paddingScaleCode = `// p accepts any spacing token: 0, xs, sm, md, lg, xl, 2xl, 3xl, 4xl
<Box p="md">Content</Box>`;
const paddingDirCode = `<Box px="lg" py="sm">horizontal lg, vertical sm</Box>`;
const marginDirCode = `<Box mx="lg" my="md">offset from its container</Box>`;
const gapCode = `<Box display="flex" gap="md">
  <Box p="sm">A</Box>
  <Box p="sm">B</Box>
  <Box p="sm">C</Box>
</Box>`;

export const Spacing: Story = () => (
  <Stack>
    <Sample title="Padding scale (0, xs … 4xl)" code={paddingScaleCode}>
      <div style={row}>
        {spacingScale.map((token) => (
          <Box key={token} p={token} style={outline}>
            <span style={fill}>p={token}</span>
          </Box>
        ))}
      </div>
    </Sample>

    <Sample title="Directional padding (px, py)" code={paddingDirCode}>
      <Box px="lg" py="sm" style={outline}>
        <span style={fill}>horizontal lg, vertical sm</span>
      </Box>
    </Sample>

    <Sample title="Directional margin (mx, my)" code={marginDirCode}>
      <div style={sunken}>
        <Box mx="lg" my="md" style={outline}>
          offset from its container
        </Box>
      </div>
    </Sample>

    <Sample title="Gap between flex children" code={gapCode}>
      <Box display="flex" gap="md" p="sm" style={outline}>
        <Box p="sm" style={fill}>
          A
        </Box>
        <Box p="sm" style={fill}>
          B
        </Box>
        <Box p="sm" style={fill}>
          C
        </Box>
      </Box>
    </Sample>
  </Stack>
);
Spacing.storyName = 'Spacing';

const sizeFixedCode = `<Box width={240} height={80}>240 × 80</Box>`;
const sizeRelativeCode = `<Box width="50%">width 50%</Box>
<Box width="calc(100% - 2rem)">…</Box>`;
const sizeMinMaxCode = `<Box maxWidth={320} minHeight={96} p="md">…</Box>`;

export const Sizing: Story = () => (
  <Stack>
    <Sample title="Fixed size — a number means pixels" code={sizeFixedCode}>
      <Box width={240} height={80} p="sm" style={outline}>
        240 × 80
      </Box>
    </Sample>

    <Sample title="Relative & calc — strings carry their own units" code={sizeRelativeCode}>
      <div style={dashed}>
        <Box width="50%" p="sm" style={outline}>
          width 50%
        </Box>
      </div>
    </Sample>

    <Sample title="Min / max constraints" code={sizeMinMaxCode}>
      <Box maxWidth={320} minHeight={96} p="md" style={outline}>
        maxWidth 320, minHeight 96 — text wraps within the max width and the box never shrinks below the min height.
      </Box>
    </Sample>
  </Stack>
);
Sizing.storyName = 'Sizing';

const displayCode = `<Box display="flex" gap="sm">
  <Box p="sm">flex</Box>
  <Box p="sm">children</Box>
</Box>`;
const directionCode = `<Box display="flex" flexDirection="column" gap="sm">
  <Box p="sm">1</Box>
  <Box p="sm">2</Box>
</Box>`;
const alignCode = `<Box display="flex" alignItems="center" justifyContent="space-between" gap="sm" minHeight={80}>
  <Box p="sm">left</Box>
  <Box p="md">taller</Box>
  <Box p="sm">right</Box>
</Box>`;
const flexCode = `<Box display="flex" gap="sm">
  <Box flex="1" p="sm">flex 1</Box>
  <Box flex="2" p="sm">flex 2</Box>
</Box>`;

export const Layout: Story = () => (
  <Stack>
    <Sample title="display (block, flex, inline-block, grid, none)" code={displayCode}>
      <Box display="flex" gap="sm" p="sm" style={outline}>
        <Box p="sm" style={fill}>
          flex
        </Box>
        <Box p="sm" style={fill}>
          children
        </Box>
      </Box>
    </Sample>

    <Sample title="flexDirection (row, column)" code={directionCode}>
      <Box display="flex" flexDirection="column" gap="sm" p="sm" style={outline}>
        <Box p="sm" style={fill}>
          1
        </Box>
        <Box p="sm" style={fill}>
          2
        </Box>
      </Box>
    </Sample>

    <Sample title="alignItems + justifyContent" code={alignCode}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="sm"
        p="sm"
        minHeight={80}
        style={outline}
      >
        <Box p="sm" style={fill}>
          left
        </Box>
        <Box p="md" style={fill}>
          taller
        </Box>
        <Box p="sm" style={fill}>
          right
        </Box>
      </Box>
    </Sample>

    <Sample title="flex (grow / shrink / basis)" code={flexCode}>
      <Box display="flex" gap="sm" p="sm" style={outline}>
        <Box flex="1" p="sm" style={fill}>
          flex 1
        </Box>
        <Box flex="2" p="sm" style={fill}>
          flex 2
        </Box>
      </Box>
    </Sample>
  </Stack>
);
Layout.storyName = 'Layout';

const responsiveWidth: ResponsiveValue<CSSProperties['width']> = {
  default: '100%',
  sm: '80%',
  md: 400,
  lg: 'calc(30em + 4px)',
};
const responsiveDisplay: ResponsiveValue<CSSProperties['display']> = { default: 'block', md: 'flex' };
const responsiveDirection: ResponsiveValue<CSSProperties['flexDirection']> = { default: 'column', md: 'row' };
const responsivePadding: ResponsiveValue<SpacingValue> = { default: 'sm', md: 24, xl: '2rem' };

const respWidthCode = `<Box width={{ default: '100%', sm: '80%', md: 400, lg: 'calc(30em + 4px)' }} p="md">
  I resize with the viewport.
</Box>`;
const respLayoutCode = `<Box
  display={{ default: 'block', md: 'flex' }}
  flexDirection={{ default: 'column', md: 'row' }}
  gap="md"
  p="md"
>
  <Box flex="1" p="md">Item 1</Box>
  <Box flex="1" p="md">Item 2</Box>
  <Box flex="1" p="md">Item 3</Box>
</Box>`;
const respSpacingCode = `<Box p={{ default: 'sm', md: 24, xl: '2rem' }}>Padding grows at wider breakpoints.</Box>`;

const cardJsx = `<Box display="flex" flexDirection={direction} gap="md" p="lg" maxWidth={520}>
  <Box flex="1" p="md">Header</Box>
  <Box flex="2" p="md">Body content that moves from stacked to side-by-side at md.</Box>
</Box>`;
const cardResponsive = `const direction = { default: 'column', md: 'row' };`;
const cardFiles: SampleFile[] = [
  { name: 'Card.tsx', code: cardJsx },
  { name: 'responsive.ts', code: cardResponsive },
];

export const Responsive: Story = () => (
  <Stack>
    <div style={legend}>
      <strong>Every style prop accepts a responsive object. Resize the viewport to see the values change.</strong>
      <ul>
        <li>
          <code>default</code> — base / fallback
        </li>
        <li>
          <code>xs</code> ≤ 599 · <code>sm</code> 600–899 · <code>md</code> 900–1199 · <code>lg</code> 1200–1535 ·{' '}
          <code>xl</code> ≥ 1536 (px)
        </li>
      </ul>
      <em>
        A breakpoint with no value falls back to <code>default</code>, not the next-smaller one.
      </em>
    </div>

    <Sample title="Responsive width (mixes string units and numeric pixels)" code={respWidthCode}>
      <Box width={responsiveWidth} p="md" style={outline}>
        I resize with the viewport.
      </Box>
    </Sample>

    <Sample title="Stack, then row" code={respLayoutCode}>
      <Box display={responsiveDisplay} flexDirection={responsiveDirection} gap="md" p="md" style={panel}>
        <Box p="md" flex="1" style={fill}>
          Item 1
        </Box>
        <Box p="md" flex="1" style={fill}>
          Item 2
        </Box>
        <Box p="md" flex="1" style={fill}>
          Item 3
        </Box>
      </Box>
    </Sample>

    <Sample title="Responsive spacing (tokens, numeric pixels, and CSS lengths)" code={respSpacingCode}>
      <Box p={responsivePadding} style={outline}>
        Padding grows at wider breakpoints.
      </Box>
    </Sample>

    <Sample title="Composed — a card that reflows at md" code={cardFiles}>
      <Box display="flex" flexDirection={responsiveDirection} gap="md" p="lg" maxWidth={520} style={panel}>
        <Box p="md" flex="1" style={fill}>
          Header
        </Box>
        <Box p="md" flex="2" style={fill}>
          Body content that moves from stacked to side-by-side at md.
        </Box>
      </Box>
    </Sample>
  </Stack>
);
Responsive.storyName = 'Responsive';

const outerPadding = { md: 5 };
const innerPadding = { md: 'sm' };
const middlePadding = { md: '5%' };
const nestingCode = `const outerPadding = { md: 100 };
const middlePadding = { md: '50%' };
const innerPadding = { md: 'sm' };

<Box p={outerPadding}>
  <Box p={middlePadding}>
    <Box p={innerPadding}>A box</Box>
  </Box>
</Box>`;

export const Nesting: Story = () => (
  <Stack>
    <p>
      Spacing accepts tokens, numeric pixels, or CSS strings. At <code>md</code> (900–1199 px), the outer box uses 100
      px, the middle box uses 50% of its containing block’s width, and the inner box uses the <code>sm</code> token.
    </p>
    <Sample title="Nested responsive padding with mixed spacing values" code={nestingCode}>
      <Box p={outerPadding} style={outline}>
        <Box p={middlePadding} style={panel}>
          <Box p={innerPadding} style={fill}>
            A box
          </Box>
        </Box>
      </Box>
    </Sample>
  </Stack>
);
Nesting.storyName = 'Nesting';
