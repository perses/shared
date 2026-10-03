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

import { VariableProvider } from '../../context';
import { renderWithContext } from '../../test';
import { LinksDisplay } from '../LinksDisplay';
import { OverflowMenu } from './PanelActions';

const testTheme = createTheme({
  transitions: { create: () => 'none' },
});

const testLinks: Link[] = [
  { url: 'https://example.com/a', name: 'Link A' },
  { url: 'https://example.com/b', name: 'Link B' },
];

describe('OverflowMenu', () => {
  // Regression: nested LinksDisplay must still open when placed inside OverflowMenu
  // (stopPropagation + disablePortal). Menu items may sit under aria-hidden Popper in jsdom.
  it('opens the nested links menu when the links button is clicked inside it', async (): Promise<void> => {
    renderWithContext(
      <ThemeProvider theme={testTheme}>
        <TimeRangeProviderBasic initialTimeRange={{ pastDuration: '1h' }}>
          <VariableProvider initialVariableDefinitions={[]}>
            <DataQueriesProvider definitions={[]}>
              <OverflowMenu title="My Panel">
                <LinksDisplay links={testLinks} variant="panel" />
              </OverflowMenu>
            </DataQueriesProvider>
          </VariableProvider>
        </TimeRangeProviderBasic>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'show panel actions for My Panel' }));
    const linksBtn = await screen.findByRole('button', { name: 'Panel-links' });
    fireEvent.pointerDown(linksBtn);
    fireEvent.click(linksBtn);

    expect(await screen.findByRole('menuitem', { name: 'Link A', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Link B', hidden: true })).toBeInTheDocument();
  });
});
