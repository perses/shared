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
import type { Link, VariableDefinition } from '@perses-dev/spec';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { AnnotationProvider, DashboardCatalogProvider, DashboardProvider, VariableProvider } from '../../context';
import { getTestDashboard, renderWithContext } from '../../test';
import { LinksDisplay } from './LinksDisplay';
import type { TagLinkDashboard } from './tag-links';

const testTheme = createTheme({
  transitions: { create: () => 'none' },
});

const multiLinks: Link[] = [
  { name: 'Link A', url: '/explore?q=stack', targetBlank: true },
  { name: 'Link B', url: '/explore?q=pod', targetBlank: true },
  { name: 'Link C', url: '/explore?q=service', targetBlank: true },
];

function renderLinks(
  ui: ReactElement,
  variableDefinitions: VariableDefinition[] = [],
): ReturnType<typeof renderWithContext> {
  return renderWithContext(
    <ThemeProvider theme={testTheme}>
      <TimeRangeProviderBasic initialTimeRange={{ pastDuration: '1h' }}>
        <VariableProvider initialVariableDefinitions={variableDefinitions}>
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

  describe('link URL sanitization', () => {
    const javascriptUrl = 'javascript:alert(document.domain)';

    it('does not set an href on a dashboard link chip with a javascript: URL', () => {
      renderLinks(
        <LinksDisplay
          links={[
            { name: 'Safe', url: 'https://perses.dev' },
            { name: 'Unsafe', url: javascriptUrl },
          ]}
          variant="dashboard"
        />,
      );

      expect(screen.getByText('Safe').closest('a')).toHaveAttribute('href', 'https://perses.dev');
      expect(screen.getByText('Unsafe').closest('a')).not.toHaveAttribute('href');
    });

    it('does not set an href on a panel link button with a javascript: URL', () => {
      renderLinks(<LinksDisplay links={[{ name: 'Unsafe', url: javascriptUrl }]} variant="panel" />);

      expect(screen.getByRole('button', { name: 'Unsafe' })).not.toHaveAttribute('href');
    });

    it('sets the href on a panel link button with a safe URL', () => {
      renderLinks(<LinksDisplay links={[{ name: 'Safe', url: '/explore' }]} variant="panel" />);

      expect(screen.getByRole('link', { name: 'Safe' })).toHaveAttribute('href', '/explore');
    });

    it('does not set an href on a link menu item with a javascript: URL', async () => {
      renderLinks(
        <LinksDisplay
          links={[
            { name: 'Safe', url: '/explore' },
            { name: 'Unsafe', url: javascriptUrl },
          ]}
          variant="panel"
        />,
      );

      userEvent.click(screen.getByRole('button', { name: 'Panel-links' }));

      expect(await screen.findByRole('menuitem', { name: 'Safe' })).toHaveAttribute('href', '/explore');
      expect(screen.getByRole('menuitem', { name: 'Unsafe' })).not.toHaveAttribute('href');
    });

    it('does not set an href when a variable resolves to a javascript: URL', () => {
      renderLinks(<LinksDisplay links={[{ name: 'Unsafe', url: '$target' }]} variant="dashboard" />, [
        { kind: 'TextVariable', spec: { name: 'target', value: javascriptUrl } },
      ]);

      expect(screen.getByText('Unsafe').closest('a')).not.toHaveAttribute('href');
    });

    it('does not set an href on a javascript: URL when variables are not rendered', () => {
      renderLinks(
        <LinksDisplay links={[{ name: 'Unsafe', url: javascriptUrl, renderVariables: false }]} variant="dashboard" />,
      );

      expect(screen.getByText('Unsafe').closest('a')).not.toHaveAttribute('href');
    });

    it('keeps the interpolated URL when a variable resolves to a safe URL', () => {
      renderLinks(<LinksDisplay links={[{ name: 'Safe', url: '$target/docs' }]} variant="dashboard" />, [
        { kind: 'TextVariable', spec: { name: 'target', value: 'https://perses.dev' } },
      ]);

      expect(screen.getByText('Safe').closest('a')).toHaveAttribute('href', 'https://perses.dev/docs');
    });

    it('explains why a link is disabled when hovering over it', async () => {
      renderLinks(<LinksDisplay links={[{ name: 'Unsafe', url: javascriptUrl }]} variant="dashboard" />);

      userEvent.hover(screen.getByText('Unsafe'));

      expect(
        await screen.findByText(
          `This link is disabled because its URL uses a scheme that is not allowed: ${javascriptUrl}`,
        ),
      ).toBeInTheDocument();
    });

    it('leaves a URL unchanged when keepTime and includeVariables are off', () => {
      renderLinks(<LinksDisplay links={[{ name: 'Docs', url: 'https://perses.dev/docs' }]} variant="dashboard" />, [
        { kind: 'TextVariable', spec: { name: 'env', value: 'prod' } },
      ]);

      expect(screen.getByText('Docs').closest('a')).toHaveAttribute('href', 'https://perses.dev/docs');
    });

    it('appends the time range only when keepTime is set', () => {
      renderLinks(
        <LinksDisplay links={[{ name: 'Docs', url: 'https://perses.dev/docs', keepTime: true }]} variant="dashboard" />,
        [{ kind: 'TextVariable', spec: { name: 'env', value: 'prod' } }],
      );

      expect(screen.getByText('Docs').closest('a')).toHaveAttribute('href', 'https://perses.dev/docs?start=1h');
    });

    it('appends variables only when includeVariables is set', () => {
      renderLinks(
        <LinksDisplay
          links={[{ name: 'Docs', url: 'https://perses.dev/docs', includeVariables: true }]}
          variant="dashboard"
        />,
        [{ kind: 'TextVariable', spec: { name: 'env', value: 'prod' } }],
      );

      expect(screen.getByText('Docs').closest('a')).toHaveAttribute('href', 'https://perses.dev/docs?var-env=prod');
    });

    it('appends the time range and variables when both flags are set', () => {
      renderLinks(
        <LinksDisplay
          links={[{ name: 'Docs', url: 'https://perses.dev/docs', keepTime: true, includeVariables: true }]}
          variant="dashboard"
        />,
        [{ kind: 'TextVariable', spec: { name: 'env', value: 'prod' } }],
      );

      expect(screen.getByText('Docs').closest('a')).toHaveAttribute(
        'href',
        'https://perses.dev/docs?start=1h&var-env=prod',
      );
    });

    it('prevents the opened page from accessing the opener for links opening in a new tab', () => {
      renderLinks(
        <LinksDisplay links={[{ name: 'Docs', url: 'https://perses.dev', targetBlank: true }]} variant="dashboard" />,
      );

      const link = screen.getByText('Docs').closest('a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('tag links', () => {
    const catalog: TagLinkDashboard[] = [
      {
        kind: 'Dashboard',
        metadata: { name: 'Node Stats', project: 'perses', tags: ['ops'] },
        spec: { display: { name: 'Node Stats' } },
      },
      {
        kind: 'Dashboard',
        metadata: { name: 'service detail', project: 'perses', tags: ['ops'] },
        spec: { display: { name: 'Service detail' } },
      },
      { kind: 'Dashboard', metadata: { name: 'other', project: 'perses', tags: ['unrelated'] } },
    ];

    function renderTagLink(link: { name: string; tags: string[]; keepTime?: boolean }): {
      listDashboards: ReturnType<typeof vi.fn>;
    } {
      const listDashboards = vi.fn().mockResolvedValue(catalog);
      renderLinks(
        <AnnotationProvider initialAnnotationSpecs={[]}>
          <DashboardProvider initialState={{ dashboardResource: getTestDashboard() }}>
            <DashboardCatalogProvider listDashboards={listDashboards}>
              <LinksDisplay links={[link]} variant="dashboard" />
            </DashboardCatalogProvider>
          </DashboardProvider>
        </AnnotationProvider>,
      );
      return { listDashboards };
    }

    it('loads matching dashboards when the menu opens', async () => {
      const { listDashboards } = renderTagLink({ name: 'Related', tags: ['ops'] });

      expect(listDashboards).not.toHaveBeenCalled();
      userEvent.click(screen.getByText('Related'));

      expect(await screen.findByRole('menuitem', { name: 'Service detail' })).toHaveAttribute(
        'href',
        '/projects/perses/dashboards/service%20detail',
      );
      expect(screen.queryByRole('menuitem', { name: 'Node Stats' })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'other' })).not.toBeInTheDocument();
      expect(listDashboards).toHaveBeenCalledWith('perses');
    });

    it('keeps the current time range on a tag link when keepTime is set', async () => {
      renderTagLink({ name: 'Related', tags: ['ops'], keepTime: true });

      userEvent.click(screen.getByText('Related'));

      expect(await screen.findByRole('menuitem', { name: 'Service detail' })).toHaveAttribute(
        'href',
        '/projects/perses/dashboards/service%20detail?start=1h',
      );
    });
  });
});
