// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

import { useEffect, useState } from 'react';

import type { PersesPlugin, RemotePluginModule } from './PersesPlugin.types';
import { usePluginRuntime } from './PluginRuntime';

interface PluginLoaderProps<P> {
  plugin: PersesPlugin;
  props?: P;
  field?: string;
}

function PluginContainer<P>({
  pluginFn,
  props,
}: {
  pluginFn: (props: P | undefined) => JSX.Element;
  props: P | undefined;
}): JSX.Element {
  'use no memo'; // Remote plugin functions may call hooks; their invocation must run on every render.

  return pluginFn(props);
}

export function PluginLoaderComponent<P>({ plugin, props, field }: PluginLoaderProps<P>): JSX.Element | null {
  // Reset loading state and plugin hooks together whenever the remote identity changes.
  const key = JSON.stringify([plugin.moduleName, plugin.name, plugin.registry, plugin.version, plugin.baseURL]);
  return <PluginLoaderSession key={key} plugin={plugin} props={props} field={field} />;
}

function PluginLoaderSession<P>({ plugin, props, field }: PluginLoaderProps<P>): JSX.Element | null {
  const { loadPlugin } = usePluginRuntime({ plugin });
  const [pluginModule, setPluginModule] = useState<RemotePluginModule | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadPlugin()
      .then((module) => {
        if (!cancelled) setPluginModule(module);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(
          `PluginLoaderComponent: Error loading plugin ${plugin.name} from module ${plugin.moduleName}:`,
          error,
        );
        setError(
          new Error(`PluginLoaderComponent: Error loading plugin ${plugin.name} from module ${plugin.moduleName}`),
        );
      });
    return (): void => {
      cancelled = true;
    };
  }, [loadPlugin, plugin.name, plugin.moduleName]);

  if (error) {
    throw error;
  }

  if (!pluginModule) {
    return null;
  }

  let pluginFunction = pluginModule[plugin.name];

  if (field && pluginFunction && typeof pluginFunction === 'object' && field in pluginFunction) {
    pluginFunction = (pluginFunction as Record<string, unknown>)[field];
  }

  if (!pluginFunction) {
    throw new Error(`PluginLoaderComponent: Plugin module ${plugin.moduleName} does not have a ${plugin.name} export`);
  }

  if (typeof pluginFunction !== 'function') {
    throw new Error(`PluginLoaderComponent: Plugin ${plugin.name} export is not a function`);
  }

  return <PluginContainer pluginFn={pluginFunction as (props: P | undefined) => JSX.Element} props={props} />;
}
