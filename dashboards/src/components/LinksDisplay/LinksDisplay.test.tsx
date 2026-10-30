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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { VariableProvider } from '../../context';
import { renderWithContext } from '../../test';
import { LinksDisplay } from './LinksDisplay';

const testTheme = createTheme({
  transitions: { create: () => 'none' },
});

const multiLinks: Link[] = [
  { name: 'Link A', url: '/explore?q=stack', targetBlank: true },
  { name: 'Link B', url: '/explore?q=pod', targetBlank: true },
  { name: 'Link C', url: '/explore?q=service', targetBlank: true },
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
  it('opens a multi-link menu', async () => {
    renderLinks(<LinksDisplay links={multiLinks} variant="panel" />);

    userEvent.click(screen.getByRole('button', { name: 'Panel-links' }));

    expect(await screen.findByRole('menuitem', { name: 'Link A' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Link B' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Link C' })).toBeInTheDocument();
  });

  it('uses a unique button id for each instance', () => {
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
