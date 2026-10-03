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

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DataQueriesProvider, TimeRangeProviderBasic } from '@perses-dev/plugin-system';
import type { Link } from '@perses-dev/spec';
import { fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import { VariableProvider } from '../../context';
import { renderWithContext } from '../../test';
import { LinksDisplay } from './LinksDisplay';

const testTheme = createTheme({
  transitions: { create: () => 'none' },
});

const multiLinks: Link[] = [
  { name: '[Explore] By Stack', url: '/explore?q=stack', targetBlank: true },
  { name: '[Explore] By Pod', url: '/explore?q=pod', targetBlank: true },
  { name: '[Explore] By Service', url: '/explore?q=service', targetBlank: true },
  { name: '[Explore] By Node', url: '/explore?q=node', targetBlank: true },
  { name: 'ACS system details', url: '/d/acs', targetBlank: true },
  { name: '[Explore] By Namespace', url: '/explore?q=ns', targetBlank: true },
  { name: '[Explore] By Phase', url: '/explore?q=phase', targetBlank: true },
];

function renderLinks(ui: ReactElement): ReturnType<typeof renderWithContext> {
  return renderWithContext(
    <ThemeProvider theme={testTheme}>
      <TimeRangeProviderBasic initialTimeRange={{ pastDuration: '1h' }}>
        <VariableProvider initialVariableDefinitions={[]}>
          <DataQueriesProvider definitions={[]}>{ui}</DataQueriesProvider>
        </VariableProvider>
      </TimeRangeProviderBasic>
    </ThemeProvider>,
  );
}

describe('LinksDisplay', () => {
  it('opens a multi-link menu and lists all link names (panel variant)', async (): Promise<void> => {
    renderLinks(<LinksDisplay links={multiLinks} variant="panel" />);

    const trigger = screen.getByRole('button', { name: /panel-links/i });
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    for (const link of multiLinks) {
      expect(await screen.findByText(link.name!)).toBeInTheDocument();
    }
  });

  it('uses unique button ids so multiple layouts do not collide', (): void => {
    const { container } = renderLinks(
      <>
        <LinksDisplay links={multiLinks} variant="panel" />
        <LinksDisplay links={multiLinks} variant="panel" />
      </>,
    );
    const buttons = container.querySelectorAll('button[id^="panel-links-button-"]');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.id).not.toBe(buttons[1]?.id);
  });
});
