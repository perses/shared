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

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { PanelEditorValues } from '../../model';
import { VariableContext } from '../../runtime';
import { renderWithContext } from '../../test';
import { LayoutEditor, LayoutEditorProps } from './LayoutEditor';

describe('LayoutEditor', () => {
  const renderComponent = (
    props: Omit<LayoutEditorProps, 'control'>,
    defaultValues?: Partial<PanelEditorValues>,
  ): void => {
    const Component = (): ReactElement => {
      const form = useForm<PanelEditorValues>({ defaultValues });
      return (
        <FormProvider {...form}>
          <VariableContext.Provider value={{ state: {} }}>
            <LayoutEditor {...props} control={form.control} />
          </VariableContext.Provider>
        </FormProvider>
      );
    };
    renderWithContext(<Component />);
  };

  it('should render repeat variable, alignment, and max per row fields', async () => {
    renderComponent({ variableDefinitionGroups: [] });

    expect(await screen.findByLabelText('Repeat Variable')).toBeInTheDocument();
    expect(screen.getByLabelText('Alignment')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Per Row')).toBeInTheDocument();
  });

  it('should only show list variables with allowMultiple in the repeat variable dropdown', async () => {
    renderComponent({
      variableDefinitionGroups: [
        {
          definitions: [
            {
              kind: 'ListVariable',
              spec: {
                name: 'env',
                allowMultiple: true,
                allowAllValue: false,
                plugin: { kind: 'StaticListVariable', spec: { values: [] } },
              },
            },
            {
              kind: 'ListVariable',
              spec: {
                name: 'region',
                allowMultiple: false,
                allowAllValue: false,
                plugin: { kind: 'StaticListVariable', spec: { values: [] } },
              },
            },
            { kind: 'TextVariable', spec: { name: 'search', value: '' } },
          ],
        },
      ],
    });

    await userEvent.click(await screen.findByLabelText('Repeat Variable'));

    expect(await screen.findByRole('option', { name: 'env' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'region' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'search' })).not.toBeInTheDocument();
  });

  it('should render group selector when panelGroups are provided', async () => {
    renderComponent({
      variableDefinitionGroups: [],
      panelGroups: [
        { id: 1, title: 'CPU Stats' },
        { id: 2, title: 'Disk Stats' },
      ],
    });

    expect(await screen.findByLabelText(/Group/)).toBeInTheDocument();
  });

  it('should not render group selector when panelGroups is not provided', async () => {
    renderComponent({ variableDefinitionGroups: [] });

    expect(await screen.findByLabelText('Repeat Variable')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Group$/)).not.toBeInTheDocument();
  });

  it('should list all panel groups in the group selector and update the form value on selection', async () => {
    let capturedGroupId: number | undefined;
    const Component = (): ReactElement => {
      const form = useForm<PanelEditorValues>({ defaultValues: { groupId: 1 } });
      capturedGroupId = form.watch('groupId');
      return (
        <FormProvider {...form}>
          <VariableContext.Provider value={{ state: {} }}>
            <LayoutEditor
              control={form.control}
              variableDefinitionGroups={[]}
              panelGroups={[{ id: 1, title: 'CPU Stats' }, { id: 2, title: 'Disk Stats' }, { id: 3 }]}
            />
          </VariableContext.Provider>
        </FormProvider>
      );
    };
    renderWithContext(<Component />);

    await userEvent.click(await screen.findByLabelText(/Group/));

    expect(await screen.findByRole('option', { name: 'CPU Stats' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Disk Stats' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Group 3' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('option', { name: 'Disk Stats' }));

    expect(capturedGroupId).toBe(2);
  });

  it('should show layout preview when a variable with options is selected', async () => {
    const Component = (): ReactElement => {
      const form = useForm<PanelEditorValues>({
        defaultValues: {
          layoutDefinition: {
            width: 12,
            height: 6,
            repeatVariable: { value: 'env', alignment: 'horizontal' },
          },
        },
      });
      return (
        <FormProvider {...form}>
          <VariableContext.Provider
            value={{
              state: {
                env: {
                  value: 'prod',
                  options: [
                    { value: 'prod', label: 'prod' },
                    { value: 'dev', label: 'dev' },
                  ],
                  loading: false,
                },
              },
            }}
          >
            <LayoutEditor control={form.control} variableDefinitionGroups={[]} />
          </VariableContext.Provider>
        </FormProvider>
      );
    };
    renderWithContext(<Component />);

    expect(await screen.findByText('Layout preview (2 panels)')).toBeInTheDocument();
  });
});
