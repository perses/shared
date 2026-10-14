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
import type { ColorVariant, Size, Status } from '../types';
import type { ButtonVariant } from './Button';
import { Button } from './Button';

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

const variants: ButtonVariant[] = ['solid', 'outline', 'ghost'];
const colors: Array<ColorVariant | Status> = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];

const basicCode = `<Button>Click me</Button>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Button</code> triggers an action. It accepts responsive style props — spacing (<code>p</code>,{' '}
      <code>m</code>, <code>gap</code>), sizing (<code>width</code>…) and display (<code>display</code>,{' '}
      <code>overflow</code>) — plus any native <code>button</code> attribute. Those style props behave exactly as
      documented on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Button>Click me</Button>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `// variant: 'solid' | 'outline' | 'ghost'
// color:   'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
// size:    'xs' | 'sm' | 'md' | 'lg'
<Button variant="outline" color="error" size="lg">Delete</Button>

// The trailing column shows the disabled state.
<Button variant="outline" disabled>Delete</Button>`;

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
                    <Button key={color} variant={variant} color={color} size={size}>
                      {color}
                    </Button>
                  ))}
                  <span style={stateDivider}>
                    <Button variant={variant} color="primary" size={size} disabled>
                      disabled
                    </Button>
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

const loadingCode = `// loading shows a spinner, sets aria-busy and disables the button
<Button variant="solid" loading>Saving…</Button>
<Button variant="outline" loading>Submitting…</Button>
<Button variant="ghost" loading>Loading…</Button>`;

export const States: Story = () => (
  <Stack>
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
