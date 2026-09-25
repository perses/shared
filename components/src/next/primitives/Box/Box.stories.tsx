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

import { Box } from './Box';
import type { SpacingToken } from './Box';

export const BasicBox: Story = () => (
  <Box p="md" style={{ border: '1px solid #ccc' }}>
    This is a basic box with padding.
  </Box>
);
BasicBox.storyName = 'Basic Box';

export const DisplayVariations: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <div>
      <h3>Display: block</h3>
      <Box display="block" p="md" style={{ border: '1px solid #ccc' }}>
        Block box
      </Box>
    </div>
    <div>
      <h3>Display: flex</h3>
      <Box display="flex" gap="md" p="md" style={{ border: '1px solid #ccc' }}>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Item 1
        </Box>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Item 2
        </Box>
      </Box>
    </div>
    <div>
      <h3>Display: inline-block</h3>
      <Box display="inline-block" p="md" style={{ border: '1px solid #ccc', marginRight: '1rem' }}>
        Inline 1
      </Box>
      <Box display="inline-block" p="md" style={{ border: '1px solid #ccc' }}>
        Inline 2
      </Box>
    </div>
  </div>
);
DisplayVariations.storyName = 'Display Variations';

export const SpacingTokens: Story = () => {
  const tokens: SpacingToken[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3>Padding Tokens</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tokens.map((token) => (
            <Box key={`p-${token}`} p={token} style={{ border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
              p={'{token}'}: {token}
            </Box>
          ))}
        </div>
      </div>

      <div>
        <h3>Margin Tokens</h3>
        <div style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
          {tokens.map((token) => (
            <Box key={`m-${token}`} m={token} style={{ border: '1px solid #ccc', backgroundColor: '#fff' }}>
              m={'{token}'}: {token}
            </Box>
          ))}
        </div>
      </div>
    </div>
  );
};
SpacingTokens.storyName = 'Spacing Tokens';

export const DirectionalSpacing: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <div>
      <h3>Horizontal Padding (px)</h3>
      <Box px="lg" py="sm" style={{ border: '1px solid #ccc' }}>
        Large horizontal, small vertical padding
      </Box>
    </div>

    <div>
      <h3>Vertical Padding (py)</h3>
      <Box px="sm" py="lg" style={{ border: '1px solid #ccc' }}>
        Small horizontal, large vertical padding
      </Box>
    </div>

    <div>
      <h3>Directional Margins (mx, my)</h3>
      <div style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
        <Box mx="lg" my="md" style={{ border: '1px solid #ccc', backgroundColor: '#fff' }}>
          Large horizontal, medium vertical margin
        </Box>
      </div>
    </div>
  </div>
);
DirectionalSpacing.storyName = 'Directional Spacing';

export const FlexLayout: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <div>
      <h3>Flex Direction: row (default)</h3>
      <Box display="flex" flexDirection="row" gap="md" p="md" style={{ border: '1px solid #ccc' }}>
        <Box p="md" style={{ backgroundColor: '#eee', flex: '1' }}>
          Item 1
        </Box>
        <Box p="md" style={{ backgroundColor: '#eee', flex: '1' }}>
          Item 2
        </Box>
        <Box p="md" style={{ backgroundColor: '#eee', flex: '1' }}>
          Item 3
        </Box>
      </Box>
    </div>

    <div>
      <h3>Flex Direction: column</h3>
      <Box display="flex" flexDirection="column" gap="md" p="md" style={{ border: '1px solid #ccc' }}>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Item 1
        </Box>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Item 2
        </Box>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Item 3
        </Box>
      </Box>
    </div>

    <div>
      <h3>Align Items: center</h3>
      <Box display="flex" gap="md" alignItems="center" p="md" style={{ border: '1px solid #ccc', minHeight: '100px' }}>
        <Box style={{ backgroundColor: '#eee', width: '80px' }}>Short</Box>
        <Box style={{ backgroundColor: '#eee', padding: '1rem' }}>
          This is taller
          <br />
          content
        </Box>
      </Box>
    </div>

    <div>
      <h3>Justify Content: space-between</h3>
      <Box display="flex" justifyContent="space-between" p="md" style={{ border: '1px solid #ccc' }}>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Left
        </Box>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Center
        </Box>
        <Box p="md" style={{ backgroundColor: '#eee' }}>
          Right
        </Box>
      </Box>
    </div>
  </div>
);
FlexLayout.storyName = 'Flex Layout';

export const Responsive: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <h3>Combining Multiple Props</h3>
    <Box
      display={{ default: 'flex', xs: 'block' }}
      flexDirection="column"
      gap="lg"
      p={{ default: 'lg', xs: 'sm' }}
      m="md"
      style={{
        border: '2px solid #0066cc',
        backgroundColor: '#f0f7ff',
        borderRadius: '4px',
        maxWidth: '500px',
      }}
    >
      <Box display="flex" gap="md" alignItems="center">
        <Box p="md" style={{ backgroundColor: '#fff', flex: '1' }}>
          Header
        </Box>
        <Box p="md" style={{ backgroundColor: '#fff' }}>
          Badge
        </Box>
      </Box>

      <Box p="md" style={{ backgroundColor: '#fff' }}>
        <p>This is the main content of the box component.</p>
        <p>It demonstrates how multiple props work together.</p>
      </Box>

      <Box display="flex" gap="md">
        <Box p="md" style={{ backgroundColor: '#fff', flex: '1' }}>
          Cancel
        </Box>
        <Box p="md" style={{ backgroundColor: '#fff', flex: '1' }}>
          Submit
        </Box>
      </Box>
    </Box>
  </div>
);
Responsive.storyName = 'Combined Props';

export const ZeroSpacing: Story = () => (
  <Box p="0" style={{ border: '1px solid #ccc' }}>
    This box has zero padding (no space inside border).
  </Box>
);
ZeroSpacing.storyName = 'Zero Spacing';

export const Sizing: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <div>
      <h3>Fixed Width and Height</h3>
      <Box width="200px" height="100px" style={{ border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
        200px x 100px
      </Box>
    </div>

    <div>
      <h3>Percentage Width</h3>
      <div style={{ border: '1px dashed #999', padding: '1rem' }}>
        <Box width="50%" height="60px" style={{ border: '1px solid #ccc', backgroundColor: '#eee' }}>
          50% width
        </Box>
      </div>
    </div>

    <div>
      <h3>Width Only (height determined by content)</h3>
      <Box width="300px" p="md" style={{ border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
        This box has a fixed width of 300px, but its height grows to fit the content inside it.
      </Box>
    </div>
  </div>
);
Sizing.storyName = 'Sizing';
