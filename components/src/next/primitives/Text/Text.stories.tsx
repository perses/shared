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

import { Sample, Stack } from '../../stories/Sample';
import { Text } from './Text';

const basicCode = `<Text>Inline text</Text>
<Text as="p" size="sm" color="secondary">Supporting paragraph</Text>
<Text as="strong" weight="bold">Important text</Text>`;
const colorsCode = `<Text color="secondary">Design-system color</Text>
<Text color="#663399">Hex color</Text>
<Text color="rgb(100 50 200 / 80%)">CSS function</Text>
<Text color="var(--perses-text-link)">CSS custom property</Text>
<Text color="currentColor">Current color</Text>`;
const disabledCode = `<Text disabled>Disabled text</Text>
<Text disabled color="error">Disabled error text</Text>
<Text disabled color="#663399">Disabled custom color</Text>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Text</code> controls typography independently of the HTML element. It has no default margins or
      helper-specific width containment. Spacing, sizing and display props behave as on <code>Box</code>.
    </p>
    <Sample title="Text and semantic elements" code={basicCode}>
      <Text>Inline text</Text>
      <Text as="p" size="sm" color="secondary">
        Supporting paragraph
      </Text>
      <Text as="strong" weight="bold">
        Important text
      </Text>
    </Sample>
    <Sample title="Design-system and CSS colors" code={colorsCode}>
      <Text color="secondary">Design-system color</Text>
      <Text color="#663399">Hex color</Text>
      <Text color="rgb(100 50 200 / 80%)">CSS function</Text>
      <Text color="var(--perses-text-link)">CSS custom property</Text>
      <Text color="currentColor">Current color</Text>
    </Sample>
    <Sample title="Font sizes">
      <Text size="xs">Extra small</Text>
      <Text size="sm">Small</Text>
      <Text size="md">Medium</Text>
      <Text size="lg">Large</Text>
      <Text size="xl">Extra large</Text>
      <Text size="2xl">2x large</Text>
      <Text size="3xl">3x large</Text>
      <Text size="4xl">4x large</Text>
    </Sample>
    <Sample title="Font weights and semantic colors">
      <Text weight="light">Light</Text>
      <Text weight="regular">Regular</Text>
      <Text weight="medium">Medium</Text>
      <Text weight="bold">Bold</Text>
      <Text color="secondary">Secondary</Text>

      <Text color="error">Error</Text>
      <Text color="warning">Warning</Text>
      <Text color="success">Success</Text>
      <Text color="info">Information</Text>
    </Sample>
    <Sample title="Disabled text preserves its color" code={disabledCode}>
      <Text disabled>Disabled text</Text>
      <Text disabled color="error">
        Disabled error text
      </Text>
      <Text disabled color="#663399">
        Disabled custom color
      </Text>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';
