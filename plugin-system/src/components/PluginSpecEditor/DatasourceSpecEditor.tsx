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

import { hasHTTPProxy } from '@perses-dev/client';
import { DatasourceSpec, UnknownSpec } from '@perses-dev/spec';
import { produce } from 'immer';
import { ReactElement, useMemo } from 'react';

import { DatasourcePlugin, OptionsEditorProps } from '../../model';

export interface DatasourceSpecEditorProps extends OptionsEditorProps<UnknownSpec> {
  plugin: DatasourcePlugin;
  pluginKind: string;
  testConnection?: (spec: DatasourceSpec, healthCheckPath: string) => Promise<void>;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function DatasourceSpecEditor({
  plugin,
  pluginKind,
  value,
  testConnection,
  ...others
}: DatasourceSpecEditorProps): ReactElement | null {
  const healthCheckPath = plugin.healthCheckPath;

  const boundTestConnection = useMemo((): (() => Promise<void>) | undefined => {
    if (!testConnection || !healthCheckPath) return undefined;
    return () => {
      const escapedPattern = escapeRegExp(healthCheckPath);
      const augmentedPluginSpec = hasHTTPProxy(value)
        ? produce(value, (draft) => {
            const existing = draft.proxy.spec.allowedEndpoints ?? [];
            const alreadyAllowed = existing.some((e) => e.endpointPattern === escapedPattern && e.method === 'GET');
            if (!alreadyAllowed) {
              draft.proxy.spec.allowedEndpoints = [...existing, { endpointPattern: escapedPattern, method: 'GET' }];
            }
          })
        : value;
      const spec: DatasourceSpec = { default: false, plugin: { kind: pluginKind, spec: augmentedPluginSpec } };
      return testConnection(spec, healthCheckPath);
    };
  }, [testConnection, healthCheckPath, pluginKind, value]);

  const { OptionsEditorComponent } = plugin;
  return OptionsEditorComponent ? (
    <OptionsEditorComponent {...others} value={value} testConnection={boundTestConnection} />
  ) : null;
}
