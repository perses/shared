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
import { Button, ButtonVariant, ButtonColor, ButtonSize } from './Button';

const variants: ButtonVariant[] = ['solid', 'outline', 'ghost'];
const colors: ButtonColor[] = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

export const AllVariantsAndColors: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    {sizes.map((size) => (
      <div key={size}>
        <h3 style={{ marginBottom: '0.5rem' }}>Size: {size}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {variants.map((variant) => (
            <div key={variant} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ width: '4rem', fontSize: '0.75rem' }}>{variant}</span>
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
);
AllVariantsAndColors.storyName = 'All Variants & Colors';

export const Disabled: Story = () => (
  <div style={{ display: 'flex', gap: '1rem' }}>
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
);
