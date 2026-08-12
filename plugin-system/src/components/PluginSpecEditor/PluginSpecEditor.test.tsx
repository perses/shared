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

import { DatasourceSpec } from '@perses-dev/spec';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithContext } from '../../test';
import { PluginSpecEditor, PluginSpecEditorProps } from './PluginSpecEditor';

describe('PluginSpecEditor', () => {
  const renderComponent = (props: PluginSpecEditorProps): void => {
    renderWithContext(<PluginSpecEditor {...props} />);
  };

  it('shows the options editor component for a plugin', async () => {
    renderComponent({ pluginSelection: { type: 'Variable', kind: 'ErnieVariable1' }, value: {}, onChange: jest.fn() });
    const editor = await screen.findByLabelText('ErnieVariable editor');
    expect(editor).toBeInTheDocument();
  });

  it('propagates value changes', async () => {
    const onChange = jest.fn();
    renderComponent({
      pluginSelection: { type: 'Variable', kind: 'ErnieVariable1' },
      value: { variableOption: 'Option1Value' },
      onChange,
    });

    const editor = await screen.findByLabelText('ErnieVariable editor');
    expect(editor).toHaveValue('Option1Value');
    userEvent.clear(editor);
    expect(onChange).toHaveBeenCalledWith({ variableOption: '' });
  });

  it('shows an error if plugin fails to load', async () => {
    renderComponent({ pluginSelection: { type: 'Variable', kind: 'DoesNotExist' }, value: {}, onChange: jest.fn() });
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/doesnotexist/i);
  });

  it('should throw an error if panel type is used', () => {
    try {
      renderComponent({ pluginSelection: { type: 'Panel', kind: 'TimeSeriesChart' }, value: {}, onChange: jest.fn() });
    } catch (e) {
      expect(e).toBe('This editor should not be used for panel type. Please use Panel Spec Editor instead.');
    }
  });
});

describe('PluginSpecEditor - boundTestConnection', () => {
  const renderComponent = (props: PluginSpecEditorProps): void => {
    renderWithContext(<PluginSpecEditor {...props} />);
  };

  it('does not pass testConnection when testConnection prop is absent', async () => {
    renderComponent({
      pluginSelection: { type: 'Datasource', kind: 'ErnieDatasource' },
      value: { url: 'http://localhost:9090' },
      onChange: jest.fn(),
    });
    await screen.findByLabelText('ErnieDatasource editor');
    expect(screen.queryByRole('button', { name: 'test-connection-trigger' })).not.toBeInTheDocument();
  });

  it('does not pass testConnection when plugin has no healthCheckPath', async () => {
    const testConnection = jest.fn();
    renderComponent({
      pluginSelection: { type: 'Datasource', kind: 'ErnieDatasourceNoHealthCheck' },
      value: {},
      onChange: jest.fn(),
      testConnection,
    });
    await screen.findByLabelText('ErnieDatasourceNoHealthCheck editor');
    expect(screen.queryByRole('button', { name: 'test-connection-trigger' })).not.toBeInTheDocument();
  });

  it('passes a bound testConnection when plugin has healthCheckPath', async () => {
    const testConnection = jest.fn().mockResolvedValue(undefined);
    renderComponent({
      pluginSelection: { type: 'Datasource', kind: 'ErnieDatasource' },
      value: { url: 'http://localhost:9090' },
      onChange: jest.fn(),
      testConnection,
    });
    await screen.findByLabelText('ErnieDatasource editor');
    expect(screen.getByRole('button', { name: 'test-connection-trigger' })).toBeInTheDocument();
  });

  it('calls testConnection with the full DatasourceSpec and healthCheckPath', async () => {
    const testConnection = jest.fn().mockResolvedValue(undefined);
    const pluginSpec = { url: 'http://localhost:9090' };
    renderComponent({
      pluginSelection: { type: 'Datasource', kind: 'ErnieDatasource' },
      value: pluginSpec,
      onChange: jest.fn(),
      testConnection,
    });
    await screen.findByLabelText('ErnieDatasource editor');
    await userEvent.click(screen.getByRole('button', { name: 'test-connection-trigger' }));

    await waitFor(() => {
      expect(testConnection).toHaveBeenCalledWith(
        expect.objectContaining<Partial<DatasourceSpec>>({
          default: false,
          plugin: { kind: 'ErnieDatasource', spec: pluginSpec },
        }),
        '/api/v1/query',
      );
    });
  });

  it('augments allowedEndpoints with the healthCheckPath when proxy spec is present', async () => {
    const testConnection = jest.fn().mockResolvedValue(undefined);
    const pluginSpec = {
      proxy: {
        kind: 'HTTPProxy' as const,
        spec: { url: 'http://localhost:9090', allowedEndpoints: [] },
      },
    };
    renderComponent({
      pluginSelection: { type: 'Datasource', kind: 'ErnieDatasource' },
      value: pluginSpec,
      onChange: jest.fn(),
      testConnection,
    });
    await screen.findByLabelText('ErnieDatasource editor');
    await userEvent.click(screen.getByRole('button', { name: 'test-connection-trigger' }));

    await waitFor(() => {
      const calledSpec: DatasourceSpec = testConnection.mock.calls[0][0];
      const allowedEndpoints = (calledSpec.plugin.spec as typeof pluginSpec).proxy.spec.allowedEndpoints;
      expect(allowedEndpoints).toContainEqual({ endpointPattern: '/api/v1/query', method: 'GET' });
    });
  });

  it('does not duplicate allowedEndpoints when healthCheckPath already present', async () => {
    const testConnection = jest.fn().mockResolvedValue(undefined);
    const pluginSpec = {
      proxy: {
        kind: 'HTTPProxy' as const,
        spec: {
          url: 'http://localhost:9090',
          allowedEndpoints: [{ endpointPattern: '/api/v1/query', method: 'GET' }],
        },
      },
    };
    renderComponent({
      pluginSelection: { type: 'Datasource', kind: 'ErnieDatasource' },
      value: pluginSpec,
      onChange: jest.fn(),
      testConnection,
    });
    await screen.findByLabelText('ErnieDatasource editor');
    await userEvent.click(screen.getByRole('button', { name: 'test-connection-trigger' }));

    await waitFor(() => {
      const calledSpec: DatasourceSpec = testConnection.mock.calls[0][0];
      const allowedEndpoints = (calledSpec.plugin.spec as typeof pluginSpec).proxy.spec.allowedEndpoints;
      expect(allowedEndpoints?.filter((e) => e.endpointPattern === '/api/v1/query')).toHaveLength(1);
    });
  });
});
