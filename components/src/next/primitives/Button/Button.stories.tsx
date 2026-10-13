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

import { ResponsiveBreakpointsNote } from '../../stories/ResponsiveBreakpointsNote';
import { Sample, Stack } from '../../stories/Sample';
import type { Responsive as ResponsiveValue } from '../system/responsive';
import type { SpacingToken } from '../system/spacing';
import type { ColorVariant, Size, Status } from '../types';
import type { ButtonVariant } from './Button';
import { Button } from './Button';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' };
const rowLabel: CSSProperties = { width: '4rem', fontSize: '0.75rem' };
const dashed: CSSProperties = { border: '1px dashed var(--perses-border-default)', padding: '1rem' };
const dashedColumn: CSSProperties = { ...dashed, display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const sizeGroups: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const variantRows: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const sizeHeading: CSSProperties = { marginBottom: '0.5rem' };

const variants: ButtonVariant[] = ['solid', 'outline', 'ghost'];
const colors: Array<ColorVariant | Status> = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];

const responsivePadding: ResponsiveValue<SpacingToken> = { default: 'sm', md: 'lg', xl: '3xl' };
const responsiveWidth: ResponsiveValue<CSSProperties['width']> = { default: '100%', md: 240 };
const responsiveDisplay: ResponsiveValue<CSSProperties['display']> = {
  default: 'none',
  md: 'inline-flex',
  lg: 'inline-flex',
  xl: 'inline-flex',
};

const basicCode = `<Button>Click me</Button>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Button</code> triggers an action. It accepts responsive style props — spacing (<code>p</code>,{' '}
      <code>m</code>, <code>gap</code>), sizing (<code>width</code>…) and display (<code>display</code>,{' '}
      <code>overflow</code>) — plus any native <code>button</code> attribute.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Button>Click me</Button>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `// variant: 'solid' | 'outline' | 'ghost'
// color:   'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
// size:    'sm' | 'md' | 'lg'
<Button variant="outline" color="error" size="lg">Delete</Button>`;

export const AllVariantsAndColors: Story = () => (
  <Stack>
    <Sample title="Variants, colors and sizes" code={variantsCode}>
      <div style={sizeGroups}>
        {sizes.map((size) => (
          <div key={size}>
            <h3 style={sizeHeading}>Size: {size}</h3>
            <div style={variantRows}>
              {variants.map((variant) => (
                <div key={variant} style={row}>
                  <span style={rowLabel}>{variant}</span>
                  {colors.map((color) => (
                    <Button key={color} variant={variant} color={color} size={size}>
                      {color}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sample>
  </Stack>
);
AllVariantsAndColors.storyName = 'Variants';

const disabledCode = `<Button variant="solid" disabled>Solid Disabled</Button>
<Button variant="outline" disabled>Outline Disabled</Button>
<Button variant="ghost" disabled>Ghost Disabled</Button>`;
const loadingCode = `// loading shows a spinner, sets aria-busy and disables the button
<Button variant="solid" loading>Saving…</Button>
<Button variant="outline" loading>Submitting…</Button>
<Button variant="ghost" loading>Loading…</Button>`;

export const States: Story = () => (
  <Stack>
    <Sample title="Disabled" code={disabledCode}>
      <div style={row}>
        <Button variant="solid" color="primary" disabled>
          Solid Disabled
        </Button>
        <Button variant="outline" color="primary" disabled>
          Outline Disabled
        </Button>
        <Button variant="ghost" color="primary" disabled>
          Ghost Disabled
        </Button>
      </div>
    </Sample>

    <Sample title="Loading" code={loadingCode}>
      <div style={row}>
        <Button variant="solid" color="primary" loading>
          Saving…
        </Button>
        <Button variant="outline" color="primary" loading>
          Submitting…
        </Button>
        <Button variant="ghost" color="primary" loading>
          Loading…
        </Button>
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const paddingCode = `// p accepts any spacing token: 0, xs, sm, md, lg, xl, 2xl, 3xl, 4xl
<Button p="xl">Extra padding</Button>`;
const paddingDirCode = `<Button px="3xl" py="xs">horizontal 3xl, vertical xs</Button>`;
const marginCode = `<Button mx="xl" my="md">offset from its container</Button>`;
const gapCode = `// gap is the space between the spinner and the label
<Button loading gap="xl">Saving…</Button>`;

export const Spacing: Story = () => (
  <Stack>
    <Sample title="Padding (p)" code={paddingCode}>
      <Button p="xl">Extra padding</Button>
    </Sample>

    <Sample title="Directional padding (px, py)" code={paddingDirCode}>
      <Button px="3xl" py="xs">
        horizontal 3xl, vertical xs
      </Button>
    </Sample>

    <Sample title="Directional margin (mx, my)" code={marginCode}>
      <div style={dashed}>
        <Button mx="xl" my="md">
          offset from its container
        </Button>
      </div>
    </Sample>

    <Sample title="Gap between spinner and label" code={gapCode}>
      <Button loading gap="xl">
        Saving…
      </Button>
    </Sample>
  </Stack>
);
Spacing.storyName = 'Spacing';

const widthCode = `<Button width={240}>Fixed 240px wide</Button>
<Button width="100%">Full width</Button>`;
const minMaxCode = `<Button minWidth={160} maxWidth={200}>minWidth 160, maxWidth 200</Button>`;

export const Sizing: Story = () => (
  <Stack>
    <Sample title="Fixed and relative width — a number means pixels" code={widthCode}>
      <div style={dashedColumn}>
        <Button width={240}>Fixed 240px wide</Button>
        <Button width="100%">Full width</Button>
      </div>
    </Sample>

    <Sample title="Min / max constraints" code={minMaxCode}>
      <Button minWidth={160} maxWidth={200}>
        minWidth 160, maxWidth 200
      </Button>
    </Sample>
  </Stack>
);
Sizing.storyName = 'Sizing';

const responsiveSpacingCode = `// Resize the window: padding grows with the breakpoint.
// Always include \`default\` — breakpoints without a value fall back to the browser default.
<Button p={{ default: 'sm', md: 'lg', xl: '3xl' }}>Padding changes per breakpoint</Button>`;
const responsiveWidthCode = `// Full width on small screens, fixed width from md up.
<Button width={{ default: '100%', md: 240 }}>Width changes per breakpoint</Button>`;
const responsiveDisplayCode = `// Hidden below md, shown (as inline-flex) from md up.
<Button display={{ default: 'none', md: 'inline-flex', lg: 'inline-flex', xl: 'inline-flex' }}>Visible from md up</Button>`;

export const Responsive: Story = () => (
  <Stack>
    <ResponsiveBreakpointsNote />
    <Sample title="Responsive spacing" code={responsiveSpacingCode}>
      <Button p={responsivePadding}>Padding changes per breakpoint</Button>
    </Sample>

    <Sample title="Responsive width" code={responsiveWidthCode}>
      <Button width={responsiveWidth}>Width changes per breakpoint</Button>
    </Sample>

    <Sample title="Responsive display" code={responsiveDisplayCode}>
      <Button display={responsiveDisplay}>Visible from md up</Button>
    </Sample>
  </Stack>
);
Responsive.storyName = 'Responsive';
