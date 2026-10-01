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

import type { Size, Status } from '../types';

import { TextField } from './TextField';

const sizes: Size[] = ['sm', 'md', 'lg'];
const statuses: Status[] = ['error', 'warning', 'success'];

export const Sizes: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {sizes.map((size) => (
      <TextField key={size} label={`Size: ${size}`} placeholder="Type here" size={size} />
    ))}
  </div>
);

export const WithHelperText: Story = () => <TextField label="Name" helperText="Shown to other members of your team" />;

export const StatusVariants: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {statuses.map((status) => (
      <TextField
        key={status}
        label={`Status: ${status}`}
        status={status}
        helperText={`This field has ${status} status`}
        defaultValue="Example"
      />
    ))}
  </div>
);
StatusVariants.storyName = 'Status Variants';

export const FullWidth: Story = () => (
  <div style={{ width: '24rem' }}>
    <TextField label="Description" fullWidth placeholder="Spans the full width of its container" />
  </div>
);

export const Disabled: Story = () => <TextField label="Disabled" disabled defaultValue="Cannot be edited" />;

export const ReadOnlyVariants: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <TextField label="Read-only (default)" readOnly readOnlyVariant="default" defaultValue="Cannot be edited" />
    <TextField label="Read-only (plain)" readOnly readOnlyVariant="plain" defaultValue="Looks like text" />
  </div>
);
ReadOnlyVariants.storyName = 'Read-Only Variants';

export const Multiline: Story = () => (
  <TextField label="Comment" multiline rows={4} placeholder="Write a longer response..." fullWidth />
);

export const WithAdornments: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <TextField
      label="Search"
      placeholder="Search..."
      startAdornment={
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
    />
    <TextField label="Amount" placeholder="0" endAdornment={<span>%</span>} startAdornment={<span>$</span>} />
  </div>
);
