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

import type { Link } from '@perses-dev/spec';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import type { PanelEditorValues } from '../../model';
import { renderWithContext } from '../../test';
import { LinksEditor } from './LinksEditor';

const renderComponent = (links: Link[]): { submit: () => Promise<Link[] | undefined> } => {
  const onSubmit = vi.fn();
  const Component = (): ReactElement => {
    const form = useForm<PanelEditorValues>({
      defaultValues: {
        groupId: 0,
        panelDefinition: {
          kind: 'Panel',
          spec: { display: { name: 'Panel' }, plugin: { kind: 'TestPanel', spec: {} }, links },
        },
      },
    });
    return (
      <form onSubmit={form.handleSubmit((values) => onSubmit(values.panelDefinition.spec.links))}>
        <LinksEditor control={form.control} />
        <button type="submit">Save</button>
      </form>
    );
  };
  renderWithContext(<Component />);
  return {
    submit: async (): Promise<Link[] | undefined> => {
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      return onSubmit.mock.lastCall?.[0];
    },
  };
};

describe('LinksEditor', () => {
  it('edits URL links', async () => {
    const { submit } = renderComponent([{ url: 'https://example.com', name: 'Example' }]);

    await userEvent.type(screen.getByDisplayValue('https://example.com'), '/a');

    // The text field debounces its changes.
    await waitFor(async () => expect(await submit()).toEqual([{ url: 'https://example.com/a', name: 'Example' }]));
  });

  it('displays tag links without fields to edit them', async () => {
    const { submit } = renderComponent([{ name: 'Related', tags: ['team-a', 'prod'] }]);

    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Tags: team-a, prod')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(await submit()).toEqual([{ name: 'Related', tags: ['team-a', 'prod'] }]);
  });

  it('removes tag links', async () => {
    const { submit } = renderComponent([{ name: 'Related', tags: ['team-a'] }]);

    await userEvent.click(screen.getAllByRole('button')[0]!);

    expect(await submit()).toEqual([]);
  });
});
