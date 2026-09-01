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

import { CircularProgress, Stack } from '@mui/material';
import { ErrorAlert } from '@perses-dev/components';
import type { DatasourceSpec, UnknownSpec } from '@perses-dev/spec';
import type { ReactElement } from 'react';

import type { DatasourcePlugin, OptionsEditorProps, Plugin, PluginType } from '../../model';
import { usePlugin } from '../../runtime';
import type { PluginEditorSelection } from '../PluginEditor';
import { DatasourceSpecEditor } from './DatasourceSpecEditor';

export interface PluginSpecEditorProps extends OptionsEditorProps<UnknownSpec> {
  pluginSelection: PluginEditorSelection;
  isEditor?: boolean;
  testConnection?: (spec: DatasourceSpec, healthCheckPath: string) => Promise<void>;
}

function isDatasourcePlugin(
  pluginType: PluginType,
  plugin: Plugin<UnknownSpec>,
): plugin is DatasourcePlugin<UnknownSpec> {
  return pluginType === 'Datasource' && 'createClient' in plugin;
}

export function PluginSpecEditor(props: PluginSpecEditorProps): ReactElement | null {
  const {
    pluginSelection: { type: pluginType, kind: pluginKind, metadata: pluginMetadata },
    value,
    testConnection,
    ...others
  } = props;
  // Edit the exact implementation the definition is pinned to, so the options editor matches the saved spec schema.
  const {
    data: plugin,
    isLoading,
    error,
  } = usePlugin(pluginType, pluginKind, {
    version: pluginMetadata?.version,
    registry: pluginMetadata?.registry,
  });

  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!plugin) {
    throw new Error(`Missing implementation for ${pluginType} plugin with kind '${pluginKind}'`);
  }

  if (pluginType === 'Panel') {
    throw new Error('This editor should not be used for panel type. Please use Panel Spec Editor instead.');
  }

  if (isDatasourcePlugin(pluginType, plugin)) {
    return (
      <DatasourceSpecEditor
        plugin={plugin}
        pluginKind={pluginKind}
        value={value}
        testConnection={testConnection}
        {...others}
      />
    );
  }

  const { OptionsEditorComponent } = plugin;
  return OptionsEditorComponent ? <OptionsEditorComponent {...others} value={value} /> : null;
}
