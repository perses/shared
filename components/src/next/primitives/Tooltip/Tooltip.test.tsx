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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    render(
      <Tooltip title="Helpful text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  it('does not render the tooltip content until hovered', () => {
    render(
      <Tooltip title="Helpful text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByText('Helpful text')).not.toBeInTheDocument();
  });

  it('shows the tooltip content on hover', async () => {
    render(
      <Tooltip title="Helpful text" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
    await waitFor(() => expect(screen.getByText('Helpful text')).toBeInTheDocument());
  });

  it('applies the ps-Tooltip class to the popup', async () => {
    render(
      <Tooltip title="Helpful text" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Hover me' }));
    await waitFor(() => {
      const popup = screen.getByText('Helpful text').closest('.ps-Tooltip');
      expect(popup).toBeInTheDocument();
    });
  });

  it('renders children unwrapped when title is empty', () => {
    render(
      <Tooltip title="">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
