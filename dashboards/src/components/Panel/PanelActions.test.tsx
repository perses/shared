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
import { Link } from '@perses-dev/spec';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  // Regression test for https://github.com/perses/perses/issues/3654
  //
  // On narrow panels, PanelActions collapses actions (including the panel
  // links button) into this OverflowMenu. LinksDisplay itself opens a nested
  // MUI <Menu> on click. OverflowMenu's content wrapper has onClick={handleClose}
  // so that a click on a one-shot action (edit/delete/etc.) closes the overflow
  // afterwards. But a click on the *nested* links button bubbles up to that
  // same handler, closing (and unmounting) OverflowMenu's Popper before the
  // links Menu can render.
  it('opens the nested links menu when the links button is clicked inside it', async () => {
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

    userEvent.click(screen.getByRole('button', { name: 'show panel actions for My Panel' }));
    await screen.findByRole('button', { name: 'Panel-links' });
    userEvent.click(screen.getByRole('button', { name: 'Panel-links' }));

    expect(await screen.findByRole('menuitem', { name: 'Link A' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Link B' })).toBeInTheDocument();
  });
});
