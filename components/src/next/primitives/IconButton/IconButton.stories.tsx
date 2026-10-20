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
import type { ComponentType, CSSProperties, SVGProps } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import type { ButtonVariant } from '../Button';
import * as Icons from '../Icon/icons';
import { CloseIcon } from '../Icon/icons';
import type { ColorVariant, Size, Status } from '../types';
import { IconButton } from './IconButton';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' };
const rowLabel: CSSProperties = { width: '4rem', fontSize: '0.75rem' };
const sizeGroups: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const variantRows: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const sizeHeading: CSSProperties = { marginBottom: '0.5rem' };
const stateDivider: CSSProperties = {
  borderLeft: '1px solid var(--perses-border-default)',
  marginLeft: '0.25rem',
  paddingLeft: '0.75rem',
};

const allIcons = Object.entries(Icons) as Array<[string, ComponentType<SVGProps<SVGSVGElement>>]>;
const gallery: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
  gap: '1rem',
};
const galleryItem: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const galleryIcon: CSSProperties = { fontSize: '1.25rem' };
const galleryLabel: CSSProperties = { fontSize: '0.75rem' };

const variants: ButtonVariant[] = ['solid', 'outline', 'ghost'];
const colors: Array<ColorVariant | Status> = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];

const basicCode = `<IconButton aria-label="Close"><CloseIcon /></IconButton>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>IconButton</code> is a button that shows only an icon, so it needs an <code>aria-label</code>. It accepts
      responsive style props — spacing (<code>p</code>, <code>m</code>), sizing (<code>width</code>…) and display (
      <code>display</code>) — plus any native <code>button</code> attribute. Those style props behave exactly as
      documented on <code>Box</code>.
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
<IconButton aria-label="Close" variant="outline" color="error" size="lg"><CloseIcon /></IconButton>

// The trailing column shows the disabled state.
<IconButton aria-label="Close" variant="outline" disabled><CloseIcon /></IconButton>`;

export const AllVariantsAndColors: Story = () => (
  <Stack>
    <Sample title="Variants, colors and sizes — the last column shows the disabled state" code={variantsCode}>
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
                  <span style={stateDivider}>
                    <IconButton
                      aria-label={`${variant} disabled close`}
                      variant={variant}
                      color="primary"
                      size={size}
                      disabled
                    >
                      <CloseIcon />
                    </IconButton>
                  </span>
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

const iconsCode = `import * as Icons from '../Icon/icons';

// Any icon from the icon set can be the child
<IconButton aria-label="Add" title="AddIcon"><Icons.AddIcon /></IconButton>`;

export const IconGallery: Story = () => (
  <Stack>
    <Sample title="All icons" code={iconsCode}>
      <div style={gallery}>
        {allIcons.map(([name, Icon]) => (
          <div key={name} style={galleryItem}>
            <IconButton aria-label={name} title={name}>
              <Icon style={galleryIcon} />
            </IconButton>
            <span style={galleryLabel}>{name}</span>
          </div>
        ))}
      </div>
    </Sample>
  </Stack>
);
IconGallery.storyName = 'Icons';
