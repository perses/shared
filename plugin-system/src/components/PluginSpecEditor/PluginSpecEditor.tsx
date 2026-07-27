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
import { DatasourceSpec, UnknownSpec, HTTPProxy } from '@perses-dev/spec';
import { ReactElement, useMemo } from 'react';
import { produce } from 'immer';

import { DatasourcePlugin, OptionsEditorProps, Plugin } from '../../model';
import { usePlugin } from '../../runtime';
import { PluginEditorSelection } from '../PluginEditor';

export interface PluginSpecEditorProps extends Omit<OptionsEditorProps<UnknownSpec>, 'testConnection'> {
  pluginSelection: PluginEditorSelection;
  isEditor?: boolean;
  testConnection?: (spec: DatasourceSpec, healthCheckPath: string) => Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasHTTPProxy(spec: UnknownSpec): spec is { proxy: HTTPProxy } {
  return isRecord(spec) && isRecord(spec['proxy']) && spec['proxy']['kind'] === 'HTTPProxy';
}

function isDatasourcePlugin(plugin: Plugin<UnknownSpec>): plugin is DatasourcePlugin<UnknownSpec> {
  return 'createClient' in plugin;
}

export function PluginSpecEditor(props: PluginSpecEditorProps): ReactElement | null {
  const {
    pluginSelection: { type: pluginType, kind: pluginKind },
    value,
    testConnection,
    ...others
  } = props;
  const { data: plugin, isLoading, error } = usePlugin(pluginType, pluginKind);

  const healthCheckPath = plugin && isDatasourcePlugin(plugin) ? plugin.healthCheckPath : undefined;

  const boundTestConnection = useMemo((): (() => Promise<void>) | undefined => {
    if (!testConnection || !healthCheckPath) return undefined;
    return () => {
      const augmentedPluginSpec = hasHTTPProxy(value)
        ? produce(value, (draft) => {
            const existing = draft.proxy.spec.allowedEndpoints ?? [];
            const alreadyAllowed = existing.some((e) => e.endpointPattern === healthCheckPath && e.method === 'GET');
            if (!alreadyAllowed) {
              draft.proxy.spec.allowedEndpoints = [...existing, { endpointPattern: healthCheckPath, method: 'GET' }];
            }
          })
        : value;
      const spec: DatasourceSpec = { default: false, plugin: { kind: pluginKind, spec: augmentedPluginSpec } };
      return testConnection(spec, healthCheckPath);
    };
  }, [testConnection, healthCheckPath, pluginKind, value]);

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
  const { OptionsEditorComponent } = plugin;

  return OptionsEditorComponent ? (
    <OptionsEditorComponent {...others} value={value} testConnection={boundTestConnection} />
  ) : null;
}
