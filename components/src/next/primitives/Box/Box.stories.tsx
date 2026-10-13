// oxlint-disable react-perf/jsx-no-new-object-as-prop
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
import { Box } from './Box';
import type { Responsive as ResponsiveValue, SpacingToken } from './Box';

// Box-demo chrome (not part of the Box API). The Sample/Stack scaffolding lives in stories/Sample.
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' };
const outline: CSSProperties = { border: '1px solid #ccc', background: '#f5f5f5' };
const fill: CSSProperties = { background: '#dfe7ef' };
const panel: CSSProperties = { border: '2px solid #0066cc', background: '#f0f7ff', borderRadius: 4 };
const legend: CSSProperties = {
  background: '#f5f5f5',
  borderRadius: 4,
  padding: '1rem',
  fontSize: '0.875rem',
  lineHeight: 1.6,
};

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Box</code> is a layout primitive. It accepts responsive style props grouped into categories — spacing (
      <code>p</code>, <code>m</code>, <code>gap</code>), sizing (<code>width</code>…), flexbox (
      <code>flexDirection</code>
      …) and display (<code>display</code>, <code>overflow</code>) — plus any native <code>div</code> attribute.
    </p>
    <Sample title="Minimal usage" code='<Box p="md">…</Box>'>
      <Box p="md" style={outline}>
        A box with md padding.
      </Box>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const spacingScale: SpacingToken[] = ['0', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

export const Spacing: Story = () => (
  <Stack>
    <Sample title="Padding scale (including 0)" code='p="0" | "xs" … "4xl"'>
      <div style={row}>
        {spacingScale.map((token) => (
          <Box key={token} p={token} style={outline}>
            <span style={fill}>p={token}</span>
          </Box>
        ))}
      </div>
    </Sample>

    <Sample title="Directional padding" code='px="lg" py="sm"'>
      <Box px="lg" py="sm" style={outline}>
        <span style={fill}>horizontal lg, vertical sm</span>
      </Box>
    </Sample>

    <Sample title="Directional margin" code='mx="lg" my="md"'>
      <div style={{ background: '#eee' }}>
        <Box mx="lg" my="md" style={outline}>
          offset from its container
        </Box>
      </div>
    </Sample>

    <Sample title="Gap between flex children" code='display="flex" gap="md"'>
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

export const Sizing: Story = () => (
  <Stack>
    <Sample title="Fixed size (a number means pixels)" code="width={240} height={80}">
      <Box width={240} height={80} p="sm" style={outline}>
        240 × 80
      </Box>
    </Sample>

    <Sample title="Relative & calc (strings carry their own units)" code='width="50%"  •  width="calc(100% - 2rem)"'>
      <div style={{ border: '1px dashed #999', padding: '1rem' }}>
        <Box width="50%" p="sm" style={outline}>
          width 50%
        </Box>
      </div>
    </Sample>

    <Sample title="Min / max constraints" code="minWidth / maxWidth / minHeight / maxHeight">
      <Box maxWidth={320} minHeight={96} p="md" style={outline}>
        maxWidth 320, minHeight 96 — text wraps within the max width and the box never shrinks below the min height.
      </Box>
    </Sample>
  </Stack>
);
Sizing.storyName = 'Sizing';

export const Layout: Story = () => (
  <Stack>
    <Sample title="display" code='display="flex" (also "block", "inline-block", "grid", "none")'>
      <Box display="flex" gap="sm" p="sm" style={outline}>
        <Box p="sm" style={fill}>
          flex
        </Box>
        <Box p="sm" style={fill}>
          children
        </Box>
      </Box>
    </Sample>

    <Sample title="flexDirection" code='flexDirection="column"'>
      <Box display="flex" flexDirection="column" gap="sm" p="sm" style={outline}>
        <Box p="sm" style={fill}>
          1
        </Box>
        <Box p="sm" style={fill}>
          2
        </Box>
      </Box>
    </Sample>

    <Sample title="alignItems + justifyContent" code='alignItems="center" justifyContent="space-between"'>
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

    <Sample title="flex (grow / shrink / basis)" code='flex="1"  vs  flex="2"'>
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
const responsivePadding: ResponsiveValue<SpacingToken> = { default: 'sm', md: 'lg', xl: '4xl' };

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

    <Sample
      title="Responsive width (mixes string units and numeric pixels)"
      code="width={{ default: '100%', sm: '80%', md: 400, lg: 'calc(30em + 4px)' }}"
    >
      <Box width={responsiveWidth} p="md" style={outline}>
        I resize with the viewport.
      </Box>
    </Sample>

    <Sample
      title="Stack, then row"
      code="display={{ default: 'block', md: 'flex' }} flexDirection={{ default: 'column', md: 'row' }}"
    >
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

    <Sample title="Responsive spacing" code="p={{ default: 'sm', md: 'lg', xl: '4xl' }}">
      <Box p={responsivePadding} style={outline}>
        Padding grows at wider breakpoints.
      </Box>
    </Sample>

    <Sample title="Composed — a card that reflows at md" code="several props together">
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
