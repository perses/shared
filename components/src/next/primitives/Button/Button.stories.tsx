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

import { Button } from './Button';
import type { ButtonVariant, ButtonColor, ButtonSize, ButtonProps } from './Button';

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

export const Loading: Story = () => (
  <div style={{ display: 'flex', gap: '1rem' }}>
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
);

const responsiveSize: ButtonProps['size'] = { default: 'md', lg: 'sm', xl: 'sm' };
const responsiveSizeContainerStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const responsiveSizeHintStyle: CSSProperties = { fontSize: '0.75rem', margin: 0 };

// Story-only styling: tint the button and show the active breakpoint so the size change is visible.
const responsiveSizeDemoCss = `
  .responsive-size-demo .ps-Button { --btn-bg: #d97706; --btn-border: #d97706; --btn-bg-hover: #b45309; }
  .responsive-size-demo .responsive-size-demo__label::after { content: ' default / xs–md → size md'; }
  @media (min-width: 1200px) {
    .responsive-size-demo .ps-Button { --btn-bg: #059669; --btn-border: #059669; --btn-bg-hover: #047857; }
    .responsive-size-demo .responsive-size-demo__label::after { content: ' lg / xl → size sm'; }
  }
`;

export const ResponsiveSize: Story = () => (
  <div className="responsive-size-demo" style={responsiveSizeContainerStyle}>
    <style>{responsiveSizeDemoCss}</style>
    <p style={responsiveSizeHintStyle}>
      Resize the viewport: <code>md</code> below 1200px (touch-friendly), <code>sm</code> from 1200px up. The button
      turns orange at <code>md</code> and green at <code>sm</code>.
    </p>
    <p className="responsive-size-demo__label" style={responsiveSizeHintStyle}>
      Active:
    </p>
    <div>
      <Button size={responsiveSize}>Responsive size</Button>
    </div>
  </div>
);
ResponsiveSize.storyName = 'Responsive Size';
