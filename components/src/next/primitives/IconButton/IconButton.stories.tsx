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
import type { ButtonVariant } from '../Button/Button';
import { CloseIcon } from '../Icon/icons';
import type { Responsive as ResponsiveValue } from '../system/responsive';
import type { SpacingToken } from '../system/spacing';
import type { ColorVariant, Size, Status } from '../types';
import { IconButton } from './IconButton';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' };
const rowLabel: CSSProperties = { width: '4rem', fontSize: '0.75rem' };
const dashed: CSSProperties = { border: '1px dashed var(--perses-border-default)', padding: '1rem' };
const sizeGroups: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const variantRows: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const sizeHeading: CSSProperties = { marginBottom: '0.5rem' };

const variants: ButtonVariant[] = ['solid', 'outline', 'ghost'];
const colors: Array<ColorVariant | Status> = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];

const responsivePadding: ResponsiveValue<SpacingToken> = { default: 'xs', md: 'md', xl: 'xl' };
const responsiveWidth: ResponsiveValue<CSSProperties['width']> = { default: 32, md: 64 };
const responsiveDisplay: ResponsiveValue<CSSProperties['display']> = {
  default: 'none',
  md: 'inline-flex',
  lg: 'inline-flex',
  xl: 'inline-flex',
};

const basicCode = `<IconButton aria-label="Close"><CloseIcon /></IconButton>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>IconButton</code> is a button that shows only an icon, so it needs an <code>aria-label</code>. It accepts
      responsive style props — spacing (<code>p</code>, <code>m</code>), sizing (<code>width</code>…) and display (
      <code>display</code>) — plus any native <code>button</code> attribute.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <IconButton aria-label="Close">
        <CloseIcon />
      </IconButton>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `// variant: 'solid' | 'outline' | 'ghost'
// color:   'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
// size:    'xs' | 'sm' | 'md' | 'lg'
<IconButton aria-label="Close" variant="outline" color="error" size="lg"><CloseIcon /></IconButton>`;

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
                    <IconButton
                      key={color}
                      aria-label={`${variant} ${color} close`}
                      variant={variant}
                      color={color}
                      size={size}
                    >
                      <CloseIcon />
                    </IconButton>
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

const disabledCode = `<IconButton aria-label="Close" variant="solid" disabled><CloseIcon /></IconButton>
<IconButton aria-label="Close" variant="outline" disabled><CloseIcon /></IconButton>
<IconButton aria-label="Close" variant="ghost" disabled><CloseIcon /></IconButton>`;

export const States: Story = () => (
  <Stack>
    <Sample title="Disabled" code={disabledCode}>
      <div style={row}>
        <IconButton aria-label="Solid disabled close" variant="solid" color="primary" disabled>
          <CloseIcon />
        </IconButton>
        <IconButton aria-label="Outline disabled close" variant="outline" color="primary" disabled>
          <CloseIcon />
        </IconButton>
        <IconButton aria-label="Ghost disabled close" variant="ghost" color="primary" disabled>
          <CloseIcon />
        </IconButton>
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const paddingCode = `// p accepts any spacing token: 0, xs, sm, md, lg, xl, 2xl, 3xl, 4xl
<IconButton aria-label="Close" p="xl"><CloseIcon /></IconButton>`;
const marginCode = `<IconButton aria-label="Close" mx="xl" my="md"><CloseIcon /></IconButton>`;

export const Spacing: Story = () => (
  <Stack>
    <Sample title="Padding (p)" code={paddingCode}>
      <IconButton aria-label="Close" p="xl">
        <CloseIcon />
      </IconButton>
    </Sample>

    <Sample title="Directional margin (mx, my)" code={marginCode}>
      <div style={dashed}>
        <IconButton aria-label="Close" mx="xl" my="md">
          <CloseIcon />
        </IconButton>
      </div>
    </Sample>
  </Stack>
);
Spacing.storyName = 'Spacing';

const sizeCode = `// A number means pixels
<IconButton aria-label="Close" width={64} height={64}><CloseIcon /></IconButton>`;
const minMaxCode = `<IconButton aria-label="Close" minWidth={48} minHeight={48}><CloseIcon /></IconButton>`;

export const Sizing: Story = () => (
  <Stack>
    <Sample title="Fixed width and height — a number means pixels" code={sizeCode}>
      <IconButton aria-label="Close" width={64} height={64}>
        <CloseIcon />
      </IconButton>
    </Sample>

    <Sample title="Min constraints" code={minMaxCode}>
      <IconButton aria-label="Close" minWidth={48} minHeight={48}>
        <CloseIcon />
      </IconButton>
    </Sample>
  </Stack>
);
Sizing.storyName = 'Sizing';

const responsiveSpacingCode = `// Resize the window: padding grows with the breakpoint.
// Always include \`default\` — breakpoints without a value fall back to the browser default.
<IconButton aria-label="Close" p={{ default: 'xs', md: 'md', xl: 'xl' }}><CloseIcon /></IconButton>`;
const responsiveWidthCode = `<IconButton aria-label="Close" width={{ default: 32, md: 64 }}><CloseIcon /></IconButton>`;
const responsiveDisplayCode = `// Hidden below md, shown (as inline-flex) from md up.
<IconButton aria-label="Close" display={{ default: 'none', md: 'inline-flex', lg: 'inline-flex', xl: 'inline-flex' }}>
  <CloseIcon />
</IconButton>`;

export const Responsive: Story = () => (
  <Stack>
    <ResponsiveBreakpointsNote />
    <Sample title="Responsive spacing" code={responsiveSpacingCode}>
      <IconButton aria-label="Close" p={responsivePadding}>
        <CloseIcon />
      </IconButton>
    </Sample>

    <Sample title="Responsive width" code={responsiveWidthCode}>
      <IconButton aria-label="Close" width={responsiveWidth}>
        <CloseIcon />
      </IconButton>
    </Sample>

    <Sample title="Responsive display" code={responsiveDisplayCode}>
      <IconButton aria-label="Close" display={responsiveDisplay}>
        <CloseIcon />
      </IconButton>
    </Sample>
  </Stack>
);
Responsive.storyName = 'Responsive';
