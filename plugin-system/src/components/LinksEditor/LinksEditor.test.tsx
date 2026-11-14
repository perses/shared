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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { PanelEditorValues } from '../../model';
import { renderWithContext } from '../../test';
import { LinksEditor } from './LinksEditor';

const tagLink: Link = { name: 'Related', tags: ['ops'], targetBlank: true };

function Editor({ onLinks }: { onLinks: (links: Link[] | undefined) => void }): ReactElement {
  const form = useForm<PanelEditorValues>({
    defaultValues: {
      groupId: 0,
      panelDefinition: {
        kind: 'Panel',
        spec: {
          plugin: { kind: 'TimeSeriesChart', spec: {} },
          links: [tagLink],
        },
      },
    },
  });
  const links = useWatch({ control: form.control, name: 'panelDefinition.spec.links' });
  onLinks(links);
  return <LinksEditor control={form.control} />;
}

describe('LinksEditor', () => {
  test('edits a tag link without adding a url', async () => {
    let links: Link[] | undefined;
    renderWithContext(<Editor onLinks={(next) => (links = next)} />);

    expect(screen.queryByRole('textbox', { name: 'URL' })).not.toBeInTheDocument();
    const name = screen.getByRole('textbox', { name: 'Name' });
    userEvent.clear(name);
    userEvent.type(name, 'Services');

    expect(links?.[0]).toEqual({ name: 'Services', tags: ['ops'], targetBlank: true });
  });
});
