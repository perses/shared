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
import { Button } from './Button';

export const Disabled: Story = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <Button disabled>Disabled Solid</Button>
    <Button variant="outline" disabled>
      Disabled Outline
    </Button>
  </div>
);

const VARIANTS = ['solid', 'outline', 'ghost'] as const;
const COLORS = ['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const labelStyle: React.CSSProperties = {
  textTransform: 'capitalize',
  fontWeight: 500,
  padding: '4px 8px',
  color: 'var(--ladle-color-primary)',
};

export const AllVariantsAndColors: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
    {SIZES.map((size) => (
      <div key={size}>
        <h3 style={{ ...labelStyle, marginBottom: '8px' }}>Size: {size}</h3>
        <table style={{ borderCollapse: 'separate', borderSpacing: '8px' }}>
          <thead>
            <tr>
              <th />
              {COLORS.map((color) => (
                <th key={color} style={labelStyle}>
                  {color}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((variant) => (
              <tr key={variant}>
                <td style={labelStyle}>{variant}</td>
                {COLORS.map((color) => (
                  <td key={color}>
                    <Button size={size} variant={variant} color={color}>
                      {color}
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
);
