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

import { DatasourceEditorProps, DatasourcePlugin, VariableOption, VariablePlugin } from '../../../model';

const data: VariableOption[] = [
  { label: 'Grover', value: 'Grover' },
  { label: 'Snuffleupagus', value: 'Snuffleupagus' },
];

// Dummy plugin to test loading
const ErnieVariable1: VariablePlugin<{ variableOption: string }> = {
  getVariableOptions: async () => ({ data }),
  OptionsEditorComponent: function ErnieVariableEditor({ value, onChange }) {
    return (
      <div>
        <label htmlFor="editor-input">ErnieVariable editor</label>
        <input
          type="text"
          id="editor-input"
          value={value.variableOption}
          onChange={(e) => onChange({ ...value, variableOption: e.target.value })}
        />
      </div>
    );
  },
  createInitialOptions: () => ({ variableOption: '' }),
};

const ErnieVariable2: VariablePlugin<{ variableOption2: string }> = {
  getVariableOptions: async () => ({ data }),
  OptionsEditorComponent: function ErnieVariableEditor({ value, onChange }) {
    return (
      <div>
        <label htmlFor="editor-input">ErnieVariable2 editor</label>
        <input
          type="text"
          id="editor-input"
          value={value.variableOption2}
          onChange={(e) => onChange({ ...value, variableOption2: e.target.value })}
        />
      </div>
    );
  },
  createInitialOptions: () => ({ variableOption2: '' }),
};

type ErnieDatasourceSpec = { url?: string };

const ErnieDatasource: DatasourcePlugin<ErnieDatasourceSpec> = {
  createClient: () => ({}),
  createInitialOptions: () => ({}),
  healthCheckPath: '/api/v1/query',
  OptionsEditorComponent: function ErnieDatasourceEditor({
    value,
    onChange,
    testConnection,
  }: DatasourceEditorProps<ErnieDatasourceSpec>) {
    return (
      <div>
        <label htmlFor="datasource-url">ErnieDatasource editor</label>
        <input
          type="text"
          id="datasource-url"
          value={value.url ?? ''}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
        />
        {testConnection && <button onClick={testConnection}>test-connection-trigger</button>}
      </div>
    );
  },
};

const ErnieDatasourceNoHealthCheck: DatasourcePlugin<ErnieDatasourceSpec> = {
  createClient: () => ({}),
  createInitialOptions: () => ({}),
  OptionsEditorComponent: function ErnieDatasourceNoHealthCheckEditor({
    value,
    onChange,
    testConnection,
  }: DatasourceEditorProps<ErnieDatasourceSpec>) {
    return (
      <div>
        <label htmlFor="datasource-url">ErnieDatasourceNoHealthCheck editor</label>
        <input
          type="text"
          id="datasource-url"
          value={value.url ?? ''}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
        />
        {testConnection && <button onClick={testConnection}>test-connection-trigger</button>}
      </div>
    );
  },
};

export const plugins = {
  'Variable:ErnieVariable1::1.0.0': ErnieVariable1,
  'Variable:ErnieVariable2::1.0.0': ErnieVariable2,
  'Datasource:ErnieDatasource::1.0.0': ErnieDatasource,
  'Datasource:ErnieDatasourceNoHealthCheck::1.0.0': ErnieDatasourceNoHealthCheck,
};
