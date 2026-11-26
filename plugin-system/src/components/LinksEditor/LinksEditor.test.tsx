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

import { zodResolver } from '@hookform/resolvers/zod';
import type { Link } from '@perses-dev/spec';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import type { PanelEditorValues } from '../../model';
import { panelEditorSchema } from '../../schema';
import { renderWithContext } from '../../test';
import { LinksEditor } from './LinksEditor';

const renderComponent = (
  links: Link[],
  { validate = false }: { validate?: boolean } = {},
): { submit: () => Promise<Link[] | undefined>; onSubmit: ReturnType<typeof vi.fn> } => {
  const onSubmit = vi.fn();
  const Component = (): ReactElement => {
    const form = useForm<PanelEditorValues>({
      // Validates the links with the panel editor schema, as the panel editor does.
      resolver: validate ? zodResolver(panelEditorSchema) : undefined,
      defaultValues: {
        groupId: 0,
        panelDefinition: {
          kind: 'Panel',
          spec: { display: { name: 'Panel' }, plugin: { kind: 'TestPanel', spec: {} }, links },
        },
        layoutDefinition: { width: 12, height: 6 },
      },
    });
    return (
      // The URL field is `required`: noValidate leaves the validation to the resolver, as in the panel editor.
      <form noValidate onSubmit={form.handleSubmit((values) => onSubmit(values.panelDefinition.spec.links))}>
        <LinksEditor control={form.control} />
        <button type="submit">Save</button>
      </form>
    );
  };
  renderWithContext(<Component />);
  return {
    onSubmit,
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

  describe('with the panel editor schema', () => {
    it('saves a valid URL link', async () => {
      const { submit } = renderComponent([{ url: 'https://example.com', name: 'Example' }], { validate: true });

      expect(await submit()).toEqual([{ url: 'https://example.com', name: 'Example' }]);
    });

    it('requires a URL on a URL link', async () => {
      const { onSubmit } = renderComponent([], { validate: true });

      await userEvent.click(screen.getAllByRole('button')[0]!);
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('URL is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows the error of an invalid tag link', async () => {
      const { onSubmit } = renderComponent([{ name: '', tags: ['team-a'] }], { validate: true });

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('a tag link must set a name')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
